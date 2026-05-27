import { Characters, CharacterCodes } from "../types.js";

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

export const isFenceOpen = (value: string) => {
	return isFence(value) === CharacterCodes.CurlyBraceOpen;
};

export const isFenceClose = (value: string) => {
	return isFence(value) === CharacterCodes.CurlyBraceClose;
};

export const isFence = (value: string) => {
	if (value.length !== 3) {
		return -1;
	}

	const char = value.charCodeAt(0);

	for (let i = 1; i < value.length; i++) {
		if (value.charCodeAt(i) !== char) {
			return -1;
		}
	}

	return char;
};

export const isCommentTag = (tagName: string) => {
	return tagName.startsWith("!");
};
