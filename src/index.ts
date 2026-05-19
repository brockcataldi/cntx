import {
	type ElementNode,
	type DocumentNode,
	type ParseState,
	NodeType,
} from "./types.js";

import {
	isEndOfFile,
	skipWhitespace,
} from "./utilities.js";

import { parseElement } from "./functions/parseElement.js";

export const parse = (raw: string): DocumentNode => {
	const parseState: ParseState = {
		raw,
		cursor: 0,
	};

	const children: ElementNode[] = [];

	skipWhitespace(parseState);

	while (!isEndOfFile(parseState)) {
		children.push(parseElement(parseState));
		skipWhitespace(parseState);
	}

	return {
		type: NodeType.DOCUMENT,
		children,
	};
};


