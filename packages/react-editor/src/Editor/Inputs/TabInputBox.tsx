import * as React from "react";
import { IObject } from "@daybrush/utils";
import Input from "./Input";
import { prefix } from "../../utils";
import "./TabInputBox.css";

export default class TabInputBox extends React.PureComponent<{
    type: "half" | "full" | "third" | "twothird",
    onChange: (v: any) => any,
    input: typeof Input,
    label?: string,
    inputProps?: IObject<any>,
}> {
    public input = React.createRef<Input>();
    public render() {
        const {
            label,
            type,
            inputProps = {},
            input: InputType,
            onChange,
        } = this.props;

        return <div className={prefix("tab-input", type)}>
            {label && <h3>{label}</h3>}
            <InputType ref={this.input} onChange={onChange} inputProps={inputProps}></InputType>
        </div>;
    }
    public setValue(v: any) {
        this.input.current!.setValue(v);
    }
    public getValue() {
        return this.input.current!.getValue();
    }
}
