import { describe, expect, it } from "vitest";

import { parse } from "../src/tag.js";

describe("parse", () => {
  it("parses an single character tag without attributes", () => {
		expect(parse(`p`)).toStrictEqual(
			{
				type: "tag",
				tag: "p",
				attributes: {},
			},
		);
	});

  it("parses an tag without attributes", () => {
		expect(parse(`div`)).toStrictEqual(
			{
				type: "tag",
				tag: "div",
				attributes: {},
			},
		);
	});

	it("parses a tag with one double-quoted attribute", () => {
		expect(parse(`a href="https://example.com"`)).toStrictEqual(
			{
				type: "tag",
				tag: "a",
				attributes: {
					href: "https://example.com",
				},
			},
		);
	});

	it("parses a tag with boolean and valued attributes", () => {
		expect(
			parse(`img ismap src="https://example.com/image.jpg"`),
		).toStrictEqual(
			{
				type: "tag",
				tag: "img",
				attributes: {
					ismap: "",
					src: "https://example.com/image.jpg",
				},
			},
		);
	})

	it("parses a tag with multiple double-quoted attributes", () => {
		expect(
			parse(
				`a href="https://example.com" target="_blank" rel="noopener"`,
			),
		).toStrictEqual(
			{
				type: "tag",
				tag: "a",
				attributes: {
					href: "https://example.com",
					target: "_blank",
					rel: "noopener",
				},
			},
		);
	});

	it("parses a tag with attributes containing dashes", () => {
		expect(
			parse(`div data-id="123" aria-label="Close"`),
		).toStrictEqual(
			{
				type: "tag",
				tag: "div",
				attributes: {
					"data-id": "123",
					"aria-label": "Close",
				},
			},
		);
	});

	it("parses a tag with boolean attributes", () => {
		expect(parse(`option selected disabled`)).toStrictEqual(
			{
				type: "tag",
				tag: "option",
				attributes: {
					selected: "",
					disabled: "",
				},
			},
		);
	});

	it("parses a tag with query params in an attribute value", () => {
		expect(parse(`a href="/search?q=test&page=1"`)).toStrictEqual(
			{
				type: "tag",
				tag: "a",
				attributes: {
					href: "/search?q=test&page=1",
				},
			},
		);
	});
});