import {
	type ElementNode,
	type DocumentNode,
	type ParseState,
	Characters,
	NodeType,
	Tag,
} from "./types.js";

import {
	consume,
	expect,
	findTagEnd,
	isEndOfFile,
	peek,
	skipWhitespace,
	slide,
} from "./utilities.js";

import { extractTag } from "./functions/extractTag.js";
import { extractAttributes } from "./functions/extractAttributes.js";

export const parse = (raw: string): DocumentNode => {
	const parseState: ParseState = {
		raw,
		cursor: 0,
	};

	const elements: ElementNode[] = [];

	skipWhitespace(parseState);

	// while (!isEndOfFile(parseState)) {
	elements.push(parseElement(parseState));
	skipWhitespace(parseState);
	// }

	return {
		type: NodeType.DOCUMENT,
		children: elements,
	};
};

export const parseElement = (state: ParseState): ElementNode => {
	const tag = parseTag(state);

	return {
		type: NodeType.ELEMENT,
		tag,
		block: {
			type: NodeType.EMPTY,
		},
	};
};

// [<][tagname][?#id][?.class] [attribute][?[=]["][value]["]]>

export const parseTag = (state: ParseState): Tag => {
	expect(state, Characters.LessThan);

	const end = findTagEnd(state);

	if (end === -1) {
		throw new Error("Couldn't find Closing Tag");
	}

	const data = peek(state, end - 1);
	const [tag, leftover, tagAttributes] = extractTag(data);
	const attributes = extractAttributes(leftover);

	slide(state, end);

	return {
		tag: tag,
		attributes: {
			...attributes,
			...tagAttributes,
		},
	};
};

export const parseBlock = () => {};
