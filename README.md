# cntx

A portable, human-writable block serialization format.

> To be clear, this exists so I can better orchestrate the content in my soon to be portfolio. Whether it has actual merit to exist, is beyond me, I think it's pretty rad and could have uses in between block style content management. This code was written by myself and reviewed by AI, the documentation on the other hand is AI written.

- Overall concept is inspired by WordPress's Gutenberg Editor, specifically the how blocks are stored within page content.
- Syntax is inspired by Pug, HTML, Markdown, and Pydoc-style string literals.

Documentation for this project is written in cntx itself. See [readme.cntx](./readme.cntx).

The markdown version below mirrors the same content for GitHub rendering.

A markup format and parser between HTML and Markdown. Tags look like HTML. Content is wrapped in explicit curly-brace flow blocks instead of inferred block structure. Shorthand `#id` and `.class` syntax works alongside normal HTML-style attributes.

The parser produces a typed AST. There is no renderer included in this package.

## Usage

```typescript
import { parse } from "cntx";

const document = parse(`<h1#heading>{Hello World}`);

console.log(document);
```

`parse` accepts a source string and returns a `DocumentNode`. It throws on invalid input.

## Syntax overview

A cntx document is a sequence of elements. Each element has:

1. An opening tag: `<tagname ...>`
2. An optional block: flow content, a literal fence, or nothing

There are no closing tags. Elements do not nest by indentation alone. To put content inside an element, open a flow block with `{` after the tag.

```cntx
<h1>{Heading}

<p>{Hello World}

<img src="https://example.com/image.jpg">
```

Leading and trailing whitespace between top-level elements is ignored.

### Comments

Any tag whose name starts with `!` is a comment. Comments use the same flow, literal fence, and empty blocks as elements, but they are not included in the AST.

```cntx
<!>{this is a comment}

<!note>{{{
multiline comment
}}}
```

To comment out markup without deleting it, prefix the tag name with `!`:

```cntx
<!p class="muted">{hello <strong>{world}}
```

An explicit empty comment uses an empty flow block:

```cntx
<!>{}
```

A bare comment tag with no block is also allowed and is treated as empty:

```cntx
<!>
```

To comment out a following element, prefix that element's tag name with `!` instead of stacking a bare comment tag before it:

```cntx
<!p>{hello}
```

### Tags

Tags start with `<` and end with the first unquoted `>`. Tag names may contain letters, digits, and hyphens.

```cntx
<h1>{Heading}
<p>{Paragraph}
<my-component>{Custom element}
```

An empty tag name is invalid:

```cntx
<>
```

### Attributes

Attributes appear inside the tag, after the tag name. Two styles can be combined on the same tag.

#### Shorthand id and class

Pug-style shorthand is supported directly on the tag name:

```cntx
<h1#heading-1>{Heading 1}
<p.large-text.lead>{Paragraph}
<div#app.container>{App shell}
```

Rules:

- `#id` sets the `id` attribute
- `.class` sets the `class` attribute
- Multiple `.class` segments are appended to the tag
- `#` and `.` cannot appear without a tag name
- Empty `#` or `.` segments are invalid
- Only one id is allowed per tag

#### HTML-style attributes

Standard space-separated attributes are supported:

```cntx
<img src="photo.jpg" alt="A photo">
<button data-id="123" aria-label="Close" disabled>{Save}
<input type="text" required>
```

Rules:

- Valued attributes must use a quoted value with double quotes, single quotes, or backticks
- Unquoted values are not supported
- Boolean attributes are written as bare names and parse to empty strings
- Attribute names may include hyphens, digits, colons, and underscores
- Duplicate attribute names keep the last value

When shorthand classes and an HTML `class` attribute are both present, the values are merged with a space:

```cntx
<p.large-text class="extra">{text}
```

That parses as `class="large-text extra"`.

When shorthand `#id` and an HTML `id` attribute are both present, the parser throws.

#### Quoted values inside tags

`>` characters inside quoted attribute values do not terminate the tag:

```cntx
<p title="1 > 2">{text}
```

#### Escape sequences

A backslash `\` escapes the next character inside quoted attribute values, flow blocks, and literal blocks.

| Sequence | Result                                           |
| -------- | ------------------------------------------------ |
| `\{`     | `{` inside a flow block                          |
| `\}`     | `}` inside a flow block                          |
| `\"`     | `"` inside a double-quoted attribute value       |
| `\'`     | `'` inside a single-quoted attribute value       |
| `` \` `` | `` ` `` inside a backtick-quoted attribute value |
| `\\`     | `\`                                              |

A backslash before any other character is kept as a literal `\` followed by that character. A trailing `\` immediately before the closing `}` or fence is invalid and throws `Unexpected end of file`.

In attribute values:

```cntx
<p title="say \"hello\"">{text}
<input value='it\'s fine'>
```

In flow blocks:

```cntx
<p>{say "hello"}
<p>{it's fine}
<p>{literal \} brace}
```

In literal blocks, a backslash escapes closing braces and backslashes so they do not end the fence early:

```cntx
<code>{{{say "hi"}}}
<code>{{{\}\}\}}}
```

The second example parses as a content string of three closing braces (`}}}`).

### Blocks

After a tag, the parser looks for a block in this order:

1. Literal fence: three opening curly braces (`{{{`) and three closing curly braces (`}}}`)
2. Flow block: an opening curly brace
3. Empty block: anything else, including end of file

#### Flow blocks

A flow block starts with `{` and ends with `}`. Flow blocks hold rich text and inline elements.

```cntx
<p>{Hello World}
```

An empty flow block opens and immediately closes:

```cntx
<p>{}
```

Flow blocks preserve whitespace and newlines:

```cntx
<p>{line one
line two}
```

Use `\` to include `{` or `}` in text (see [Escape sequences](#escape-sequences)).

Inline elements use the same tag-and-brace pattern:

```cntx
<p>{Hello <strong>{world}}
```

Flow blocks may contain text nodes, element nodes, or both:

```cntx
<p>{<strong>{bold} <em>{italic}}
```

#### Literal blocks

Literal blocks use a fence of `{{{` and `}}}`. They are intended for code or other raw text where flow parsing should not run.

```cntx
<code>{{{
console.log("Hello World")
}}}
```

The opening fence is consumed. Content between the opening and closing fence is stored as a single string. Newlines are preserved. Double quotes and single quotes can appear in literal content without escaping. Use `\` to include `}`, `{`, or `\` inside the content, or to include a closing `}}}` sequence (see [Escape sequences](#escape-sequences)).

An empty literal is valid:

```cntx
<code>{{{}}}
```

Literal fences take precedence over flow blocks. Input starting with `{{{` is always treated as a literal opener, not as a flow block followed by extra characters.

#### Empty blocks

An element has an empty block when:

- It is self-closing
- The tag is followed immediately by end of file
- The tag is followed by content that is not a valid block opener

```cntx
<p>
<img src="photo.jpg">
```

### Self-closing elements

An element is treated as self-closing when the character immediately after the tag, ignoring whitespace, is one of:

- `<`, which means another element follows
- the parent flow block's closing `}`, when that brace is the final character in the source

No separate `/>` syntax exists.

```cntx
<img src="photo.jpg"><p>{Next element}
```

Inside a flow block:

```cntx
<columns class="border-less" columns="2">{<img src="1.jpg"><img src="2.jpg">}
```

At end of file:

```cntx
<img src="photo.jpg">
```

If the next character is `{` and more content follows, the parser treats it as the start of a child flow block:

```cntx
<p>{<span>{text}}
```

If the next character is plain text or whitespace, the element gets an empty block:

```cntx
<p>{before <img src="photo.jpg"> after}
```

### Nesting

Nesting happens in two ways:

1. Flow nesting: child elements appear inside a parent flow block
2. Sibling elements: consecutive tags at the same level

```cntx
<div>{<p>{<strong>{deep}}}
```

```cntx
<h1>{Title}<p>{Body}
```

Without a flow block, consecutive tags are siblings, not parent and child:

```cntx
<p><strong>{bold}
```

That parses as an empty `<p>` followed by a `<strong>` element containing `bold`.

## AST

`parse` returns a document node:

```typescript
{
  type: "document",
  children: ElementNode[]
}
```

### Node types

| Type       | Description                             |
| ---------- | --------------------------------------- |
| `document` | Root node containing top-level elements |
| `element`  | A tag name, attributes, and a block     |
| `flow`     | Rich text and inline child nodes        |
| `text`     | Plain text inside a flow block          |
| `literal`  | Raw fenced string content               |
| `empty`    | No block content                        |

### Element node

```typescript
{
  type: "element",
  tag: {
    tag: string,
    attributes: Record<string, string>
  },
  block: FlowBlockNode | LiteralBlockNode | EmptyNodeBlock
}
```

Boolean attributes are stored as empty strings.

### Flow block node

```typescript
{
  type: "flow",
  children: (ElementNode | TextNode)[]
}
```

If a flow block opens and closes with no content, the block is `empty` rather than `flow`.

### Literal block node

```typescript
{
  type: "literal",
  content: string
}
```

## Errors

The parser throws a `ParseError` for invalid input. `ParseError` extends the
built-in `Error` and formats its message in the style of compiler diagnostics:
the line and column of the offending span, a snippet of the offending line, a
caret pointing at the span, and an optional `help:` hint.

```typescript
import { parse, ParseError } from "cntx";

try {
	parse("<p>{unclosed");
} catch (error) {
	if (error instanceof ParseError) {
		console.error(error.message);
		console.error("line:", error.line, "column:", error.column);
	}
}
```

The message above prints as:

```
error: Unexpected end of file
  --> 1:4
  |
1 | <p>{unclosed
  |    ^ unclosed flow block
  |
  = help: flow block is missing its closing `}`
```

### `ParseError` fields

| Field    | Description                                                        |
| -------- | ------------------------------------------------------------------ |
| `code`   | The error code (one of the `ErrorMessages` enum values)            |
| `source` | The original source string that was parsed                         |
| `index`  | Zero-based character offset of the start of the offending span     |
| `length` | Length of the offending span, in characters                        |
| `line`   | One-based line number of the span start                            |
| `column` | One-based column number of the span start                          |
| `label`  | Short label shown next to the caret (may be `undefined`)           |
| `hint`   | Optional `help:` hint shown below the snippet (may be `undefined`) |

The `ErrorMessages` enum and an `isParseError` type guard are also exported.

### Error codes

| `ErrorMessages` value           | Typical cause                                                                                                                 |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `Unexpected end of file`        | Unclosed flow block, unclosed literal fence, unclosed quoted attribute value, or a trailing `\` before a closing `}` or fence |
| `Unexpected character`          | Input does not start with `<`, or extra content appears after a complete element                                              |
| `Missing Tag Close`             | Tag is missing `>`, or an attribute quote is not closed before the tag ends                                                   |
| `Missing tag`                   | Empty tag name such as `<>`                                                                                                   |
| `Empty ID`                      | Shorthand id with no value, such as `<p#>`                                                                                    |
| `Empty Class`                   | Shorthand class with no value, such as `<p.>`                                                                                 |
| `Multiple IDs`                  | Both `#id` and `id="..."` on the same tag                                                                                     |
| `Equals cannot be an attribute` | Malformed attribute starting with `=`                                                                                         |
| `Quote must follow equals`      | Attribute value is missing opening quotes                                                                                     |

Invalid examples:

```cntx
<p>{unclosed
<code>{{{unclosed
<p title="unclosed
<p>{hello\
<p#foo id="bar">{text}
{hello}
hello<p>{world}
```

## Limitations

- Attribute values must be quoted. HTML-style unquoted values are not supported. This is intentional.
- The package exports `parse` only. Rendering, formatting, and validation beyond parsing are out of scope.

## Development

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm build
```

## License

ISC
