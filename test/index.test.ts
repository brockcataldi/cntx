import { describe, expect, it } from "vitest";

import { parse } from "../src/index.js";
import { NodeType } from "../src/types.js";

describe("parse", () => {
	it("parses explict empty p double-quote", () => {
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

		it("parses multiline p node with text", () => {
		expect(parse(`<p>"hello world"
			<p>"hello world"`)).toStrictEqual({
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

	it("parses explict empty p double-quote", () => {
		expect(
			parse(`<p>"this is stray <strong>"this bold" <em>"this italic""`),
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

	it("parses code literal block", () => {
		expect(parse(`<code>"""console.log("hello world");"""`)).toStrictEqual({
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
						content: 'console.log("hello world");'
					},
				},
			],
		});
	});
});
