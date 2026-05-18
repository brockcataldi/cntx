import { ParseState, CharacterCodes } from "./types.js";

export const isWhitespace = (code: number) => {
	return (
		code === CharacterCodes.Space ||
		code === CharacterCodes.Tab ||
		code === CharacterCodes.LineFeed ||
		code === CharacterCodes.CarriageReturn ||
		code === CharacterCodes.FormFeed ||
		code === CharacterCodes.VerticalTab
	);
};

export const isLetter = (code: number) => {
	return (
		(code >= 65 && code <= 90) || // A-Z
		(code >= 97 && code <= 122) // a-z
	);
};

export const isDigit = (code: number) => {
	return code >= 48 && code <= 57;
};

export const isQuote = (code: number) => {
	return (
		code === CharacterCodes.Backtick ||
		code === CharacterCodes.DoubleQuote ||
		code === CharacterCodes.SingleQuote
	);
};

export const skipWhitespace = (state: ParseState) => {
	while (state.cursor < state.raw.length) {
		const code = state.raw.charCodeAt(state.cursor);

		if (!isWhitespace(code)) {
			return;
		}

		state.cursor++;
	}
};

export const firstWhitespaceIndex = (value: string) => {
	for (let i = 0; i < value.length; i++) {
		const code = value.charCodeAt(i);

		if (isWhitespace(code)) {
			return i;
		}
	}

	return -1;
};

export const isEndOfFile = (state: ParseState) => {
	return state.cursor >= state.raw.length;
};

export const peek = (state: ParseState, length = 1): string => {
	return state.raw.slice(state.cursor, state.cursor + length);
};

export const consume = (state: ParseState, value: string): boolean => {
	if (peek(state, value.length) !== value) {
		return false;
	}

	state.cursor += value.length;
	return true;
};

export const slide = (state: ParseState, value: number): boolean => {
	if (state.raw.length < state.cursor + value) {
		return false;
	}

	state.cursor += value;
	return true;
};

export const expect = (state: ParseState, value: string): void => {
	if (!consume(state, value)) {
		throw new Error(`Expected ${value} at index ${state.cursor}`);
	}
};

export const checkpoint = (state: ParseState): number => {
	return state.cursor;
};

export const restore = (state: ParseState, index: number): void => {
	state.cursor = index;
};

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
