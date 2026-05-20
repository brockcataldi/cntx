import {
	type ElementNode,
	type ParseState,
	NodeType,
	CharacterCodes,
	ErrorMessages,
} from "../types.js";

import {
	isCommentTag,
	isFence,
	isParentFlowClosingQuote,
	isQuote,
	peek,
	peekCode,
	skipWhitespace,
} from "../utilities.js";

import { parseBlock } from "./parseBlock.js";
import { parseTag } from "./parseTag.js";

export const parseNode = (
	state: ParseState,
	parentQuote?: number,
): ElementNode | null => {
	const tag = parseTag(state);
	skipWhitespace(state);

	const next = peekCode(state);

	if (next === CharacterCodes.LessThan) {
		if (isCommentTag(tag.tag)) {
			throw new Error(ErrorMessages.COMMENT_BLOCK_REQUIRED);
		}

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
		if (isCommentTag(tag.tag)) {
			throw new Error(ErrorMessages.COMMENT_BLOCK_REQUIRED);
		}

		return {
			type: NodeType.ELEMENT,
			tag,
			block: {
				type: NodeType.EMPTY,
			},
		};
	}

	if (isCommentTag(tag.tag)) {
		const fence = peek(state, 3);

		if (!isFence(fence) && !isQuote(peekCode(state))) {
			throw new Error(ErrorMessages.COMMENT_BLOCK_REQUIRED);
		}

		parseBlock(state);
		return null;
	}

	const block = parseBlock(state);

	return {
		type: NodeType.ELEMENT,
		tag,
		block,
	};
};
