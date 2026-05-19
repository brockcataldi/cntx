import { describe, expect, it } from "vitest";

import { findTagEnd } from "../../src/functions/findTagEnd.js";

const state = (raw: string, cursor: number) => ({ raw, cursor });

describe("findTagEnd", () => {
	it("finds the closing angle bracket of a simple tag", () => {
		expect(findTagEnd(state("p>", 0))).toBe(1);
	});

	it("finds the closing angle bracket after attributes", () => {
		expect(findTagEnd(state('p class="box">', 0))).toBe(13);
	});

	it("does not treat a greater-than sign inside double quotes as the tag end", () => {
		expect(findTagEnd(state('p title="1 > 2">', 0))).toBe(15);
	});

	it("does not treat a greater-than sign inside single quotes as the tag end", () => {
		expect(findTagEnd(state("p title='1 > 2'>", 0))).toBe(15);
	});

	it("does not treat a greater-than sign inside backticks as the tag end", () => {
		expect(findTagEnd(state("p title=`1 > 2`>", 0))).toBe(15);
	});

	it("handles multiple quoted attributes", () => {
		expect(
			findTagEnd(state('img src="a.jpg" alt="photo">', 0)),
		).toBe(27);
	});

	it("returns -1 when a quoted attribute is missing its closing quote", () => {
		expect(findTagEnd(state('p title="hello', 0))).toBe(-1);
	});

	it("returns -1 when the tag is missing a closing angle bracket", () => {
		expect(findTagEnd(state("p class=\"box\"", 0))).toBe(-1);
	});
});
