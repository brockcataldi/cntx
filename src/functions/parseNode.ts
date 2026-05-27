import {
	type ElementNode,
	type ParseState,
	NodeType,
	CharacterCodes,
} from "../types.js";

import { peekCode, skipWhitespace } from "../utilities/parser.js";

import { isCommentTag } from "../utilities/checks.js";

import { parseBlock } from "./parseBlock.js";
import { parseTag } from "./parseTag.js";

export const parseNode = (state: ParseState): ElementNode | null => {
	const tag = parseTag(state);

	skipWhitespace(state);

	if (isCommentTag(tag.tag)) {
		parseBlock(state);
		return null;
	}

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

	const block = parseBlock(state);

	return {
		type: NodeType.ELEMENT,
		tag,
		block,
	};
};
