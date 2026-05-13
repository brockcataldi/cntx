import {
	type ElementNode,
	type DocumentNode,
	type ParseState,
	NodeType,
} from "./types.js";

import { 
	isEndOfFile, 
	skipWhitespace 
} from "./utilities.js";

export const parse = (raw: string): DocumentNode => {
	const parseState: ParseState = {
		raw,
		cursor: 0,
	};

	const elements: ElementNode[] = [];

	skipWhitespace(parseState);

	// while (!isEndOfFile(parseState)) {
	// 	elements.push(parseElement(parseState));
	// 	skipWhitespace(parseState);
	// }

	return {
		type: NodeType.DOCUMENT,
		children: elements,
	};
};

export const parseElement = (state: ParseState): ElementNode => {
	console.log(state);

	return {
		type: NodeType.ELEMENT,
		tag: {
			tag: "p",
			attributes: {},
		},
		block: {
			type: NodeType.EMPTY,
		},
	};
};


export const parseTag = () => {}

export const parseBlock = () => {}