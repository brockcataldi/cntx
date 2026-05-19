import {
	type ParseState,
	NodeType,
	BlockNode,
} from "../types.js";

import {
	isFence,
	isQuote,
	peek,
	peekCode,
	fastForward,
} from "../utilities.js";

import { parseFence } from "./parseFence.js";
import { parseFlow } from "./parseFlow.js";

export const parseBlock = (state: ParseState): BlockNode => {
    const possibleFence = peek(state, 3);

    if (isFence(possibleFence)) {
        const quote = peekCode(state);
        fastForward(state, 3);
        return parseFence(state, quote);
    }

    const possibleFlow = peekCode(state);
    if (isQuote(possibleFlow)) {
        fastForward(state, 1);
        return parseFlow(state, possibleFlow);
    }

    return {
        type: NodeType.EMPTY,
    };
};
