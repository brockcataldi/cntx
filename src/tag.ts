import { isLetter, isWhitespace, CharacterCodes } from "./utilities.js";
import { Tag } from "./types.js";

/**
 * TO BE FRANKENSTEINED AND REPLACED.
 */

enum TagParserState {
	ATTRIBUTE = "attribute",
	VALUE = "value",
}

export const parseTag = (raw: string): Tag | null => {
	raw = raw.trim();

	if (!isLetter(raw.charCodeAt(0))) {
		return null;
	}

	let i = 1;

	while (i < raw.length) {
		const code = raw.charCodeAt(i);

		if (!isLetter(code) && code !== CharacterCodes.Hyphen) {
			break;
		}

		i++;
	}

	const tag = raw.substring(0, i);

	if (tag.length === raw.length) {
		return {
			tag: tag,
			attributes: {},
		};
	}

	const attributes: Record<string, string> = {};

	let key = "";
	let value = "";
	let state: TagParserState = TagParserState.ATTRIBUTE;
	let quoteType: CharacterCodes.DoubleQuote | CharacterCodes.SingleQuote =
		CharacterCodes.DoubleQuote;

	i = i + 1;
	while (i < raw.length) {
		const code = raw.charCodeAt(i);

		if (state === TagParserState.ATTRIBUTE) {
			if (isWhitespace(code)) {
				if (key !== "") {
					attributes[key] = value;
					key = "";
					value = "";
					state = TagParserState.ATTRIBUTE;
				}
				i++;
				continue;
			}

			if (
				!isLetter(code) &&
				code !== CharacterCodes.Hyphen &&
				code !== CharacterCodes.Equals
			) {
				throw new Error("Invalid character in attribute");
			}

			if (code === CharacterCodes.Equals) {
				const next = raw.charCodeAt(i + 1);

				if (next === CharacterCodes.DoubleQuote) {
					state = TagParserState.VALUE;
					quoteType = CharacterCodes.DoubleQuote;
					i = i + 2;
					continue;
				}

				if (next === CharacterCodes.SingleQuote) {
					state = TagParserState.VALUE;
					quoteType = CharacterCodes.SingleQuote;
					i = i + 2;
					continue;
				}

				throw new Error("Attribute missing quote");
			}

			if (isLetter(code)) {
				key += raw.charAt(i);
			}

			if (code === CharacterCodes.Hyphen) {
				if (key === "") {
					throw new Error("Attribute can't start with a Hyphen");
				}

				key += "-";
			}

			i++;
			continue;
		}

		if (code === quoteType) {
			attributes[key] = value;
			state = TagParserState.ATTRIBUTE;
			quoteType = CharacterCodes.DoubleQuote;
			key = "";
			value = "";
			i++;
			continue;
		}

		value += raw.charAt(i);
		i++;
	}

	if (key !== "") {
		attributes[key] = value;
	}

	return {
		tag,
		attributes,
	};
};
