// import { describe, expect, it } from "vitest";

// import { parseTag } from "../src/tag.js";

// describe("parseTag", () => {
// 	it("parseTags an single character tag without attributes", () => {
// 		expect(parseTag(`p`)).toStrictEqual({
// 			type: "tag",
// 			tag: "p",
// 			attributes: {},
// 		});
// 	});

// 	it("parseTags an tag without attributes", () => {
// 		expect(parseTag(`div`)).toStrictEqual({
// 			type: "tag",
// 			tag: "div",
// 			attributes: {},
// 		});
// 	});

// 	it("parseTags a tag with one double-quoted attribute", () => {
// 		expect(parseTag(`a href="https://example.com"`)).toStrictEqual({
// 			type: "tag",
// 			tag: "a",
// 			attributes: {
// 				href: "https://example.com",
// 			},
// 		});
// 	});

// 	it("parseTags a tag with boolean and valued attributes", () => {
// 		expect(
// 			parseTag(`img ismap src="https://example.com/image.jpg"`),
// 		).toStrictEqual({
// 			type: "tag",
// 			tag: "img",
// 			attributes: {
// 				ismap: "",
// 				src: "https://example.com/image.jpg",
// 			},
// 		});
// 	});

// 	it("parseTags a tag with multiple double-quoted attributes", () => {
// 		expect(
// 			parseTag(
// 				`a href="https://example.com" target="_blank" rel="noopener"`,
// 			),
// 		).toStrictEqual({
// 			type: "tag",
// 			tag: "a",
// 			attributes: {
// 				href: "https://example.com",
// 				target: "_blank",
// 				rel: "noopener",
// 			},
// 		});
// 	});

// 	it("parseTags a tag with attributes containing dashes", () => {
// 		expect(parseTag(`div data-id="123" aria-label="Close"`)).toStrictEqual({
// 			type: "tag",
// 			tag: "div",
// 			attributes: {
// 				"data-id": "123",
// 				"aria-label": "Close",
// 			},
// 		});
// 	});

// 	it("parseTags a tag with boolean attributes", () => {
// 		expect(parseTag(`option selected disabled`)).toStrictEqual({
// 			type: "tag",
// 			tag: "option",
// 			attributes: {
// 				selected: "",
// 				disabled: "",
// 			},
// 		});
// 	});

// 	it("parseTags a tag with query params in an attribute value", () => {
// 		expect(parseTag(`a href="/search?q=test&page=1"`)).toStrictEqual({
// 			type: "tag",
// 			tag: "a",
// 			attributes: {
// 				href: "/search?q=test&page=1",
// 			},
// 		});
// 	});
// });
