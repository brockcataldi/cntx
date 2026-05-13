export enum Symbols {
	DoubleQuote = 34,
	SingleQuote = 39,
	Hyphen = 45,
	Equals = 61,
	Backslash = 92,
}

export const isWhitespace = (code: number) => {
	return (
		code === 32 || // space
		code === 9 || // tab
		code === 10 || // line feed
		code === 13 || // carriage return
		code === 12 // form feed
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
