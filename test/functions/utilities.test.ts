import { describe, expect, it } from "vitest";

import { CharacterCodes, Characters } from "../../src/types.js";
import {
	checkpoint,
	consume,
	decodeEscaped,
	expect as expectToken,
	extract,
	fastForward,
	fastRewind,
	firstWhitespaceIndex,
	forward,
	grab,
	isDigit,
	isEndOfFile,
	isEscapedAt,
	isFence,
	isLetter,
	isQuote,
	isWhitespace,
	isWhitespaceCode,
	peek,
	peekCode,
	restore,
	rewind,
	skipWhitespace,
} from "../../src/utilities.js";

const state = (raw: string, cursor = 0) => ({ raw, cursor });

describe("utilities", () => {
	describe("isWhitespaceCode", () => {
		it("returns true for all supported whitespace code points", () => {
			expect(isWhitespaceCode(CharacterCodes.Space)).toBe(true);
			expect(isWhitespaceCode(CharacterCodes.Tab)).toBe(true);
			expect(isWhitespaceCode(CharacterCodes.LineFeed)).toBe(true);
			expect(isWhitespaceCode(CharacterCodes.CarriageReturn)).toBe(true);
			expect(isWhitespaceCode(CharacterCodes.FormFeed)).toBe(true);
			expect(isWhitespaceCode(CharacterCodes.VerticalTab)).toBe(true);
		});

		it("returns false for non-whitespace code points", () => {
			expect(isWhitespaceCode(CharacterCodes.LessThan)).toBe(false);
			expect(isWhitespaceCode(CharacterCodes.DoubleQuote)).toBe(false);
		});
	});

	describe("isWhitespace", () => {
		it("returns true for single whitespace characters", () => {
			expect(isWhitespace(Characters.Space)).toBe(true);
			expect(isWhitespace(Characters.Tab)).toBe(true);
			expect(isWhitespace(Characters.LineFeed)).toBe(true);
		});

		it("returns false for empty or multi-character strings", () => {
			expect(isWhitespace("")).toBe(false);
			expect(isWhitespace("  ")).toBe(false);
			expect(isWhitespace("a")).toBe(false);
		});
	});

	describe("isLetter", () => {
		it("returns true for uppercase and lowercase letters", () => {
			expect(isLetter(65)).toBe(true);
			expect(isLetter(90)).toBe(true);
			expect(isLetter(97)).toBe(true);
			expect(isLetter(122)).toBe(true);
		});

		it("returns false for digits and symbols", () => {
			expect(isLetter(48)).toBe(false);
			expect(isLetter(95)).toBe(false);
		});
	});

	describe("isDigit", () => {
		it("returns true for digit code points", () => {
			expect(isDigit(48)).toBe(true);
			expect(isDigit(57)).toBe(true);
		});

		it("returns false for letters", () => {
			expect(isDigit(65)).toBe(false);
		});
	});

	describe("isQuote", () => {
		it("returns true for supported quote characters", () => {
			expect(isQuote(CharacterCodes.DoubleQuote)).toBe(true);
			expect(isQuote(CharacterCodes.SingleQuote)).toBe(true);
			expect(isQuote(CharacterCodes.Backtick)).toBe(true);
		});

		it("returns false for other characters", () => {
			expect(isQuote(CharacterCodes.GreaterThan)).toBe(false);
		});
	});

	describe("isFence", () => {
		it("returns true for triple matching quotes", () => {
			expect(isFence('"""')).toBe(true);
			expect(isFence("'''")).toBe(true);
			expect(isFence("```")).toBe(true);
		});

		it("returns false for the wrong length", () => {
			expect(isFence('""')).toBe(false);
			expect(isFence('""""')).toBe(false);
		});

		it("returns false for mixed quote characters", () => {
			expect(isFence(`"'"`)).toBe(false);
		});

		it("returns false for non-quote characters", () => {
			expect(isFence("aaa")).toBe(false);
		});
	});

	describe("skipWhitespace", () => {
		it("advances the cursor past leading whitespace", () => {
			const parseState = state("  \tp", 0);
			skipWhitespace(parseState);
			expect(parseState.cursor).toBe(3);
		});

		it("does not move the cursor when no whitespace is present", () => {
			const parseState = state("paragraph", 0);
			skipWhitespace(parseState);
			expect(parseState.cursor).toBe(0);
		});
	});

	describe("firstWhitespaceIndex", () => {
		it("returns the index of the first whitespace character", () => {
			expect(firstWhitespaceIndex("foo bar")).toBe(3);
		});

		it("returns -1 when no whitespace is present", () => {
			expect(firstWhitespaceIndex("foobar")).toBe(-1);
		});
	});

	describe("decodeEscaped", () => {
		it("decodes escaped quotes and backslashes", () => {
			expect(
				decodeEscaped('say \\"hello\\"', CharacterCodes.DoubleQuote),
			).toBe('say "hello"');
			expect(decodeEscaped("a\\\\b", CharacterCodes.DoubleQuote)).toBe(
				"a\\b",
			);
		});

		it("leaves a backslash before a non-special character as literal", () => {
			expect(decodeEscaped("a\\z", CharacterCodes.DoubleQuote)).toBe(
				"a\\z",
			);
		});
	});

	describe("isEscapedAt", () => {
		it("returns true when a character is preceded by an odd number of backslashes", () => {
			expect(isEscapedAt('a\\"', 2)).toBe(true);
			expect(isEscapedAt('a\\\\"', 3)).toBe(false);
		});
	});

	describe("parse state helpers", () => {
		it("reports end of file", () => {
			expect(isEndOfFile(state("abc", 3))).toBe(true);
			expect(isEndOfFile(state("abc", 2))).toBe(false);
		});

		it("peeks upcoming characters", () => {
			expect(peek(state("hello", 1), 3)).toBe("ell");
			expect(peek(state("hello", 1))).toBe("e");
		});

		it("consumes matching input", () => {
			const parseState = state("hello", 0);
			expect(consume(parseState, "hel")).toBe(true);
			expect(parseState.cursor).toBe(3);
			expect(consume(parseState, "lo")).toBe(true);
			expect(parseState.cursor).toBe(5);
			expect(consume(parseState, "x")).toBe(false);
			expect(parseState.cursor).toBe(5);
		});

		it("throws when expected input is missing", () => {
			expect(() => expectToken(state("hello", 0), "hi")).toThrow(
				"Expected hi at index 0",
			);
		});

		it("reads, extracts, and advances characters", () => {
			const parseState = state("hello", 1);
			expect(peekCode(parseState)).toBe(101);
			expect(grab(parseState)).toBe(101);
			expect(parseState.cursor).toBe(2);
			expect(extract(parseState, 0, 2)).toBe("he");
		});

		it("supports checkpointing and restoring cursor position", () => {
			const parseState = state("hello", 0);
			const saved = checkpoint(parseState);
			grab(parseState);
			restore(parseState, saved);
			expect(parseState.cursor).toBe(0);
		});

		it("supports rewind and fastRewind", () => {
			const parseState = state("hello", 2);
			rewind(parseState);
			expect(parseState.cursor).toBe(1);
			expect(fastRewind(parseState, 1)).toBe(true);
			expect(parseState.cursor).toBe(0);
			expect(fastRewind(parseState, 1)).toBe(false);
			expect(parseState.cursor).toBe(0);
		});

		it("supports forward and fastForward", () => {
			const parseState = state("hello", 0);
			forward(parseState);
			expect(parseState.cursor).toBe(1);
			expect(fastForward(parseState, 2)).toBe(true);
			expect(parseState.cursor).toBe(3);
			expect(fastForward(parseState, 3)).toBe(false);
			expect(parseState.cursor).toBe(3);
		});
	});
});
