import { ParseState } from "./types.js";

export enum Characters {
	Tab = 9,
	LineFeed = 10,
	VerticalTab = 11,
	FormFeed = 12,
	CarriageReturn = 13,
	Space = 32,
	DoubleQuote = 34,
	SingleQuote = 39,
	Hyphen = 45,
	Equals = 61,
	Backslash = 92,
}

export const isWhitespace = (code: number) => {
	return (
		code === Characters.Space ||
		code === Characters.Tab ||
		code === Characters.LineFeed ||
		code === Characters.CarriageReturn ||
		code === Characters.FormFeed
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

export const skipWhitespace = (state: ParseState) => {
	while (state.cursor < state.raw.length) {
		const code = state.raw.charCodeAt(state.cursor);

		if (!isWhitespace(code)) {
			return;
		}

		state.cursor++;
	}
};

export const isEndOfFile = (state: ParseState) => {
	return state.cursor >= state.raw.length;
};
