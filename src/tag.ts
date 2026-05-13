import { isLetter, isWhitespace, Characters } from "./utilities.js";
import { Tag } from "./types.js";

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

		if (!isLetter(code) && code !== Characters.Hyphen) {
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
	let quoteType: Characters.DoubleQuote | Characters.SingleQuote =
		Characters.DoubleQuote;

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
				code !== Characters.Hyphen &&
				code !== Characters.Equals
			) {
				throw new Error("Invalid character in attribute");
			}

			if (code === Characters.Equals) {
				const next = raw.charCodeAt(i + 1);

				if (next === Characters.DoubleQuote) {
					state = TagParserState.VALUE;
					quoteType = Characters.DoubleQuote;
					i = i + 2;
					continue;
				}

				if (next === Characters.SingleQuote) {
					state = TagParserState.VALUE;
					quoteType = Characters.SingleQuote;
					i = i + 2;
					continue;
				}

				throw new Error("Attribute missing quote");
			}

			if (isLetter(code)) {
				key += raw.charAt(i);
			}

			if (code === Characters.Hyphen) {
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
			quoteType = Characters.DoubleQuote;
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
