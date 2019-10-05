import * as React from "react";
import styled from "react-css-styler";
import { EDITOR_CSS } from "./consts";
import { prefix } from "../utils";
import Ruler from "./Ruler";
import { ref } from "framework-utils";
import Viewer from "./Viewer";
import Guidelines from "./Guidelines";

const EditorElement = styled("div", EDITOR_CSS);

export default class Editor extends React.PureComponent {
    public state = {
        horizontalRange: [0, 5],
        verticalRange: [0, 5],
    };
    private viewer!: Viewer;
    private horizontalRuler!: Ruler;
    private verticalRuler!: Ruler;
    private horizontalGuidelines!: Guidelines;
    private verticalGuidelines!: Guidelines;
    public render() {
        const {
            verticalRange: [verticalMin, verticalMax],
            horizontalRange: [horizontalMin, horizontalMax],
        } = this.state;
        return (
            <EditorElement className="scenejs-editor">
                <div className={prefix("box")} onClick={this.restoreScroll}></div>
                <Ruler ref={ref(this, "horizontalRuler")}
                    type="horizontal" min={horizontalMin} max={horizontalMax}
                    dragStart={this.dragStartHorizontal}
                    drag={this.dragHorizontal}
                    dragEnd={this.dragEndHorizontal}
                />
                <Ruler ref={ref(this, "verticalRuler")}
                    type="vertical" min={verticalMin} max={verticalMax}
                    dragStart={this.dragStartVertical}
                    drag={this.dragVertical}
                    dragEnd={this.dragEndVertical} />
                <Guidelines ref={ref(this, "horizontalGuidelines")}
                    setGuidelines={this.setGuidelines}
                    type="horizontal" />
                <Guidelines ref={ref(this, "verticalGuidelines")}
                    setGuidelines={this.setGuidelines}
                    type="vertical" />
                <Viewer ref={ref(this, "viewer")}
                    horizontalMin={horizontalMin} horizontalMax={horizontalMax}
                    verticalMin={verticalMin} verticalMax={verticalMax}
                    onScroll={this.onScroll}
                    width={"500px"}
                    height={"500px"}
                >{this.props.children}</Viewer>
            </EditorElement>
        );
    }
    public componentDidMount() {
        this.viewer.onResize();
        this.onScroll();
    }
    private restoreScroll = () => {
        this.viewer.restoreScroll();
    }
    private onScroll = () => {
        const [scrollLeft, scrollTop] = this.viewer.getScrollPos();

        this.scroll(scrollLeft, scrollTop);
    }
    private dragStartHorizontal = e => {
        this.horizontalGuidelines.dragStartToAdd(e);
    }
    private dragHorizontal = e => {
        this.horizontalGuidelines.drag(e);
    }
    private dragEndHorizontal = e => {
        this.horizontalGuidelines.dragEnd(e);
    }
    private dragStartVertical = e => {
        this.verticalGuidelines.dragStartToAdd(e);
    }
    private dragVertical = e => {
        this.verticalGuidelines.drag(e);
    }
    private dragEndVertical = e => {
        this.verticalGuidelines.dragEnd(e);
    }
    private setGuidelines = () => {
        const verticalGuidelines = this.verticalGuidelines.getGuidelines();
        const horizontalGuidelines = this.horizontalGuidelines.getGuidelines();

        console.log(verticalGuidelines, horizontalGuidelines);
    }
    private scroll(scrollLeft: number, scrollTop: number) {
        const {
            horizontalRange: stateHorizontalRange,
            verticalRange: stateVerticalRange,
        } = this.state;
        const width = this.viewer.width;
        const height = this.viewer.height;

        const stateLeft = stateHorizontalRange[0] * 50;
        const stateTop = stateVerticalRange[0] * 50;

        const relativeLeft = scrollLeft + stateLeft;
        const relativeTop = scrollTop + stateTop;

        const boundLeft = relativeLeft - 100;
        const boundTop = relativeTop - 100;
        const boundRight = relativeLeft + width + 100;
        const boundBottom = relativeTop + height + 100;

        const horizontalRange = [
            Math.min(Math.floor(boundLeft / 200) * 4, -4, stateHorizontalRange[0]),
            Math.max(Math.ceil(boundRight / 200) * 4, Math.ceil(width / 50) + 4),
        ];
        const verticalRange = [
            Math.min(Math.floor(boundTop / 200) * 4, -4, stateVerticalRange[0]),
            Math.max(Math.ceil(boundBottom / 200) * 4, Math.ceil(height / 50) + 4),
        ];

        const offsetLeft = (stateHorizontalRange[0] - horizontalRange[0]) * 50;
        const offsetTop = (stateVerticalRange[0] - verticalRange[0]) * 50;

        this.horizontalRuler.scroll(relativeLeft);
        this.verticalRuler.scroll(relativeTop);

        this.horizontalGuidelines.scroll(relativeTop);
        this.verticalGuidelines.scroll(relativeLeft);

        if (
            !offsetLeft
            && !offsetTop
            && horizontalRange[1] === stateHorizontalRange[1]
            && verticalRange[1] === stateVerticalRange[1]
        ) {
            return false;
        }
        this.setState({
            horizontalRange,
            verticalRange,
        }, () => {
            if (offsetLeft || offsetTop) {
                const nextScrollLeft = scrollLeft + offsetLeft;
                const nextScrollTop = scrollTop + offsetTop;

                this.viewer.scroll(nextScrollLeft, nextScrollTop);
            }
        });

        return true;
    }
}
