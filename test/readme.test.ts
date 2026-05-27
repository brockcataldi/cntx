import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { parse } from "../src/index.js";
import { type ElementNode, type FlowChild, NodeType } from "../src/types.js";

const readmePath = join(
	dirname(fileURLToPath(import.meta.url)),
	"..",
	"readme.cntx",
);

const readmeSource = readFileSync(readmePath, "utf8");

const isElementNode = (node: FlowChild | ElementNode): node is ElementNode =>
	node.type === NodeType.ELEMENT;

const findElements = (
	nodes: readonly (ElementNode | FlowChild)[],
	tagName: string,
): ElementNode[] => {
	const matches: ElementNode[] = [];

	for (const node of nodes) {
		if (isElementNode(node) && node.tag.tag === tagName) {
			matches.push(node);
		}

		if (isElementNode(node) && node.block.type === NodeType.FLOW) {
			matches.push(...findElements(node.block.children, tagName));
		}
	}

	return matches;
};

describe("readme.cntx", () => {
	it("parses the project readme without errors", () => {
		expect(() => parse(readmeSource)).not.toThrow();
	});

	it("parses the readme as top-level sibling elements", () => {
		const document = parse(readmeSource);

		expect(document).toStrictEqual({
			type: NodeType.DOCUMENT,
			children: expect.any(Array),
		});

		expect(document.children.length).toBeGreaterThan(50);

		const first = document.children[0];

		expect(first?.type).toBe(NodeType.ELEMENT);

		if (first?.type === NodeType.ELEMENT) {
			expect(first.tag.tag).toBe("h1");
			expect(first.block.type).toBe(NodeType.FLOW);
		}
	});

	it("includes the main documentation sections", () => {
		const document = parse(readmeSource);
		const headings = findElements(document.children, "h2");

		const headingText = headings.flatMap((heading) => {
			if (heading.block.type !== NodeType.FLOW) {
				return [];
			}

			return heading.block.children
				.filter((child) => child.type === NodeType.TEXT)
				.map((child) => child.content);
		});

		expect(headingText).toEqual(
			expect.arrayContaining([
				"Usage",
				"Syntax overview",
				"AST",
				"Errors",
				"Limitations",
				"Development",
				"License",
			]),
		);
	});

	it("includes code literal examples for cntx and typescript", () => {
		const document = parse(readmeSource);
		const codeBlocks = findElements(document.children, "code");
		const literalBlocks = codeBlocks.filter(
			(node) => node.block.type === NodeType.LITERAL,
		);
		const languages = codeBlocks
			.map((node) => node.tag.attributes.lang)
			.filter(Boolean);

		expect(literalBlocks.length).toBeGreaterThan(10);
		expect(languages).toEqual(
			expect.arrayContaining(["typescript", "cntx", "bash"]),
		);
	});
});
