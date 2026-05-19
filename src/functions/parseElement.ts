import {
	type ElementNode,
	type ParseState,
	NodeType,
	CharacterCodes,
} from "../types.js";

import {
    isParentFlowClosingQuote,
	peekCode,
	skipWhitespace,
} from "../utilities.js";

import { parseBlock } from "./parseBlock.js";
import { parseTag } from "./parseTag.js";

export const parseElement = (
	state: ParseState,
	parentQuote?: number,
): ElementNode => {
    const tag = parseTag(state);
    skipWhitespace(state);

    const next = peekCode(state);

    if (next === CharacterCodes.LessThan) {
        return {
            type: NodeType.ELEMENT,
            tag,
            block: {
                type: NodeType.EMPTY,
            },
        };
    }

    if (
        parentQuote !== undefined &&
        isParentFlowClosingQuote(state, parentQuote)
    ) {
        return {
            type: NodeType.ELEMENT,
            tag,
            block: {
                type: NodeType.EMPTY,
            },
        };
    }

    const block = parseBlock(state);

    return {
        type: NodeType.ELEMENT,
        tag,
        block,
    };
};
