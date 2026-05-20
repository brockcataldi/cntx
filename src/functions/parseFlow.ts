import {
	type ParseState,
	NodeType,
	FlowBlockNode,
	Quote,
	CharacterCodes,
	EmptyNodeBlock,
	FlowChild,
	ErrorMessages,
} from "../types.js";

import {
	checkpoint,
	decodeEscaped,
	extract,
	grab,
	isEndOfFile,
	rewind,
	skipEscapeSequence,
} from "../utilities.js";

import { parseNode } from "./parseNode.js";

export const parseFlow = (
    state: ParseState,
    quote: number,
): FlowBlockNode | EmptyNodeBlock => {
    const children: FlowChild[] = [];
    let nodeStart = checkpoint(state);
    let closed = false;

    while (!isEndOfFile(state)) {
        const code = grab(state);

        if (code === CharacterCodes.Backslash) {
            skipEscapeSequence(state, quote);
            continue;
        }

        if (code === CharacterCodes.LessThan) {
            if (checkpoint(state) - 1 - nodeStart > 0) {
                children.push({
                    type: NodeType.TEXT,
                    content: decodeEscaped(
                        extract(state, nodeStart, checkpoint(state) - 1),
                        quote,
                    ),
                });
            }

            rewind(state);
            const node = parseNode(state, quote);

            if (node !== null) {
                children.push(node);
            }

            nodeStart = checkpoint(state);
            continue;
        }

        if (code === quote) {
            if (checkpoint(state) - 1 - nodeStart > 0) {
                children.push({
                    type: NodeType.TEXT,
                    content: decodeEscaped(
                        extract(state, nodeStart, checkpoint(state) - 1),
                        quote,
                    ),
                });
            }

            closed = true;
            break;
        }
    }

    if (!closed) {
        throw new Error(ErrorMessages.UNEXPECTED_END_OF_FILE);
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