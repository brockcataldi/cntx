import { describe, expect, it } from "vitest";

import { extractTag } from "../src/index.js";

describe("extractTag", () => {
	it("empty string", () => {
		expect(() => extractTag("")).toThrow("Missing tag");
	});

	it("parses a single character tag", () => {
		expect(extractTag("p")).toStrictEqual(["p", "", {}]);
	});

	it("parses a single character with attribute tag", () => {
		expect(extractTag('p attribute="attribute"')).toStrictEqual([
			"p",
			'attribute="attribute"',
			{},
		]);
	});

	it("parses a single character tag with a shorthand id", () => {
		expect(extractTag("p#hello-world")).toStrictEqual([
			"p",
			"",
			{
				id: "hello-world",
			},
		]);
	});

	it("parses a single character with a shorthand class", () => {
		expect(extractTag("p.hello-world")).toStrictEqual([
			"p",
			"",
			{
				class: "hello-world",
			},
		]);
	});

	it("parses a multi-character tag with a shorthand id", () => {
		expect(extractTag("div#app")).toStrictEqual([
			"div",
			"",
			{
				id: "app",
			},
		]);
	});

	it("parses a multi-character tag with a shorthand class", () => {
		expect(extractTag("div.container")).toStrictEqual([
			"div",
			"",
			{
				class: "container",
			},
		]);
	});

	it("parses a tag with shorthand id and class", () => {
		expect(extractTag("div#app.container")).toStrictEqual([
			"div",
			"",
			{
				id: "app",
				class: "container",
			},
		]);
	});

	it("parses a tag with shorthand class and id", () => {
		expect(extractTag("div.container#app")).toStrictEqual([
			"div",
			"",
			{
				id: "app",
				class: "container",
			},
		]);
	});

	it("parses a tag with multiple shorthand classes", () => {
		expect(extractTag("div.container.large.primary")).toStrictEqual([
			"div",
			"",
			{
				class: "container large primary",
			},
		]);
	});

	it("parses a tag with shorthand id and multiple shorthand classes", () => {
		expect(
			extractTag("section#hero.full-width.dark.centered"),
		).toStrictEqual([
			"section",
			"",
			{
				id: "hero",
				class: "full-width dark centered",
			},
		]);
	});

	it("parses a tag with multiple shorthand classes and id in the middle", () => {
		expect(
			extractTag("section.full-width#hero.dark.centered"),
		).toStrictEqual([
			"section",
			"",
			{
				id: "hero",
				class: "full-width dark centered",
			},
		]);
	});

	it("parses a tag with numeric characters in shorthand id and class", () => {
		expect(extractTag("h1#heading-1.text-2xl")).toStrictEqual([
			"h1",
			"",
			{
				id: "heading-1",
				class: "text-2xl",
			},
		]);
	});

	it("parses a tag with underscores in shorthand id and class", () => {
		expect(extractTag("div#main_content.layout_grid")).toStrictEqual([
			"div",
			"",
			{
				id: "main_content",
				class: "layout_grid",
			},
		]);
	});

	it("parses a hyphenated tag with shorthand id and class", () => {
		expect(
			extractTag("custom-element#main-widget.is-active"),
		).toStrictEqual([
			"custom-element",
			"",
			{
				id: "main-widget",
				class: "is-active",
			},
		]);
	});

	it("parses a tag with shorthand id before html-inspired attributes", () => {
		expect(extractTag('input#email type="email" required')).toStrictEqual([
			"input",
			'type="email" required',
			{
				id: "email",
			},
		]);
	});

	it("parses a tag with shorthand class before html-inspired attributes", () => {
		expect(
			extractTag('button.primary type="submit" disabled'),
		).toStrictEqual([
			"button",
			'type="submit" disabled',
			{
				class: "primary",
			},
		]);
	});

	it("parses a tag with shorthand id and class before html-inspired attributes", () => {
		expect(
			extractTag('a#home-link.nav-item href="/" target="_self"'),
		).toStrictEqual([
			"a",
			'href="/" target="_self"',
			{
				id: "home-link",
				class: "nav-item",
			},
		]);
	});

	it("parses a tag with multiple shorthand classes before html-inspired attributes", () => {
		expect(
			extractTag('button.btn.btn-primary.large type="button" disabled'),
		).toStrictEqual([
			"button",
			'type="button" disabled',
			{
				class: "btn btn-primary large",
			},
		]);
	});

	it("does not treat dots or hashes in html-inspired attributes as shorthand", () => {
		expect(
			extractTag('a.link href="/docs#intro" data-path="foo.bar"'),
		).toStrictEqual([
			"a",
			'href="/docs#intro" data-path="foo.bar"',
			{
				class: "link",
			},
		]);
	});

	it("does not provide a default tag for shorthand class without a tag", () => {
		expect(() => extractTag(".container")).toThrow("Missing tag");
	});

	it("does not provide a default tag for shorthand id without a tag", () => {
		expect(() => extractTag("#app")).toThrow("Missing tag");
	});

	it("does not provide a default tag for shorthand id and class without a tag", () => {
		expect(() => extractTag("#app.container")).toThrow("Missing tag");
	});

	it("does not provide a default tag for multiple shorthand classes without a tag", () => {
		expect(() => extractTag(".container.mx-auto.flex")).toThrow(
			"Missing tag",
		);
	});

	it("throws when a tag has multiple shorthand ids in a row", () => {
		expect(() => extractTag("div#one#two")).toThrow();
	});

	it("throws when a tag has multiple shorthand ids separated by a class", () => {
		expect(() => extractTag("div#one.foo#two")).toThrow();
	});

	it("throws when a tag has multiple shorthand ids with the id after a class", () => {
		expect(() => extractTag("div.foo#one#two")).toThrow();
	});

	it("throws when a tag has multiple shorthand ids separated by multiple classes", () => {
		expect(() => extractTag("div#one.foo.bar#two")).toThrow();
	});

	it("throws when a tag has an empty id shorthand at the end", () => {
		expect(() => extractTag("div#")).toThrow();
	});

	it("throws when a tag has an empty id shorthand before a class", () => {
		expect(() => extractTag("div#.foo")).toThrow();
	});

	it("throws when a tag has an empty id shorthand between classes", () => {
		expect(() => extractTag("div.foo#.bar")).toThrow();
	});

	it("throws when a tag has an empty class shorthand at the end", () => {
		expect(() => extractTag("div.")).toThrow();
	});

	it("throws when a tag has an empty class shorthand before an id", () => {
		expect(() => extractTag("div.#foo")).toThrow();
	});

	it("throws when a tag has adjacent class separators", () => {
		expect(() => extractTag("div..foo")).toThrow();
	});

	it("throws when a tag has adjacent class separators after a valid class", () => {
		expect(() => extractTag("div.foo..bar")).toThrow();
	});

	it("throws when a tag has multiple adjacent class separators", () => {
		expect(() => extractTag("div.foo...bar")).toThrow();
	});

	it("throws when a tag has an empty class between id and class", () => {
		expect(() => extractTag("div#foo..bar")).toThrow();
	});

	it("throws when a tag has a trailing empty class after multiple classes", () => {
		expect(() => extractTag("div.foo.bar.")).toThrow();
	});

	it("throws when a tag has a trailing empty class after id and classes", () => {
		expect(() => extractTag("div#foo.bar.")).toThrow();
	});

	it("throws when a tag has an empty class after switching from class to id", () => {
		expect(() => extractTag("div.foo.#bar")).toThrow();
	});

	it("throws when a tag has an empty class after switching from id to class", () => {
		expect(() => extractTag("div#foo.#bar")).toThrow();
	});
	it("throws for whitespace-only input", () => {
		expect(() => extractTag("   ")).toThrow("Missing tag");
	});

	it("parses classes before and after an id", () => {
		expect(extractTag("div.foo#one.bar")).toStrictEqual([
			"div",
			"",
			{
				id: "one",
				class: "foo bar",
			},
		]);
	});

	it("throws for an empty id between classes", () => {
		expect(() => extractTag("div.foo#.bar")).toThrow("Empty ID");
	});

	it("throws for multiple ids after classes", () => {
		expect(() => extractTag("div.foo#one.bar#two")).toThrow("Multiple IDs");
	});

	it("throws for an empty class after an id", () => {
		expect(() => extractTag("div#one.")).toThrow("Empty Class");
	});

	it("throws for adjacent class separators after an id", () => {
		expect(() => extractTag("div#one..foo")).toThrow("Empty Class");
	});

	it("throws for whitespace-only input", () => {
		expect(() => extractTag("   ")).toThrow("Missing tag");
	});
	it("trims leading and trailing whitespace around the input", () => {
		expect(extractTag("  div#app.container  ")).toStrictEqual([
			"div",
			"",
			{
				id: "app",
				class: "container",
			},
		]);
	});

	it("trims extra whitespace before html-inspired attributes", () => {
		expect(extractTag('div#app   data-value="123"')).toStrictEqual([
			"div",
			'data-value="123"',
			{
				id: "app",
			},
		]);
	});

	it("preserves spaces inside html-inspired attribute values", () => {
		expect(extractTag('img.thumbnail alt="Hello world"')).toStrictEqual([
			"img",
			'alt="Hello world"',
			{
				class: "thumbnail",
			},
		]);
	});

	it("parses a tag with id and no shorthand class before attributes", () => {
		expect(extractTag('label#name-label for="name"')).toStrictEqual([
			"label",
			'for="name"',
			{
				id: "name-label",
			},
		]);
	});

	it("parses a tag with multiple classes and attributes containing hashes and dots", () => {
		expect(
			extractTag(
				'div.card.active data-url="/docs#intro" data-file="index.html"',
			),
		).toStrictEqual([
			"div",
			'data-url="/docs#intro" data-file="index.html"',
			{
				class: "card active",
			},
		]);
	});
});
