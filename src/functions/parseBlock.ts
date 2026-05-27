import {
	type ParseState,
	NodeType,
	BlockNode,
	CharacterCodes,
} from "../types.js";

import { isFenceOpen } from "../utilities/checks.js";

import { peek, peekCode, fastForward } from "../utilities/parser.js";

import { parseFence } from "./parseFence.js";
import { parseFlow } from "./parseFlow.js";

export const parseBlock = (state: ParseState): BlockNode => {
	const possibleFence = peek(state, 3);

	if (isFenceOpen(possibleFence)) {
		fastForward(state, 3);
		return parseFence(state);
	}

	const possibleFlow = peekCode(state);
	if (possibleFlow === CharacterCodes.CurlyBraceOpen) {
		fastForward(state, 1);
		return parseFlow(state);
	}

	return {
		type: NodeType.EMPTY,
	};
};
