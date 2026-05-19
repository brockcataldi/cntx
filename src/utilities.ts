import { ParseState, CharacterCodes, Characters } from "./types.js";

export const isWhitespaceCode = (code: number) => {
	return (
		code === CharacterCodes.Space ||
		code === CharacterCodes.Tab ||
		code === CharacterCodes.LineFeed ||
		code === CharacterCodes.CarriageReturn ||
		code === CharacterCodes.FormFeed ||
		code === CharacterCodes.VerticalTab
	);
};

export const isWhitespace = (value: string) => {
	if (value.length !== 1) {
		return false;
	}

	return (
		value === Characters.Space ||
		value === Characters.Tab ||
		value === Characters.LineFeed ||
		value === Characters.CarriageReturn ||
		value === Characters.FormFeed ||
		value === Characters.VerticalTab
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

export const isFence = (value: string) => {
	if (value.length !== 3) {
		return false;
	}

	const char = value.charCodeAt(0);

	for (let i = 1; i < value.length; i++) {
		if (value.charCodeAt(i) !== char) {
			return false;
		}
	}

	return isQuote(char);
};

export const skipWhitespace = (state: ParseState) => {
	while (state.cursor < state.raw.length) {
		const code = state.raw.charCodeAt(state.cursor);

		if (!isWhitespaceCode(code)) {
			return;
		}

		state.cursor++;
	}
};

export const firstWhitespaceIndex = (value: string) => {
	for (let i = 0; i < value.length; i++) {
		const code = value.charCodeAt(i);

		if (isWhitespaceCode(code)) {
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

export const expect = (state: ParseState, value: string): void => {
	if (!consume(state, value)) {
		throw new Error(`Expected ${value} at index ${state.cursor}`);
	}
};

export const peekCode = (state: ParseState): number => {
	return state.raw.charCodeAt(state.cursor);
};

export const extract = (state: ParseState, start: number, end: number) => {
	return state.raw.slice(start, end);
};

export const grab = (state: ParseState): number => {
	const code = peekCode(state);
	state.cursor += 1;
	return code;
};

// "Time" functions
export const checkpoint = (state: ParseState): number => {
	return state.cursor;
};

export const restore = (state: ParseState, index: number): void => {
	state.cursor = index;
};

export const rewind = (state: ParseState) => {
	state.cursor -= 1;
};

export const fastRewind = (state: ParseState, length: number) => {
	if (0 > state.cursor - length) {
		return false;
	}

	state.cursor -= length;
	return true;
};

export const forward = (state: ParseState) => {
	state.cursor += 1;
};

export const fastForward = (state: ParseState, length: number): boolean => {
	if (state.raw.length < state.cursor + length) {
		return false;
	}

	state.cursor += length;
	return true;
};
