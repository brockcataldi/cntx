import {
	type ParseState,
	Tag,
	ErrorMessages,
	CharacterCodes,
} from "../types.js";

import {
	checkpoint,
	peek,
	peekCode,
	fastForward,
} from "../utilities/parser.js";

import { ParseError } from "../errors.js";

import { extractTag } from "./extractTag.js";
import { extractAttributes } from "./extractAttributes.js";
import { findTagEnd } from "./findTagEnd.js";

export const parseTag = (state: ParseState): Tag => {
	const next = peekCode(state);

	const startIndex = state.cursor;

	if (next !== CharacterCodes.LessThan) {
		throw new ParseError({
			code: ErrorMessages.UNEXPECTED_CHARACTER,
			source: state.raw,
			index: startIndex,
			label: "expected `<`",
			hint: "elements must begin with an opening tag like `<p>`",
		});
	}

	fastForward(state, 1);

	const dataStart = checkpoint(state);
	const end = findTagEnd(state);

	if (end === -1) {
		throw new ParseError({
			code: ErrorMessages.MISSING_TAG_CLOSE,
			source: state.raw,
			index: startIndex,
			label: "tag never closed",
			hint: "tags must be closed with `>`; quoted attribute values must also be closed",
		});
	}

	const diff = end - checkpoint(state);

	const data = peek(state, diff);

	const tagOut = { leftoverOffset: dataStart };
	const [tag, leftover, extractedTagAttributes] = extractTag(
		data,
		{ source: state.raw, offset: dataStart },
		tagOut,
	);
	const extractedAttributes = extractAttributes(leftover, {
		source: state.raw,
		offset: tagOut.leftoverOffset,
	});

	if ("id" in extractedTagAttributes && "id" in extractedAttributes) {
		throw new ParseError({
			code: ErrorMessages.MULTIPLE_IDS,
			source: state.raw,
			index: startIndex,
			length: end - startIndex + 1,
			label: 'tag has both `#id` and `id="..."`',
			hint: "remove the shorthand `#id` or the `id` attribute; an element may only have one id",
		});
	}

	const attributes: Record<string, string> = {
		...extractedAttributes,
		...extractedTagAttributes,
	};

	const classAttributes = [];

	if ("class" in extractedTagAttributes) {
		classAttributes.push(extractedTagAttributes.class);
	}

	if ("class" in extractedAttributes) {
		classAttributes.push(extractedAttributes.class);
	}

	const classes = classAttributes.join(" ");

	if (classes !== "") {
		attributes.class = classes;
	}

	fastForward(state, diff + 1);

	return {
		tag,
		attributes,
	};
};
