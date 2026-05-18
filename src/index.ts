import {
	type ElementNode,
	type DocumentNode,
	type ParseState,
	NodeType,
	Tag,
	ErrorMessages,
	BlockNode,
	FlowBlockNode,
	Quote,
	CharacterCodes,
	EmptyNodeBlock,
	LiteralBlockNode,
	FlowChild,
} from "./types.js";

import {
	checkpoint,
	grab,
	isEndOfFile,
	isFence,
	isQuote,
	peek,
	peekCode,
	skipWhitespace,
	fastForward,
	extract,
	rewind,
} from "./utilities.js";

import { extractTag } from "./functions/extractTag.js";
import { extractAttributes } from "./functions/extractAttributes.js";
import { findTagEnd } from "./functions/findTagEnd.js";

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

	const block = parseBlock(state);

	return {
		type: NodeType.ELEMENT,
		tag,
		block,
	};
};

export const parseTag = (state: ParseState): Tag => {
	const next = peekCode(state);

	if (next !== CharacterCodes.LessThan) {
		throw new Error(ErrorMessages.UNEXPECTED_CHARACTER);
	}

	fastForward(state, 1);

	const end = findTagEnd(state);

	if (end === -1) {
		throw new Error(ErrorMessages.MISSING_TAG_CLOSE);
	}

	const diff = end - checkpoint(state);

	const data = peek(state, diff);

	const [tag, leftover, extracedTagAttributes] = extractTag(data);
	const extractedAttributes = extractAttributes(leftover);

	if ("id" in extracedTagAttributes && "id" in extractedAttributes) {
		throw new Error(ErrorMessages.MULTIPLE_IDS);
	}

	const attributes: Record<string, string> = {
		...extractAttributes,
		...extracedTagAttributes,
	};

	const classAttributes = [];

	if ("class" in extracedTagAttributes) {
		classAttributes.push(extracedTagAttributes.class);
	}

	if ("class" in extractedAttributes) {
		classAttributes.push(extractedAttributes.class);
	}

	const classes = classAttributes.join("");

	if (classes !== "") {
		attributes.class = classes;
	}

	fastForward(state, diff + 1);

	return {
		tag,
		attributes,
	};
};

export const parseBlock = (state: ParseState): BlockNode => {
	const possibleFence = peek(state, 3);

	if (isFence(possibleFence)) {
		const quote = peekCode(state);
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

export const parseFlow = (
	state: ParseState,
	quote: number,
): FlowBlockNode | EmptyNodeBlock => {
	const children: FlowChild[] = [];
	let nodeStart = checkpoint(state);

	while (!isEndOfFile(state)) {
		const code = grab(state);

		if (code === CharacterCodes.LessThan) {
			if (checkpoint(state) - 1 - nodeStart > 0) {
				children.push({
					type: NodeType.TEXT,
					content: extract(state, nodeStart, checkpoint(state) - 1),
				});
			}

			rewind(state);
			children.push(parseElement(state));
			nodeStart = checkpoint(state);
		}

		if (code === quote) {
			if (checkpoint(state) - 1 - nodeStart > 0) {
				children.push({
					type: NodeType.TEXT,
					content: extract(state, nodeStart, checkpoint(state) - 1),
				});
			}

			break;
		}
	}

	if (children.length === 0) {
		return {
			type: NodeType.EMPTY,
		};
	}

	return {
		type: NodeType.FLOW,
		quote: String.fromCharCode(quote) as Quote,
		children,
	};
};

export const parseFence = (
	state: ParseState,
	quote: number,
): LiteralBlockNode => {
	return {
		type: NodeType.LITERAL,
		quote: String.fromCharCode(quote) as Quote,
		content: "",
	};
};
