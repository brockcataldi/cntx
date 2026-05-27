import {
	type ElementNode,
	type ParseState,
	NodeType,
	CharacterCodes,
	ErrorMessages,
} from "../types.js";

import {
	isParentFlowClosingQuote,
	peek,
	peekCode,
	skipWhitespace,
} from "../utilities/parser.js";

import { isCommentTag, isFence, isQuote } from "../utilities/checks.js";

import { ParseError } from "../errors.js";

import { parseBlock } from "./parseBlock.js";
import { parseTag } from "./parseTag.js";

const commentBlockRequired = (state: ParseState, tagStart: number) =>
	new ParseError({
		code: ErrorMessages.COMMENT_BLOCK_REQUIRED,
		source: state.raw,
		index: tagStart,
		length: Math.max(1, state.cursor - tagStart),
		label: "comment without a block",
		hint: "comment tags (`<!...>`) must be followed by a flow block or a literal fence",
	});

export const parseNode = (
	state: ParseState,
	parentQuote?: number,
): ElementNode | null => {
	const tagStart = state.cursor;
	const tag = parseTag(state);
	skipWhitespace(state);

	const next = peekCode(state);

	if (next === CharacterCodes.LessThan) {
		if (isCommentTag(tag.tag)) {
			throw commentBlockRequired(state, tagStart);
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
			throw commentBlockRequired(state, tagStart);
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
			throw commentBlockRequired(state, tagStart);
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
