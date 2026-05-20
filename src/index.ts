import {
	type DocumentNode,
	type ElementNode,
	type ParseState,
	NodeType,
} from "./types.js";

import {
	isEndOfFile,
	skipWhitespace,
} from "./utilities.js";

import { parseNode } from "./functions/parseNode.js";

export const parse = (raw: string): DocumentNode => {
	const parseState: ParseState = {
		raw,
		cursor: 0,
	};

	const children: ElementNode[] = [];

	skipWhitespace(parseState);

	while (!isEndOfFile(parseState)) {
		const node = parseNode(parseState);

		if (node !== null) {
			children.push(node);
		}

		skipWhitespace(parseState);
	}

	return {
		type: NodeType.DOCUMENT,
		children,
	};
};


