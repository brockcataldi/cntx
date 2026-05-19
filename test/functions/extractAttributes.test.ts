import { describe, expect, it } from "vitest";

import { extractAttributes } from "../../src/functions/extractAttributes";
import { ErrorMessages } from "../../src/types";

describe("extractTag", () => {
	describe("basic attribute parsing", () => {
		it("parses a boolean attribute", () => {
			expect(extractAttributes("attribute")).toStrictEqual({
				attribute: "",
			});
		});

		it("parses a valued attribute with double quotes", () => {
			expect(extractAttributes('key="value"')).toStrictEqual({
				key: "value",
			});
		});

		it("parses a valued attribute with single quotes", () => {
			expect(extractAttributes("key='value'")).toStrictEqual({
				key: "value",
			});
		});

		it("parses a valued attribute with backticks", () => {
			expect(extractAttributes("key=`value`")).toStrictEqual({
				key: "value",
			});
		});
	});

	describe("html attribute parsing", () => {
		it("parses multiple boolean attributes", () => {
			expect(
				extractAttributes("disabled required checked"),
			).toStrictEqual({
				disabled: "",
				required: "",
				checked: "",
			});
		});

		it("parses multiple valued attributes", () => {
			expect(
				extractAttributes('id="main" class="container" title="Hello"'),
			).toStrictEqual({
				id: "main",
				class: "container",
				title: "Hello",
			});
		});

		it("parses mixed boolean and valued attributes", () => {
			expect(
				extractAttributes(
					'disabled id="submit" required type="button"',
				),
			).toStrictEqual({
				disabled: "",
				id: "submit",
				required: "",
				type: "button",
			});
		});

		it("parses attributes separated by extra spaces", () => {
			expect(
				extractAttributes(
					'  id="main"    class="container"   disabled  ',
				),
			).toStrictEqual({
				id: "main",
				class: "container",
				disabled: "",
			});
		});

		it("parses attributes separated by tabs and newlines", () => {
			expect(
				extractAttributes('id="main"\nclass="container"\tdisabled'),
			).toStrictEqual({
				id: "main",
				class: "container",
				disabled: "",
			});
		});

		it("parses an unquoted attribute value", () => {
			expect(() => extractAttributes("type=text")).toThrow(
				ErrorMessages.MISSING_ATTRIBUTE_OPEN,
			);
		});

		it("parses multiple unquoted attribute values", () => {
			expect(() =>
				extractAttributes("type=text value=hello id=input"),
			).toThrow(ErrorMessages.MISSING_ATTRIBUTE_OPEN);
		});

		it("parses a hyphenated attribute name", () => {
			expect(extractAttributes('accept-charset="UTF-8"')).toStrictEqual({
				"accept-charset": "UTF-8",
			});
		});

		it("parses data attributes", () => {
			expect(
				extractAttributes('data-id="123" data-user-name="brock"'),
			).toStrictEqual({
				"data-id": "123",
				"data-user-name": "brock",
			});
		});

		it("parses aria attributes", () => {
			expect(
				extractAttributes('aria-label="Close" aria-hidden="true"'),
			).toStrictEqual({
				"aria-label": "Close",
				"aria-hidden": "true",
			});
		});

		it("parses attributes with empty double-quoted values", () => {
			expect(extractAttributes('value="" placeholder=""')).toStrictEqual({
				value: "",
				placeholder: "",
			});
		});

		it("parses attributes with empty single-quoted values", () => {
			expect(extractAttributes("value='' placeholder=''")).toStrictEqual({
				value: "",
				placeholder: "",
			});
		});

		it("parses attributes with equals signs in quoted values", () => {
			expect(
				extractAttributes('href="https://example.com?a=1&b=2"'),
			).toStrictEqual({
				href: "https://example.com?a=1&b=2",
			});
		});

		it("parses attributes with slashes in values", () => {
			expect(extractAttributes('src="/assets/image.png"')).toStrictEqual({
				src: "/assets/image.png",
			});
		});

		it("parses attributes with colons in values", () => {
			expect(
				extractAttributes('href="mailto:test@example.com"'),
			).toStrictEqual({
				href: "mailto:test@example.com",
			});
		});

		it("parses attributes with dots in values", () => {
			expect(extractAttributes('src="image.min.js"')).toStrictEqual({
				src: "image.min.js",
			});
		});

		it("parses attributes with comma-separated values", () => {
			expect(
				extractAttributes('sizes="16x16, 32x32, 48x48"'),
			).toStrictEqual({
				sizes: "16x16, 32x32, 48x48",
			});
		});

		it("parses attributes with space-separated quoted values", () => {
			expect(
				extractAttributes('class="btn btn-primary is-active"'),
			).toStrictEqual({
				class: "btn btn-primary is-active",
			});
		});

		it("parses attributes with JSON-like quoted values", () => {
			expect(
				extractAttributes(`data-props='{"id":1,"enabled":true}'`),
			).toStrictEqual({
				"data-props": '{"id":1,"enabled":true}',
			});
		});

		it("parses attributes with bracket characters in values", () => {
			expect(extractAttributes('data-list="[1,2,3]"')).toStrictEqual({
				"data-list": "[1,2,3]",
			});
		});

		it("parses attribute names containing colons", () => {
			expect(extractAttributes('xml:lang="en"')).toStrictEqual({
				"xml:lang": "en",
			});
		});

		it("parses attribute names containing underscores", () => {
			expect(extractAttributes('data_test="value"')).toStrictEqual({
				data_test: "value",
			});
		});

		it("parses attribute names containing numbers", () => {
			expect(
				extractAttributes('data-1="one" h2="heading"'),
			).toStrictEqual({
				"data-1": "one",
				h2: "heading",
			});
		});

		it("parses uppercase attribute names", () => {
			expect(
				extractAttributes('CLASS="button" ID="submit"'),
			).toStrictEqual({
				CLASS: "button",
				ID: "submit",
			});
		});

		it("parses mixed-case attribute names", () => {
			expect(extractAttributes('viewBox="0 0 24 24"')).toStrictEqual({
				viewBox: "0 0 24 24",
			});
		});

		it("parses values containing angle brackets when quoted", () => {
			expect(
				extractAttributes('data-html="<span>Hello</span>"'),
			).toStrictEqual({
				"data-html": "<span>Hello</span>",
			});
		});

		it("parses values containing entity-like text", () => {
			expect(
				extractAttributes(
					'title="Tom &amp; Jerry" data-copy="&copy; 2026"',
				),
			).toStrictEqual({
				title: "Tom &amp; Jerry",
				"data-copy": "&copy; 2026",
			});
		});

		it("parses attributes with equals sign surrounded by spaces", () => {
			expect(() =>
				extractAttributes('id = "main" class = "box"'),
			).toThrow(ErrorMessages.EQUALS_ATTRIBUTE);
		});

		it("parses a single slash-like boolean attribute", () => {
			expect(extractAttributes("/")).toStrictEqual({
				"/": "",
			});
		});

		it("parses trailing slash after attributes as a boolean attribute", () => {
			expect(
				extractAttributes('src="image.png" alt="Image" /'),
			).toStrictEqual({
				src: "image.png",
				alt: "Image",
				"/": "",
			});
		});

		it("uses the last value when duplicate attributes are provided", () => {
			expect(extractAttributes('class="one" class="two"')).toStrictEqual({
				class: "two",
			});
		});

		it("throws when a quoted attribute value is missing its closing quote", () => {
			expect(() => extractAttributes('title="hello')).toThrow(
				ErrorMessages.UNEXPECTED_END_OF_FILE,
			);
		});
	});
});
