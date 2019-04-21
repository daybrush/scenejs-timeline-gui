import Scene, { AnimatorState, SceneItem } from "scenejs";
import { ITERATION_COUNT, DELAY, PLAY_SPEED, DIRECTION, REVERSE, ALTERNATE, ALTERNATE_REVERSE } from "./consts";
import { TimelineInfo } from "./types";
import { isScene } from "./utils";
import { isUndefined, isObject } from "@daybrush/utils";

export const MAXIMUM = 1000000;
export function toFixed(num: number) {
    return Math.round(num * MAXIMUM) / MAXIMUM;
}
export function addEntry(entries: number[][], time: number, keytime: number) {
    const prevEntry = entries[entries.length - 1];

    (!prevEntry || prevEntry[0] !== time || prevEntry[1] !== keytime) &&
        entries.push([toFixed(time), toFixed(keytime)]);
}
export function dotNumber(a1: number, a2: number, b1: number, b2: number) {
    return (a1 * b2 + a2 * b1) / (b1 + b2);
  }
export function getEntries(times: number[], states: AnimatorState[]) {
    let entries = times.map(time => ([time, time]));
    let nextEntries = [];

    states.forEach(state => {
        const iterationCount = state[ITERATION_COUNT] as number;
        const delay = state[DELAY];
        const playSpeed = state[PLAY_SPEED];
        const direction = state[DIRECTION];
        const intCount = Math.ceil(iterationCount);
        const currentDuration = entries[entries.length - 1][0];
        const length = entries.length;
        const lastTime = currentDuration * iterationCount;

        for (let i = 0; i < intCount; ++i) {
            const isReverse =
                direction === REVERSE ||
                direction === ALTERNATE && i % 2 ||
                direction === ALTERNATE_REVERSE && !(i % 2);

            for (let j = 0; j < length; ++j) {
                const entry = entries[isReverse ? length - j - 1 : j];
                const time = entry[1];
                const currentTime = currentDuration * i + (isReverse ? currentDuration - entry[0] : entry[0]);
                const prevEntry = entries[isReverse ? length - j : j - 1];

                if (currentTime > lastTime) {
                    if (j !== 0) {
                        const prevTime = currentDuration * i +
                            (isReverse ? currentDuration - prevEntry[0] : prevEntry[0]);
                        const divideTime = dotNumber(prevEntry[1], time, lastTime - prevTime, currentTime - lastTime);

                        addEntry(nextEntries, (delay + currentDuration * iterationCount) / playSpeed, divideTime);
                    }
                    break;
                } else if (currentTime === lastTime && nextEntries[nextEntries.length - 1][0] === lastTime + delay) {
                    break;
                }
                addEntry(nextEntries, (delay + currentTime) / playSpeed, time);
            }
        }
        // delay time
        delay && nextEntries.unshift([0, nextEntries[0][1]]);

        entries = nextEntries;
        nextEntries = [];
    });

    return entries;
}
export function getItemInfo(
    timelineInfo: TimelineInfo,
    items: Array<Scene | SceneItem>,
    names: Array<string | number>,
    item: SceneItem) {
    item.update();
    const times = item.times;
    const entries = getEntries(times, items.map(animator => animator.state));

    (function getPropertyInfo(itemNames: any, ...properties: any[]) {
        const frames = [];
        const isParent = isObject(itemNames);
        entries.forEach(([time, iterationTime]) => {
            const value = item.get(iterationTime, ...properties);
            if (isUndefined(value)) {
                return;
            }
            frames.push([time, iterationTime, value]);
        });
        timelineInfo[[...names, ...properties].join("///")] = {
            isParent,
            item,
            names,
            properties,
            frames,
        };
        if (isParent) {
            for (const property in itemNames) {
                getPropertyInfo(itemNames[property], ...properties, property);
            }
        }
    })(item.names);
}
export function getTimelineInfo(scene: Scene): TimelineInfo {
    const timelineInfo: TimelineInfo = {};
    (function sceneForEach(...items: Array<Scene | SceneItem>) {
        const lastItem = items[items.length - 1];
        const names = items.slice(1).map(item => item.getId());
        if (isScene(lastItem)) {
            if (names.length) {
                timelineInfo[names.join("///")] = {
                    isParent: true,
                    item: lastItem,
                    names: [],
                    properties: [],
                    frames: [],
                };
            }
            lastItem.forEach((item: Scene | SceneItem) => {
                sceneForEach(...items, item);
            });
        } else {
            getItemInfo(timelineInfo, items, names, lastItem);
        }
    })(scene);

    return timelineInfo;
}
