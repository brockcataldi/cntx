import { CharacterCodes, ErrorMessages } from "../types.js";
import { decodeEscaped } from "../utilities/parser.js";
import { ParseError } from "../errors.js";
import type { ExtractContext } from "./extractTag.js";
import { isQuote, isWhitespaceCode } from "../utilities/checks.js";

export enum ExtractAttributeStates {
	ATTRIBUTE = 0,
	VALUE = 1,
}

export const extractAttributes = (
	raw: string,
	context?: ExtractContext,
): Record<string, string> => {
	const leadingWhitespace = raw.length - raw.trimStart().length;
	raw = raw.trim();

	const source = context?.source ?? raw;
	const baseOffset = context ? context.offset + leadingWhitespace : 0;

	const attributes: Record<string, string> = {};

	let state = ExtractAttributeStates.ATTRIBUTE;
	let tokenStart = 0;
	let attribute = "";
	let valueStart = 0;
	let quote: number | null = null;

	for (let i = 0; i < raw.length; i++) {
		const code = raw.charCodeAt(i);

		switch (state) {
			case ExtractAttributeStates.ATTRIBUTE:
				if (code === CharacterCodes.Equals) {
					if (tokenStart === i) {
						throw new ParseError({
							code: ErrorMessages.EQUALS_ATTRIBUTE,
							source,
							index: baseOffset + i,
							label: "stray `=`",
							hint: 'attribute names must come before `=`, with no whitespace; write `key="value"`',
						});
					}

					const next = raw.charCodeAt(i + 1);

					if (isQuote(next)) {
						state = ExtractAttributeStates.VALUE;
						quote = next;
						attribute = raw.slice(tokenStart, i);
						valueStart = i + 1;
						i = i + 1;
						tokenStart = i + 1;
						continue;
					}

					throw new ParseError({
						code: ErrorMessages.MISSING_ATTRIBUTE_OPEN,
						source,
						index: baseOffset + i + 1,
						label: "expected opening quote",
						hint: "attribute values must be quoted with `\"`, `'`, or `` ` ``",
					});
				}

				if (isWhitespaceCode(code)) {
					if (tokenStart !== i) {
						const key = raw.slice(tokenStart, i);
						attributes[key] = "";
					}

					tokenStart = i + 1;
					continue;
				}

				break;
			case ExtractAttributeStates.VALUE:
				if (code === CharacterCodes.Backslash) {
					if (i + 1 >= raw.length) {
						throw new ParseError({
							code: ErrorMessages.UNEXPECTED_END_OF_FILE,
							source,
							index: baseOffset + i,
							label: "trailing backslash",
							hint: "a backslash must be followed by a character to escape",
						});
					}

					const next = raw.charCodeAt(i + 1);

					if (next === quote || next === CharacterCodes.Backslash) {
						i += 1;
						continue;
					}
				}

				if (code === quote) {
					state = ExtractAttributeStates.ATTRIBUTE;
					attributes[attribute] = decodeEscaped(
						raw.slice(tokenStart, i),
						quote,
					);
					quote = null;
					tokenStart = i + 1;
					continue;
				}
				break;
		}
	}

	if (state === ExtractAttributeStates.VALUE) {
		const quoteChar = quote !== null ? String.fromCharCode(quote) : '"';

		throw new ParseError({
			code: ErrorMessages.UNEXPECTED_END_OF_FILE,
			source,
			index: baseOffset + valueStart,
			label: "unclosed attribute value",
			hint: `attribute value is missing its closing \`${quoteChar}\``,
		});
	}

	if (state === ExtractAttributeStates.ATTRIBUTE) {
		if (tokenStart !== raw.length) {
			const key = raw.slice(tokenStart, raw.length);
			attributes[key] = "";
		}
	}

	return attributes;
};
