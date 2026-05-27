import { ParseError } from "../errors.js";
import { CharacterCodes, ErrorMessages, ParseState } from "../types.js";
import { isWhitespaceCode } from "./checks.js";

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

export const isEndOfFile = (state: ParseState) => {
	return state.cursor >= state.raw.length;
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
		throw new ParseError({
			code: ErrorMessages.UNEXPECTED_CHARACTER,
			source: state.raw,
			index: state.cursor,
			length: value.length,
			label: `expected \`${value}\``,
			hint: `expected \`${value}\` at index ${state.cursor}`,
		});
	}
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

export const isEscapedAt = (raw: string, index: number): boolean => {
	let backslashes = 0;

	for (let i = index - 1; i >= 0; i--) {
		if (raw.charCodeAt(i) !== CharacterCodes.Backslash) {
			break;
		}

		backslashes++;
	}

	return backslashes % 2 === 1;
};

export const decodeEscaped = (value: string, quote: number): string => {
	let result = "";

	for (let i = 0; i < value.length; i++) {
		const code = value.charCodeAt(i);

		if (code === CharacterCodes.Backslash) {
			const next = value.charCodeAt(i + 1);

			if (next === quote || next === CharacterCodes.Backslash) {
				result += String.fromCharCode(next);
				i += 1;
				continue;
			}
		}

		result += value[i];
	}

	return result;
};

export const skipEscapeSequence = (state: ParseState, quote: number): void => {
	if (isEndOfFile(state)) {
		throw new ParseError({
			code: ErrorMessages.UNEXPECTED_END_OF_FILE,
			source: state.raw,
			index: Math.max(0, state.cursor - 1),
			hint: "a backslash must be followed by a character to escape",
			label: "trailing backslash",
		});
	}

	const next = peekCode(state);

	if (next === quote || next === CharacterCodes.Backslash) {
		grab(state);
	}
};

/**
 * Decides whether a quote sitting after a tag must be treated as the parent
 * flow's closing quote rather than the opening quote of a new child flow.
 *
 * When a child element shares its parent's quote character (e.g. `<p>"<a>"`),
 * the parser greedily opens a child flow whenever possible, since the parent
 * close can be supplied later. The only case where a greedy open is
 * unsatisfiable is when the parent quote is the last character of the input —
 * there is no room for a child flow to ever close. In that case we fall back
 * to treating it as the parent's close and let the element have an empty block.
 *
 * Returns true only when:
 *   - the next code is the parent's quote
 *   - it is not escaped
 *   - and there is no character after it (so a greedy open would be impossible)
 */
export const isParentFlowClosingQuote = (
	state: ParseState,
	parentQuote: number,
): boolean => {
	if (peekCode(state) !== parentQuote) {
		return false;
	}

	if (isEscapedAt(state.raw, state.cursor)) {
		return false;
	}

	return state.cursor + 1 >= state.raw.length;
};
