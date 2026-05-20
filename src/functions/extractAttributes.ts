import { CharacterCodes, ErrorMessages } from "../types.js";
import { decodeEscaped, isQuote, isWhitespaceCode } from "../utilities.js";

export enum ExtractAttributeStates {
	ATTRIBUTE = 0,
	VALUE = 1,
}

export const extractAttributes = (raw: string): Record<string, string> => {
	raw = raw.trim();

	const attributes: Record<string, string> = {};

	let state = ExtractAttributeStates.ATTRIBUTE;
	let tokenStart = 0;
	let attribute = "";
	let quote = null;

	for (let i = 0; i < raw.length; i++) {
		const code = raw.charCodeAt(i);

		switch (state) {
			case ExtractAttributeStates.ATTRIBUTE:
				if (code === CharacterCodes.Equals) {
					if (tokenStart === i) {
						throw new Error(ErrorMessages.EQUALS_ATTRIBUTE);
					}

					const next = raw.charCodeAt(i + 1);

					if (isQuote(next)) {
						state = ExtractAttributeStates.VALUE;
						quote = next;
						attribute = raw.slice(tokenStart, i);
						i = i + 1;
						tokenStart = i + 1;
						continue;
					}

					throw new Error(ErrorMessages.MISSING_ATTRIBUTE_OPEN);
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
						throw new Error(ErrorMessages.UNEXPECTED_END_OF_FILE);
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
		throw new Error(ErrorMessages.UNEXPECTED_END_OF_FILE);
	}

	if (state === ExtractAttributeStates.ATTRIBUTE) {
		if (tokenStart !== raw.length) {
			const key = raw.slice(tokenStart, raw.length);
			attributes[key] = "";
		}
	}

	return attributes;
};
