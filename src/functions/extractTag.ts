import { CharacterCodes, ErrorMessages } from "../types.js";
import { firstWhitespaceIndex } from "../utilities/parser.js";
import { ParseError } from "../errors.js";

export enum ExtractTagStates {
	TAG = 0,
	ID = 1,
	CLASS = 2,
}

export type ExtractContext = {
	source: string;
	offset: number;
};

export type ExtractTagOut = {
	leftoverOffset: number;
};

export const extractTag = (
	raw: string,
	context?: ExtractContext,
	out?: ExtractTagOut,
): [string, string, Record<string, string>] => {
	const leadingWhitespace = raw.length - raw.trimStart().length;
	raw = raw.trim();

	const source = context?.source ?? raw;
	const baseOffset = context ? context.offset + leadingWhitespace : 0;

	if (!raw) {
		throw new ParseError({
			code: ErrorMessages.MISSING_TAG,
			source,
			index: baseOffset,
			label: "missing tag name",
			hint: "tags must have a name, like `<p>` or `<my-component>`",
		});
	}

	const firstChar = raw.charCodeAt(0);

	if (
		firstChar === CharacterCodes.NumberSign ||
		firstChar === CharacterCodes.Period
	) {
		throw new ParseError({
			code: ErrorMessages.MISSING_TAG,
			source,
			index: baseOffset,
			label: "missing tag name",
			hint: "shorthand `#id` and `.class` must follow a tag name, like `<div#app>` or `<p.lead>`",
		});
	}

	const firstSpace = firstWhitespaceIndex(raw);

	let buffer = raw;
	let leftover = "";
	let absoluteLeftoverOffset = baseOffset + raw.length;

	if (firstSpace !== -1) {
		buffer = raw.slice(0, firstSpace);
		const tail = raw.slice(firstSpace + 1);
		const tailTrimStart = tail.length - tail.trimStart().length;
		leftover = tail.trimStart();
		absoluteLeftoverOffset = baseOffset + firstSpace + 1 + tailTrimStart;
	}

	if (out) {
		out.leftoverOffset = absoluteLeftoverOffset;
	}

	let state = ExtractTagStates.TAG;
	let id: string | undefined = undefined;
	let classes: string[] = [];
	let tokenCursor = 0;
	let tagEnd = buffer.length;

	const setId = (start: number, end: number) => {
		if (start === end) {
			throw new ParseError({
				code: ErrorMessages.EMPTY_ID,
				source,
				index: baseOffset + start - 1,
				label: "empty `#id` shorthand",
				hint: "shorthand `#` must be followed by an identifier, like `<div#app>`",
			});
		}

		if (id !== undefined) {
			throw new ParseError({
				code: ErrorMessages.MULTIPLE_IDS,
				source,
				index: baseOffset + start - 1,
				length: end - start + 1,
				label: "duplicate id",
				hint: "an element may only have one id",
			});
		}

		id = buffer.slice(start, end);
	};

	const appendClass = (start: number, end: number) => {
		if (start === end) {
			throw new ParseError({
				code: ErrorMessages.EMPTY_CLASS,
				source,
				index: baseOffset + start - 1,
				label: "empty `.class` shorthand",
				hint: "shorthand `.` must be followed by a class name, like `<p.lead>`",
			});
		}

		classes.push(buffer.slice(start, end));
	};

	for (let i = 0; i < buffer.length; i++) {
		const code = buffer.charCodeAt(i);

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
					throw new ParseError({
						code: ErrorMessages.MULTIPLE_IDS,
						source,
						index: baseOffset + i,
						label: "second `#id` shorthand",
						hint: "an element may only have one id",
					});
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
		setId(tokenCursor, buffer.length);
	}

	if (state === ExtractTagStates.CLASS) {
		appendClass(tokenCursor, buffer.length);
	}

	const attributes: Record<string, string> = {};

	if (id !== undefined) {
		attributes.id = id;
	}

	if (classes.length > 0) {
		attributes.class = classes.join(" ");
	}

	return [buffer.slice(0, tagEnd), leftover, attributes];
};
