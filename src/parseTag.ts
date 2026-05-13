import { isLetter, isWhitespace, Symbols } from "./string.js";
import { TagToken } from "./types.js";

enum TagParserState {
	ATTRIBUTE = "attribute",
	VALUE = "value",
}

export const parseTag = (raw: string): TagToken | null => {
	raw = raw.trim();

	if (!isLetter(raw.charCodeAt(0))) {
		return null;
	}

	let i = 1;

	while (i < raw.length) {
		const code = raw.charCodeAt(i);

		if (!isLetter(code) && code !== Symbols.Hyphen) {
			break;
		}

		i++;
	}

	const tag = raw.substring(0, i);

	if (tag.length === raw.length) {
		return {
			type: "tag",
			tag: tag,
			attributes: {},
		};
	}

	const attributes: Record<string, string> = {};

	let key = "";
	let value = "";
	let state: TagParserState = TagParserState.ATTRIBUTE;
	let quoteType: Symbols.DoubleQuote | Symbols.SingleQuote = Symbols.DoubleQuote;

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
				code !== Symbols.Hyphen &&
				code !== Symbols.Equals
			) {
				throw new Error("Invalid character in attribute");
			}

			if (code === Symbols.Equals) {
				const next = raw.charCodeAt(i + 1);

				if(next === Symbols.DoubleQuote){
					state = TagParserState.VALUE;
					quoteType = Symbols.DoubleQuote;
					i = i + 2;
					continue;
				}

				if(next === Symbols.SingleQuote){
					state = TagParserState.VALUE;
					quoteType = Symbols.SingleQuote;
					i = i + 2;
					continue;
				}

				throw new Error('Attribute missing quote');
			}

			if (isLetter(code)) {
				key += raw.charAt(i);
			}

			if (code === Symbols.Hyphen) {
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
			quoteType = Symbols.DoubleQuote;
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
		type: "tag",
		tag,
		attributes,
	};
};
