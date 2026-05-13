import { describe, expect, it } from "vitest";

import { parse } from "../src/index.js";
import { NodeType } from "../src/types.js";

describe("parse", () => {
	it("parses an single character tag without attributes", () => {
		expect(parse(`                              <p>`)).toStrictEqual({
			type: NodeType.DOCUMENT,
			children: [
				{
					type: NodeType.ELEMENT,
					tag: {
						tag: "p",
						attributes: {},
					},
					block: {
						type: NodeType.EMPTY,
					},
				}
			],
		});
	});
});
