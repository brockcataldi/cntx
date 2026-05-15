import {
	type ElementNode,
	type DocumentNode,
	type ParseState,
	NodeType,
	Tag,
} from "./types.js";

import {
	CharacterCodes,
	Characters,
	consume,
	expect,
	findTagEnd,
	isEndOfFile,
	peek,
	skipWhitespace,
	slide,
} from "./utilities.js";

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
	// const [tag, leftover, attributes] =
	extractTag(data);

	slide(state, end);
	return {
		tag: "p",
		attributes: {},
	};
};

export enum ExtractTagStates {
	TAG = 0,
	ID = 1,
	CLASS = 2,
}

/**
 * Extract Tag
 *
 * Meant to implement the Pug style shorthand for elements. The primary
 * difference is there is no default "div" tag <.class> is an invalid tag,
 * this may change to a p but regardless, it's ugly and needs to be cleaned up,
 * but tests pass.
 *
 * @param {string} data the tag to be parsed.
 * @returns {Array} [the tag, the leftover attributes, the shorthand attributes that were parsed]
 */
export const extractTag = (
	data: string,
): [string, string, Record<string, string>] => {
	data = data.trim();

	if (!data) {
		throw new Error("Missing tag");
	}

	const firstChar = data.charCodeAt(0);

	if (
		firstChar === CharacterCodes.NumberSign ||
		firstChar === CharacterCodes.Period
	) {
		throw new Error("Missing tag");
	}

	const firstSpace = data.indexOf(Characters.Space);
	const tagBuffer = firstSpace === -1 ? data : data.slice(0, firstSpace);
	const leftover =
		firstSpace === -1 ? "" : data.slice(firstSpace + 1).trimStart();

	let state = ExtractTagStates.TAG;
	let id: string | undefined = undefined;
	let classes: string[] = [];
	let tokenCursor = 0;
	let tagEnd = tagBuffer.length;

	const setId = (start: number, end: number) => {
		if (start === end) {
			throw new Error("Empty ID");
		}

		if (id !== undefined) {
			throw new Error("Multiple IDs");
		}

		id = tagBuffer.slice(start, end);
	};

	const appendClass = (start: number, end: number) => {
		if (start === end) {
			throw new Error("Empty Class");
		}

		classes.push(tagBuffer.slice(start, end));
	};

	for (let i = 0; i < tagBuffer.length; i++) {
		const code = tagBuffer.charCodeAt(i);

		switch (state) {
			case ExtractTagStates.TAG:
				if (code === CharacterCodes.NumberSign) {
					tagEnd = i;
					tokenCursor = i + 1;
					state = ExtractTagStates.ID;
					continue;
				}

				if (code === CharacterCodes.Period) {
					tagEnd = i;
					tokenCursor = i + 1;
					state = ExtractTagStates.CLASS;
					continue;
				}
				continue;

			case ExtractTagStates.ID:
				if (code === CharacterCodes.Period) {
					setId(tokenCursor, i);
					tokenCursor = i + 1;
					state = ExtractTagStates.CLASS;
					continue;
				}

				if (code === CharacterCodes.NumberSign) {
					throw new Error("Multiple IDs");
				}

				continue;
			case ExtractTagStates.CLASS:
				if (code === CharacterCodes.Period) {
					appendClass(tokenCursor, i);
					tokenCursor = i + 1;
					continue;
				}

				if (code === CharacterCodes.NumberSign) {
					appendClass(tokenCursor, i);
					tokenCursor = i + 1;
					state = ExtractTagStates.ID;
					continue;
				}
				continue;
		}
	}

	if (state === ExtractTagStates.ID) {
		setId(tokenCursor, tagBuffer.length);
	}

	if (state === ExtractTagStates.CLASS) {
		appendClass(tokenCursor, tagBuffer.length);
	}

	const attributes: Record<string, string> = {};

	if (id !== undefined) {
		attributes.id = id;
	}

	if (classes.length > 0) {
		attributes.class = classes.join(" ");
	}

	return [tagBuffer.slice(0, tagEnd), leftover, attributes];
};

export const parseBlock = () => {};
