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
	TAG = "tag",
	ID = "id",
	CLASS = "class",
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

	const firstSpace = data.indexOf(Characters.Space);

	let tagBuffer = data;
	let leftover = "";

	if (firstSpace !== -1) {
		tagBuffer = data.substring(0, firstSpace);
		leftover = data.substring(firstSpace + 1).trimStart();
	}

	const firstChar = tagBuffer.charCodeAt(0);

	if (
		firstChar === CharacterCodes.NumberSign ||
		firstChar === CharacterCodes.Period
	) {
		throw new Error("Missing tag");
	}

	let state = ExtractTagStates.TAG;
	let tag = "";
	let buffer = "";
	const attributes: Record<string, string> = {};

	for (let i = 0; i < tagBuffer.length; i++) {
		const code = tagBuffer.charCodeAt(i);

		switch (state) {
			case ExtractTagStates.TAG:
				if (code === CharacterCodes.NumberSign) {
					state = ExtractTagStates.ID;
					continue;
				}

				if (code === CharacterCodes.Period) {
					state = ExtractTagStates.CLASS;
					continue;
				}

				tag += tagBuffer.charAt(i);
				continue;

			case ExtractTagStates.ID:
				if (!("id" in attributes)) {
					attributes.id = "";
				}

				if (code === CharacterCodes.Period) {
					if (!buffer) {
						throw new Error("Empty ID");
					}

					if (attributes.id.length !== 0) {
						throw new Error("Multiple IDs");
					}

					attributes.id = buffer;
					state = ExtractTagStates.CLASS;
					buffer = "";
					continue;
				}

				if (code === CharacterCodes.NumberSign) {
					throw new Error("Multiple IDs");
				}

				buffer += tagBuffer.charAt(i);
				continue;
			case ExtractTagStates.CLASS:
				if (!("class" in attributes)) {
					attributes.class = "";
				}

				if (code === CharacterCodes.Period) {
					if (!buffer) {
						throw new Error("Empty Class");
					}

					if (attributes.class.length === 0) {
						attributes.class = buffer;
					} else {
						attributes.class += " " + buffer;
					}

					buffer = "";
					continue;
				}

				if (code === CharacterCodes.NumberSign) {
					if (!buffer) {
						throw new Error("Empty Class");
					}

					if (attributes.class.length === 0) {
						attributes.class = buffer;
					} else {
						attributes.class += " " + buffer;
					}

					state = ExtractTagStates.ID;
					buffer = "";
					continue;
				}

				buffer += tagBuffer.charAt(i);
				continue;
		}
	}

	if (state === ExtractTagStates.ID) {
		if (!buffer) {
			throw new Error("Empty ID");
		}

		if ("id" in attributes) {
			if (attributes.id.length !== 0) {
				throw new Error("Multiple IDs");
			}

			attributes.id = buffer;
		}
	}

	if (state === ExtractTagStates.CLASS) {
		if (!buffer) {
			throw new Error("Empty Class");
		}

		if ("class" in attributes) {
			if (attributes.class.length === 0) {
				attributes.class = buffer;
			} else {
				attributes.class += " " + buffer;
			}
		}
	}

	return [tag, leftover, attributes];
};

export const parseBlock = () => {};
