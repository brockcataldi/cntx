import { CharacterCodes, ParseState } from "../types.js";

export const findTagEnd = (state: ParseState): number => {
	let quote = 0;

	for (let i = state.cursor; i < state.raw.length; i++) {
		const code = state.raw.charCodeAt(i);

		if (quote !== 0) {
			if (code === quote) {
				quote = 0;
			}

			continue;
		}

		if (
			code === CharacterCodes.DoubleQuote ||
			code === CharacterCodes.SingleQuote ||
			code === CharacterCodes.Backtick
		) {
			quote = code;
			continue;
		}

		if (code === CharacterCodes.GreaterThan) {
			return i;
		}
	}

	return -1;
};
