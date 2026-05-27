import { describe, expect, it } from "vitest";

import { parse } from "../src/index.js";
import { ErrorMessages, NodeType } from "../src/types.js";

describe("parse", () => {
	describe("empty documents", () => {
		it("parses an empty document", () => {
			expect(parse("")).toStrictEqual({
				type: NodeType.DOCUMENT,
				children: [],
			});
		});

		it("parses whitespace-only input", () => {
			expect(parse("   \n\t  ")).toStrictEqual({
				type: NodeType.DOCUMENT,
				children: [],
			});
		});
	});

	describe("comment tags", () => {
		it("omits comments with a flow block from the AST", () => {
			expect(parse('<!>"this is a comment"')).toStrictEqual({
				type: NodeType.DOCUMENT,
				children: [],
			});
		});

		it("omits comments with a literal fence block from the AST", () => {
			expect(parse('<!note>"""multiline\ncomment"""')).toStrictEqual({
				type: NodeType.DOCUMENT,
				children: [],
			});
		});

		it("omits an explicit empty comment flow block from the AST", () => {
			expect(parse('<!>""')).toStrictEqual({
				type: NodeType.DOCUMENT,
				children: [],
			});
		});

		it("throws when a comment tag has no block at end of file", () => {
			expect(() => parse("<!>")).toThrow(
				ErrorMessages.COMMENT_BLOCK_REQUIRED,
			);
		});

		it("throws when a comment tag is not followed by a block", () => {
			expect(() => parse('<!><p>"hello"')).toThrow(
				ErrorMessages.COMMENT_BLOCK_REQUIRED,
			);
		});

		it("throws when a comment tag is followed only by a parent flow close", () => {
			expect(() => parse('<p>"<!>"')).toThrow(
				ErrorMessages.COMMENT_BLOCK_REQUIRED,
			);
		});

		it("comments out an element by prefixing the tag name with !", () => {
			expect(
				parse('<!p class="muted">"hello <strong>"world""'),
			).toStrictEqual({
				type: NodeType.DOCUMENT,
				children: [],
			});
		});

		it("omits comments between elements in a flow block from the AST", () => {
			expect(parse('<p>"<!>"between"<strong>"bold""')).toStrictEqual({
				type: NodeType.DOCUMENT,
				children: [
					{
						type: NodeType.ELEMENT,
						tag: { tag: "p", attributes: {} },
						block: {
							type: NodeType.FLOW,
							quote: '"',
							children: [
								{
									type: NodeType.ELEMENT,
									tag: { tag: "strong", attributes: {} },
									block: {
										type: NodeType.FLOW,
										quote: '"',
										children: [
											{
												type: NodeType.TEXT,
												content: "bold",
											},
										],
									},
								},
							],
						},
					},
				],
			});
		});

		it("throws when a comment flow block is not closed", () => {
			expect(() => parse('<!>"unclosed')).toThrow(
				ErrorMessages.UNEXPECTED_END_OF_FILE,
			);
		});
	});

	describe("flow blocks", () => {
		it("parses explicit empty flow with double quotes", () => {
			expect(parse('<p>""')).toStrictEqual({
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
					},
				],
			});
		});

		it("parses basic p node with text", () => {
			expect(parse('<p>"hello world"')).toStrictEqual({
				type: NodeType.DOCUMENT,
				children: [
					{
						type: NodeType.ELEMENT,
						tag: {
							tag: "p",
							attributes: {},
						},
						block: {
							type: NodeType.FLOW,
							quote: '"',
							children: [
								{
									type: NodeType.TEXT,
									content: "hello world",
								},
							],
						},
					},
				],
			});
		});

		it("parses consecutive p nodes separated by a newline", () => {
			expect(
				parse(`<p>"hello world"
			<p>"hello world"`),
			).toStrictEqual({
				type: NodeType.DOCUMENT,
				children: [
					{
						type: NodeType.ELEMENT,
						tag: {
							tag: "p",
							attributes: {},
						},
						block: {
							type: NodeType.FLOW,
							quote: '"',
							children: [
								{
									type: NodeType.TEXT,
									content: "hello world",
								},
							],
						},
					},
					{
						type: NodeType.ELEMENT,
						tag: {
							tag: "p",
							attributes: {},
						},
						block: {
							type: NodeType.FLOW,
							quote: '"',
							children: [
								{
									type: NodeType.TEXT,
									content: "hello world",
								},
							],
						},
					},
				],
			});
		});

		it("parses flow content with single quotes", () => {
			expect(parse("<p>'hello world'")).toStrictEqual({
				type: NodeType.DOCUMENT,
				children: [
					{
						type: NodeType.ELEMENT,
						tag: {
							tag: "p",
							attributes: {},
						},
						block: {
							type: NodeType.FLOW,
							quote: "'",
							children: [
								{
									type: NodeType.TEXT,
									content: "hello world",
								},
							],
						},
					},
				],
			});
		});

		it("parses flow content with backticks", () => {
			expect(parse("<p>`hello world`")).toStrictEqual({
				type: NodeType.DOCUMENT,
				children: [
					{
						type: NodeType.ELEMENT,
						tag: {
							tag: "p",
							attributes: {},
						},
						block: {
							type: NodeType.FLOW,
							quote: "`",
							children: [
								{
									type: NodeType.TEXT,
									content: "hello world",
								},
							],
						},
					},
				],
			});
		});

		it("parses explicit empty flow with single quotes", () => {
			expect(parse("<p>''")).toStrictEqual({
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
					},
				],
			});
		});

		it("parses explicit empty flow with backticks", () => {
			expect(parse("<p>``")).toStrictEqual({
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
					},
				],
			});
		});

		it("parses multiline text inside a flow block", () => {
			expect(parse('<p>"line one\nline two"')).toStrictEqual({
				type: NodeType.DOCUMENT,
				children: [
					{
						type: NodeType.ELEMENT,
						tag: {
							tag: "p",
							attributes: {},
						},
						block: {
							type: NodeType.FLOW,
							quote: '"',
							children: [
								{
									type: NodeType.TEXT,
									content: "line one\nline two",
								},
							],
						},
					},
				],
			});
		});

		it("parses nested elements that use different quote styles", () => {
			expect(parse("<p>\"hello <em>'italic'\"")).toStrictEqual({
				type: NodeType.DOCUMENT,
				children: [
					{
						type: NodeType.ELEMENT,
						tag: {
							tag: "p",
							attributes: {},
						},
						block: {
							type: NodeType.FLOW,
							quote: '"',
							children: [
								{
									type: NodeType.TEXT,
									content: "hello ",
								},
								{
									type: NodeType.ELEMENT,
									tag: {
										tag: "em",
										attributes: {},
									},
									block: {
										type: NodeType.FLOW,
										quote: "'",
										children: [
											{
												type: NodeType.TEXT,
												content: "italic",
											},
										],
									},
								},
							],
						},
					},
				],
			});
		});

		it("parses escaped double quotes inside a flow block", () => {
			expect(parse('<p>"say \\"hello\\""')).toStrictEqual({
				type: NodeType.DOCUMENT,
				children: [
					{
						type: NodeType.ELEMENT,
						tag: {
							tag: "p",
							attributes: {},
						},
						block: {
							type: NodeType.FLOW,
							quote: '"',
							children: [
								{
									type: NodeType.TEXT,
									content: 'say "hello"',
								},
							],
						},
					},
				],
			});
		});

		it("parses escaped single quotes inside a flow block", () => {
			expect(parse("<p>'it\\'s fine'")).toStrictEqual({
				type: NodeType.DOCUMENT,
				children: [
					{
						type: NodeType.ELEMENT,
						tag: {
							tag: "p",
							attributes: {},
						},
						block: {
							type: NodeType.FLOW,
							quote: "'",
							children: [
								{
									type: NodeType.TEXT,
									content: "it's fine",
								},
							],
						},
					},
				],
			});
		});

		it("parses escaped backslashes inside a flow block", () => {
			expect(parse('<p>"C:\\\\Users\\\\name"')).toStrictEqual({
				type: NodeType.DOCUMENT,
				children: [
					{
						type: NodeType.ELEMENT,
						tag: {
							tag: "p",
							attributes: {},
						},
						block: {
							type: NodeType.FLOW,
							quote: '"',
							children: [
								{
									type: NodeType.TEXT,
									content: "C:\\Users\\name",
								},
							],
						},
					},
				],
			});
		});

		it("parses deeply nested inline elements", () => {
			expect(parse('<div>"<p>"<strong>"deep"""')).toStrictEqual({
				type: NodeType.DOCUMENT,
				children: [
					{
						type: NodeType.ELEMENT,
						tag: {
							tag: "div",
							attributes: {},
						},
						block: {
							type: NodeType.FLOW,
							quote: '"',
							children: [
								{
									type: NodeType.ELEMENT,
									tag: {
										tag: "p",
										attributes: {},
									},
									block: {
										type: NodeType.FLOW,
										quote: '"',
										children: [
											{
												type: NodeType.ELEMENT,
												tag: {
													tag: "strong",
													attributes: {},
												},
												block: {
													type: NodeType.FLOW,
													quote: '"',
													children: [
														{
															type: NodeType.TEXT,
															content: "deep",
														},
													],
												},
											},
										],
									},
								},
							],
						},
					},
				],
			});
		});
	});

	describe("nested flow content", () => {
		it("parses basic nested p text node", () => {
			expect(parse('<p>"hello <strong>"world""')).toStrictEqual({
				type: NodeType.DOCUMENT,
				children: [
					{
						type: NodeType.ELEMENT,
						tag: {
							tag: "p",
							attributes: {},
						},
						block: {
							type: NodeType.FLOW,
							quote: '"',
							children: [
								{
									type: NodeType.TEXT,
									content: "hello ",
								},
								{
									type: NodeType.ELEMENT,
									tag: {
										tag: "strong",
										attributes: {},
									},
									block: {
										type: NodeType.FLOW,
										quote: '"',
										children: [
											{
												type: NodeType.TEXT,
												content: "world",
											},
										],
									},
								},
							],
						},
					},
				],
			});
		});

		it("parses nested inline elements with mixed content", () => {
			expect(
				parse(
					`<p>"this is stray <strong>"this bold" <em>"this italic""`,
				),
			).toStrictEqual({
				type: NodeType.DOCUMENT,
				children: [
					{
						type: NodeType.ELEMENT,
						tag: {
							tag: "p",
							attributes: {},
						},
						block: {
							type: NodeType.FLOW,
							quote: '"',
							children: [
								{
									type: NodeType.TEXT,
									content: "this is stray ",
								},
								{
									type: NodeType.ELEMENT,
									tag: {
										tag: "strong",
										attributes: {},
									},
									block: {
										type: NodeType.FLOW,
										quote: '"',
										children: [
											{
												type: NodeType.TEXT,
												content: "this bold",
											},
										],
									},
								},
								{
									type: NodeType.TEXT,
									content: " ",
								},
								{
									type: NodeType.ELEMENT,
									tag: {
										tag: "em",
										attributes: {},
									},
									block: {
										type: NodeType.FLOW,
										quote: '"',
										children: [
											{
												type: NodeType.TEXT,
												content: "this italic",
											},
										],
									},
								},
							],
						},
					},
				],
			});
		});

		it("parses nested inline elements with attributes", () => {
			expect(
				parse(
					'<p class="lead">"hello <a href="https://example.com">"link""',
				),
			).toStrictEqual({
				type: NodeType.DOCUMENT,
				children: [
					{
						type: NodeType.ELEMENT,
						tag: {
							tag: "p",
							attributes: {
								class: "lead",
							},
						},
						block: {
							type: NodeType.FLOW,
							quote: '"',
							children: [
								{
									type: NodeType.TEXT,
									content: "hello ",
								},
								{
									type: NodeType.ELEMENT,
									tag: {
										tag: "a",
										attributes: {
											href: "https://example.com",
										},
									},
									block: {
										type: NodeType.FLOW,
										quote: '"',
										children: [
											{
												type: NodeType.TEXT,
												content: "link",
											},
										],
									},
								},
							],
						},
					},
				],
			});
		});

		it("parses flow content with only nested elements", () => {
			expect(parse('<p>"<strong>"bold" <em>"italic""')).toStrictEqual({
				type: NodeType.DOCUMENT,
				children: [
					{
						type: NodeType.ELEMENT,
						tag: {
							tag: "p",
							attributes: {},
						},
						block: {
							type: NodeType.FLOW,
							quote: '"',
							children: [
								{
									type: NodeType.ELEMENT,
									tag: {
										tag: "strong",
										attributes: {},
									},
									block: {
										type: NodeType.FLOW,
										quote: '"',
										children: [
											{
												type: NodeType.TEXT,
												content: "bold",
											},
										],
									},
								},
								{
									type: NodeType.TEXT,
									content: " ",
								},
								{
									type: NodeType.ELEMENT,
									tag: {
										tag: "em",
										attributes: {},
									},
									block: {
										type: NodeType.FLOW,
										quote: '"',
										children: [
											{
												type: NodeType.TEXT,
												content: "italic",
											},
										],
									},
								},
							],
						},
					},
				],
			});
		});
	});

	describe("tag attributes", () => {
		it("parses shorthand id on a tag", () => {
			expect(parse('<h1#heading>"Heading"')).toStrictEqual({
				type: NodeType.DOCUMENT,
				children: [
					{
						type: NodeType.ELEMENT,
						tag: {
							tag: "h1",
							attributes: {
								id: "heading",
							},
						},
						block: {
							type: NodeType.FLOW,
							quote: '"',
							children: [
								{
									type: NodeType.TEXT,
									content: "Heading",
								},
							],
						},
					},
				],
			});
		});

		it("parses shorthand class on a tag", () => {
			expect(parse('<p.large-text>"text"')).toStrictEqual({
				type: NodeType.DOCUMENT,
				children: [
					{
						type: NodeType.ELEMENT,
						tag: {
							tag: "p",
							attributes: {
								class: "large-text",
							},
						},
						block: {
							type: NodeType.FLOW,
							quote: '"',
							children: [
								{
									type: NodeType.TEXT,
									content: "text",
								},
							],
						},
					},
				],
			});
		});

		it("parses shorthand id and class on a tag", () => {
			expect(parse('<h1#heading.large-text>"Heading"')).toStrictEqual({
				type: NodeType.DOCUMENT,
				children: [
					{
						type: NodeType.ELEMENT,
						tag: {
							tag: "h1",
							attributes: {
								id: "heading",
								class: "large-text",
							},
						},
						block: {
							type: NodeType.FLOW,
							quote: '"',
							children: [
								{
									type: NodeType.TEXT,
									content: "Heading",
								},
							],
						},
					},
				],
			});
		});

		it("parses html-style attributes on a tag", () => {
			expect(
				parse('<columns class="border-less" columns="2">"content"'),
			).toStrictEqual({
				type: NodeType.DOCUMENT,
				children: [
					{
						type: NodeType.ELEMENT,
						tag: {
							tag: "columns",
							attributes: {
								class: "border-less",
								columns: "2",
							},
						},
						block: {
							type: NodeType.FLOW,
							quote: '"',
							children: [
								{
									type: NodeType.TEXT,
									content: "content",
								},
							],
						},
					},
				],
			});
		});

		it("merges shorthand class with html class attribute", () => {
			expect(parse('<p.large-text class="extra">"text"')).toStrictEqual({
				type: NodeType.DOCUMENT,
				children: [
					{
						type: NodeType.ELEMENT,
						tag: {
							tag: "p",
							attributes: {
								class: "large-text extra",
							},
						},
						block: {
							type: NodeType.FLOW,
							quote: '"',
							children: [
								{
									type: NodeType.TEXT,
									content: "text",
								},
							],
						},
					},
				],
			});
		});

		it("parses boolean attributes on a tag", () => {
			expect(parse("<input disabled required>")).toStrictEqual({
				type: NodeType.DOCUMENT,
				children: [
					{
						type: NodeType.ELEMENT,
						tag: {
							tag: "input",
							attributes: {
								disabled: "",
								required: "",
							},
						},
						block: {
							type: NodeType.EMPTY,
						},
					},
				],
			});
		});

		it("parses data and aria attributes on a tag", () => {
			expect(
				parse('<button data-id="123" aria-label="Close">"Save"'),
			).toStrictEqual({
				type: NodeType.DOCUMENT,
				children: [
					{
						type: NodeType.ELEMENT,
						tag: {
							tag: "button",
							attributes: {
								"data-id": "123",
								"aria-label": "Close",
							},
						},
						block: {
							type: NodeType.FLOW,
							quote: '"',
							children: [
								{
									type: NodeType.TEXT,
									content: "Save",
								},
							],
						},
					},
				],
			});
		});

		it("parses single-quoted and backtick attribute values on a tag", () => {
			expect(
				parse("<p title='Hello' data-note=`note`>\"text\""),
			).toStrictEqual({
				type: NodeType.DOCUMENT,
				children: [
					{
						type: NodeType.ELEMENT,
						tag: {
							tag: "p",
							attributes: {
								title: "Hello",
								"data-note": "note",
							},
						},
						block: {
							type: NodeType.FLOW,
							quote: '"',
							children: [
								{
									type: NodeType.TEXT,
									content: "text",
								},
							],
						},
					},
				],
			});
		});

		it("parses a hyphenated tag name", () => {
			expect(parse('<my-component>"content"')).toStrictEqual({
				type: NodeType.DOCUMENT,
				children: [
					{
						type: NodeType.ELEMENT,
						tag: {
							tag: "my-component",
							attributes: {},
						},
						block: {
							type: NodeType.FLOW,
							quote: '"',
							children: [
								{
									type: NodeType.TEXT,
									content: "content",
								},
							],
						},
					},
				],
			});
		});
	});

	describe("self-closing and empty elements", () => {
		it("parses a self-closing element at end of file", () => {
			expect(parse('<img src="x.jpg" alt="photo">')).toStrictEqual({
				type: NodeType.DOCUMENT,
				children: [
					{
						type: NodeType.ELEMENT,
						tag: {
							tag: "img",
							attributes: {
								src: "x.jpg",
								alt: "photo",
							},
						},
						block: {
							type: NodeType.EMPTY,
						},
					},
				],
			});
		});

		it("parses a self-closing element followed by a sibling", () => {
			expect(parse('<img src="x.jpg"><p>"hi"')).toStrictEqual({
				type: NodeType.DOCUMENT,
				children: [
					{
						type: NodeType.ELEMENT,
						tag: {
							tag: "img",
							attributes: {
								src: "x.jpg",
							},
						},
						block: {
							type: NodeType.EMPTY,
						},
					},
					{
						type: NodeType.ELEMENT,
						tag: {
							tag: "p",
							attributes: {},
						},
						block: {
							type: NodeType.FLOW,
							quote: '"',
							children: [
								{
									type: NodeType.TEXT,
									content: "hi",
								},
							],
						},
					},
				],
			});
		});

		it("parses an element with no block at end of file", () => {
			expect(parse("<p>")).toStrictEqual({
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
					},
				],
			});
		});

		it("parses sibling elements when parent has no flow block", () => {
			expect(parse('<p><strong>"bold"')).toStrictEqual({
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
					},
					{
						type: NodeType.ELEMENT,
						tag: {
							tag: "strong",
							attributes: {},
						},
						block: {
							type: NodeType.FLOW,
							quote: '"',
							children: [
								{
									type: NodeType.TEXT,
									content: "bold",
								},
							],
						},
					},
				],
			});
		});

		it("parses a self-closing element nested in a flow block with surrounding text", () => {
			expect(
				parse(
					'<columns class="border-less" columns="2">`before <img src="x.jpg"> after`',
				),
			).toStrictEqual({
				type: NodeType.DOCUMENT,
				children: [
					{
						type: NodeType.ELEMENT,
						tag: {
							tag: "columns",
							attributes: {
								class: "border-less",
								columns: "2",
							},
						},
						block: {
							type: NodeType.FLOW,
							quote: "`",
							children: [
								{
									type: NodeType.TEXT,
									content: "before ",
								},
								{
									type: NodeType.ELEMENT,
									tag: {
										tag: "img",
										attributes: {
											src: "x.jpg",
										},
									},
									block: {
										type: NodeType.EMPTY,
									},
								},
								{
									type: NodeType.TEXT,
									content: "after",
								},
							],
						},
					},
				],
			});
		});

		it("parses consecutive self-closing elements before a flow closing quote", () => {
			expect(
				parse(
					'<columns class="border-less" columns="2">"<img src="1.jpg"><img src="2.jpg">"',
				),
			).toStrictEqual({
				type: NodeType.DOCUMENT,
				children: [
					{
						type: NodeType.ELEMENT,
						tag: {
							tag: "columns",
							attributes: {
								class: "border-less",
								columns: "2",
							},
						},
						block: {
							type: NodeType.FLOW,
							quote: '"',
							children: [
								{
									type: NodeType.ELEMENT,
									tag: {
										tag: "img",
										attributes: {
											src: "1.jpg",
										},
									},
									block: {
										type: NodeType.EMPTY,
									},
								},
								{
									type: NodeType.ELEMENT,
									tag: {
										tag: "img",
										attributes: {
											src: "2.jpg",
										},
									},
									block: {
										type: NodeType.EMPTY,
									},
								},
							],
						},
					},
				],
			});
		});

		it("still parses a child flow block when the parent uses the same quote", () => {
			expect(parse('<p>"<span>"text""')).toStrictEqual({
				type: NodeType.DOCUMENT,
				children: [
					{
						type: NodeType.ELEMENT,
						tag: {
							tag: "p",
							attributes: {},
						},
						block: {
							type: NodeType.FLOW,
							quote: '"',
							children: [
								{
									type: NodeType.ELEMENT,
									tag: {
										tag: "span",
										attributes: {},
									},
									block: {
										type: NodeType.FLOW,
										quote: '"',
										children: [
											{
												type: NodeType.TEXT,
												content: "text",
											},
										],
									},
								},
							],
						},
					},
				],
			});
		});
	});

	describe("multiple top-level elements", () => {
		it("parses multiple top-level elements", () => {
			expect(parse('<h1>"a"<p>"b"')).toStrictEqual({
				type: NodeType.DOCUMENT,
				children: [
					{
						type: NodeType.ELEMENT,
						tag: {
							tag: "h1",
							attributes: {},
						},
						block: {
							type: NodeType.FLOW,
							quote: '"',
							children: [
								{
									type: NodeType.TEXT,
									content: "a",
								},
							],
						},
					},
					{
						type: NodeType.ELEMENT,
						tag: {
							tag: "p",
							attributes: {},
						},
						block: {
							type: NodeType.FLOW,
							quote: '"',
							children: [
								{
									type: NodeType.TEXT,
									content: "b",
								},
							],
						},
					},
				],
			});
		});

		it("parses top-level elements separated by whitespace", () => {
			expect(parse('<h1>"a"\n\n<p>"b"')).toStrictEqual({
				type: NodeType.DOCUMENT,
				children: [
					{
						type: NodeType.ELEMENT,
						tag: {
							tag: "h1",
							attributes: {},
						},
						block: {
							type: NodeType.FLOW,
							quote: '"',
							children: [
								{
									type: NodeType.TEXT,
									content: "a",
								},
							],
						},
					},
					{
						type: NodeType.ELEMENT,
						tag: {
							tag: "p",
							attributes: {},
						},
						block: {
							type: NodeType.FLOW,
							quote: '"',
							children: [
								{
									type: NodeType.TEXT,
									content: "b",
								},
							],
						},
					},
				],
			});
		});
	});

	describe("literal blocks", () => {
		it("parses code literal block with double-quote fences", () => {
			expect(
				parse(`<code>"""console.log("hello world");"""`),
			).toStrictEqual({
				type: NodeType.DOCUMENT,
				children: [
					{
						type: NodeType.ELEMENT,
						tag: {
							tag: "code",
							attributes: {},
						},
						block: {
							type: NodeType.LITERAL,
							quote: '"',
							content: 'console.log("hello world");',
						},
					},
				],
			});
		});

		it("parses code literal block with single-quote fences", () => {
			expect(parse("<code>'''js code'''")).toStrictEqual({
				type: NodeType.DOCUMENT,
				children: [
					{
						type: NodeType.ELEMENT,
						tag: {
							tag: "code",
							attributes: {},
						},
						block: {
							type: NodeType.LITERAL,
							quote: "'",
							content: "js code",
						},
					},
				],
			});
		});

		it("parses code literal block with backtick fences", () => {
			expect(parse("<code>```js code```")).toStrictEqual({
				type: NodeType.DOCUMENT,
				children: [
					{
						type: NodeType.ELEMENT,
						tag: {
							tag: "code",
							attributes: {},
						},
						block: {
							type: NodeType.LITERAL,
							quote: "`",
							content: "js code",
						},
					},
				],
			});
		});

		it("parses a literal block with attributes", () => {
			expect(
				parse('<code lang="js">"""console.log("hi")"""'),
			).toStrictEqual({
				type: NodeType.DOCUMENT,
				children: [
					{
						type: NodeType.ELEMENT,
						tag: {
							tag: "code",
							attributes: {
								lang: "js",
							},
						},
						block: {
							type: NodeType.LITERAL,
							quote: '"',
							content: 'console.log("hi")',
						},
					},
				],
			});
		});

		it("parses a multiline literal block", () => {
			expect(
				parse(`<code lang="js">"""
console.log("Hello World")
"""`),
			).toStrictEqual({
				type: NodeType.DOCUMENT,
				children: [
					{
						type: NodeType.ELEMENT,
						tag: {
							tag: "code",
							attributes: {
								lang: "js",
							},
						},
						block: {
							type: NodeType.LITERAL,
							quote: '"',
							content: '\nconsole.log("Hello World")\n',
						},
					},
				],
			});
		});

		it("parses escaped double quotes inside a literal block", () => {
			expect(parse('<code>"""say \\"hi\\""""')).toStrictEqual({
				type: NodeType.DOCUMENT,
				children: [
					{
						type: NodeType.ELEMENT,
						tag: {
							tag: "code",
							attributes: {},
						},
						block: {
							type: NodeType.LITERAL,
							quote: '"',
							content: 'say "hi"',
						},
					},
				],
			});
		});

		it("parses escaped fence quotes inside a literal block", () => {
			expect(parse('<code>"""\\"\\"\\""""')).toStrictEqual({
				type: NodeType.DOCUMENT,
				children: [
					{
						type: NodeType.ELEMENT,
						tag: {
							tag: "code",
							attributes: {},
						},
						block: {
							type: NodeType.LITERAL,
							quote: '"',
							content: '"""',
						},
					},
				],
			});
		});

		it("parses escaped backslashes inside a literal block", () => {
			expect(parse('<code>"""C:\\\\Users\\\\name"""')).toStrictEqual({
				type: NodeType.DOCUMENT,
				children: [
					{
						type: NodeType.ELEMENT,
						tag: {
							tag: "code",
							attributes: {},
						},
						block: {
							type: NodeType.LITERAL,
							quote: '"',
							content: "C:\\Users\\name",
						},
					},
				],
			});
		});

		it("parses an empty literal block", () => {
			expect(parse("<code>''''''")).toStrictEqual({
				type: NodeType.DOCUMENT,
				children: [
					{
						type: NodeType.ELEMENT,
						tag: {
							tag: "code",
							attributes: {},
						},
						block: {
							type: NodeType.LITERAL,
							quote: "'",
							content: "",
						},
					},
				],
			});
		});
	});

	describe("errors", () => {
		it("throws when a literal block is missing its closing fence", () => {
			expect(() => parse('<code>"""unclosed')).toThrow(
				ErrorMessages.UNEXPECTED_END_OF_FILE,
			);
		});

		it("throws when a flow block is missing its closing quote", () => {
			expect(() => parse('<p>"unclosed')).toThrow(
				ErrorMessages.UNEXPECTED_END_OF_FILE,
			);
		});

		it("throws when a flow block ends with a backslash", () => {
			expect(() => parse('<p>"hello\\')).toThrow(
				ErrorMessages.UNEXPECTED_END_OF_FILE,
			);
		});

		it("throws when a literal block ends with a backslash", () => {
			expect(() => parse('<code>"""hello\\')).toThrow(
				ErrorMessages.UNEXPECTED_END_OF_FILE,
			);
		});

		it("throws when a nested flow block is missing its closing quote", () => {
			expect(() => parse('<p>"<strong>"bold"')).toThrow(
				ErrorMessages.UNEXPECTED_END_OF_FILE,
			);
		});

		it("throws when an outer flow block is missing its closing quote", () => {
			expect(() => parse('<p>"hello <strong>"world"')).toThrow(
				ErrorMessages.UNEXPECTED_END_OF_FILE,
			);
		});

		it("throws when content follows a closed flow block", () => {
			expect(() => parse('<p>"hi""extra"')).toThrow(
				ErrorMessages.UNEXPECTED_CHARACTER,
			);
		});

		it("throws when a tag is missing its closing angle bracket", () => {
			expect(() => parse('<p "hello"')).toThrow(
				ErrorMessages.MISSING_TAG_CLOSE,
			);
		});

		it("throws when a tag attribute value is missing its closing quote", () => {
			expect(() => parse('<p title="hello"')).toThrow(
				ErrorMessages.MISSING_TAG_CLOSE,
			);
		});

		it("throws when shorthand and html id attributes are both provided", () => {
			expect(() => parse('<p#foo id="bar">"text"')).toThrow(
				ErrorMessages.MULTIPLE_IDS,
			);
		});

		it("throws when input does not begin with a tag", () => {
			expect(() => parse('"hello"')).toThrow(
				ErrorMessages.UNEXPECTED_CHARACTER,
			);
		});

		it("throws when a tag name is missing", () => {
			expect(() => parse("<>")).toThrow(ErrorMessages.MISSING_TAG);
		});

		it("throws when text appears before the first tag", () => {
			expect(() => parse('hello<p>"world"')).toThrow(
				ErrorMessages.UNEXPECTED_CHARACTER,
			);
		});
	});
});
