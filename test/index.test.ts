import { describe, expect, it } from "vitest";

import { tokenize } from "../src/index.js";

describe("tokenize", () => {
  it("parses an single character tag without attributes", () => {
		expect(tokenize(`<p>`)).toStrictEqual([
			{
				type: "tag",
				tag: "p",
				attributes: {},
			},
		]);
	});
});