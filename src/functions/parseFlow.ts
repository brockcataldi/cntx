import {
	type ParseState,
	NodeType,
	FlowBlockNode,
	Quote,
	CharacterCodes,
	EmptyNodeBlock,
	FlowChild,
} from "../types.js";

import {
	checkpoint,
	grab,
	isEndOfFile,
	extract,
	rewind,
} from "../utilities.js";

import { parseElement } from "./parseElement.js";

export const parseFlow = (
    state: ParseState,
    quote: number,
): FlowBlockNode | EmptyNodeBlock => {
    const children: FlowChild[] = [];
    let nodeStart = checkpoint(state);

    while (!isEndOfFile(state)) {
        const code = grab(state);

        if (code === CharacterCodes.LessThan) {
            if (checkpoint(state) - 1 - nodeStart > 0) {
                children.push({
                    type: NodeType.TEXT,
                    content: extract(state, nodeStart, checkpoint(state) - 1),
                });
            }

            rewind(state);
            children.push(parseElement(state));
            nodeStart = checkpoint(state);
        }

        if (code === quote) {
            if (checkpoint(state) - 1 - nodeStart > 0) {
                children.push({
                    type: NodeType.TEXT,
                    content: extract(state, nodeStart, checkpoint(state) - 1),
                });
            }

            break;
        }
    }

    if (children.length === 0) {
        return {
            type: NodeType.EMPTY,
        };
    }

    return {
        type: NodeType.FLOW,
        quote: String.fromCharCode(quote) as Quote,
        children,
    };
};