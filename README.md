# cntx

A markup format and parser that sits between HTML and Markdown. Tags look like HTML. Content is wrapped in explicit quote delimiters instead of inferred block structure. Shorthand `#id` and `.class` syntax is supported alongside normal HTML-style attributes.

The parser produces a typed AST. There is no renderer included in this package.

Inspired by Pug, HTML, Markdown, and Pydoc-style string literals.

## TODOs

1. Escaping Characters
2. Comments (// and /**/)

## Usage

```typescript
import { parse } from "cntx";

const document = parse(`<h1#heading>"Hello World"`);

console.log(document);
```

`parse` accepts a source string and returns a `DocumentNode`. It throws on invalid input.

## Syntax overview

A cntx document is a sequence of elements. Each element has:

1. An opening tag: `<tagname ...>`
2. An optional block: flow content, a literal fence, or nothing

There are no closing tags. Elements do not nest by indentation alone. To put content inside an element, open a block with a quote character after the tag.

```
<h1>"Heading"

<p>"Hello World"

<img src="https://example.com/image.jpg">
```

Leading and trailing whitespace between top-level elements is ignored.

## Tags

Tags start with `<` and end with the first unquoted `>`. Tag names may contain letters, digits, and hyphens.

```
<h1>"Heading"
<p>"Paragraph"
<my-component>"Custom element"
```

An empty tag name is invalid:

```
<>
```

## Attributes

Attributes appear inside the tag, after the tag name. Two styles can be combined on the same tag.

### Shorthand id and class

Pug-style shorthand is supported directly on the tag name:

```
<h1#heading-1>"Heading 1"
<p.large-text.lead>"Paragraph"
<div#app.container>"App shell"
```

Rules:

- `#id` sets the `id` attribute
- `.class` sets the `class` attribute
- Multiple `.class` segments are appended to the tag
- `#` and `.` cannot appear without a tag name
- Empty `#` or `.` segments are invalid
- Only one id is allowed per tag

### HTML-style attributes

Standard space-separated attributes are supported:

```
<img src="photo.jpg" alt="A photo">
<button data-id="123" aria-label="Close" disabled>"Save"
<input type="text" required>
```

Rules:

- Valued attributes must use a quoted value: `"..."`, `'...'`, or `` `...` ``
- Unquoted values are not supported
- Boolean attributes are written as bare names and parse to empty strings
- Attribute names may include hyphens, digits, colons, and underscores
- Duplicate attribute names keep the last value

When shorthand classes and an HTML `class` attribute are both present, the values are merged with a space:

```
<p.large-text class="extra">"text"
```

parses as `class="large-text extra"`.

When shorthand `#id` and an HTML `id` attribute are both present, the parser throws.

### Quoted values inside tags

`>` characters inside quoted attribute values do not terminate the tag:

```
<p title="1 > 2">"text"
```

## Blocks

After a tag, the parser looks for a block. Block detection happens in this order:

1. **Literal fence**: three matching quote characters (`"""`, `'''`, or ` ``` `)
2. **Flow block**: a single quote character (`"`, `'`, or `` ` ``)
3. **Empty block**: anything else, including end of file

### Flow blocks

A flow block starts with a single opening quote and ends with a matching closing quote of the same kind. Flow blocks hold rich text and inline elements.

```
<p>"Hello World"
<p>'Hello World'
<p>`Hello World`
```

An empty flow block is written by opening and immediately closing the same quote:

```
<p>""
<p>''
<p>``
```

Flow blocks preserve whitespace and newlines:

```
<p>"line one
line two"
```

Inline elements appear inside the flow block using the same tag-and-quote pattern:

```
<p>"Hello <strong>"world""
<p>"Hello <em>'italic'""
```

In the second example, the outer block uses `"` and the inner `<em>` block uses `'`. Mixed quote styles are allowed when nesting.

Flow blocks may contain text nodes, element nodes, or both:

```
<p>"<strong>"bold" <em>"italic""
```

### Literal blocks

Literal blocks are fenced with three matching quote characters. They are intended for code or other raw text where flow parsing should not run.

```
<code>"""
console.log("Hello World")
"""

<code lang="js">'''
const x = 1
'''

<code>```
SELECT * FROM users
```
```

The opening fence is consumed. Content between the opening and closing fence is stored as a single string. Newlines are preserved. Double quotes may appear inside a triple-double-quoted literal as long as they are not part of a closing fence.

An empty literal is valid:

```
<code>'''
'''
```

Literal fences take precedence over flow blocks. Input starting with `"""` is always treated as a literal opener, not as a flow block followed by extra quotes.

### Empty blocks

An element has an empty block when:

- It is self-closing (see below)
- The tag is followed immediately by end of file
- The tag is followed by content that is not a valid block opener

```
<p>
<img src="photo.jpg">
```

## Self-closing elements

An element is treated as self-closing when the character immediately after the tag, ignoring whitespace, is one of:

- `<`, which means another element follows
- the parent flow block's closing quote, when that quote is the final character in the source

No separate `/>` syntax exists.

```
<img src="photo.jpg"><p>"Next element"
```

Inside a flow block:

```
<columns class="border-less" columns="2">"<img src="1.jpg"><img src="2.jpg">"
```

At end of file:

```
<img src="photo.jpg">
```

If the next character is the same quote character used by the parent flow, but more content follows, the parser treats it as the start of a child flow block:

```
<p>"<span>"text""
```

If the next character is plain text or whitespace, the element gets an empty block:

```
<p>`before <img src="photo.jpg"> after`
```

## Nesting

Nesting happens in two ways:

1. **Flow nesting**: child elements appear inside a parent flow block
2. **Sibling elements**: consecutive tags at the same level

```
<div>"<p>"<strong>"deep"""
```

```
<h1>"Title"<p>"Body"
```

Without a flow block, consecutive tags are siblings, not parent and child:

```
<p><strong>"bold"
```

parses as an empty `<p>` followed by a `<strong>` element containing `"bold"`.

## AST

`parse` returns a document node:

```typescript
{
  type: "document",
  children: ElementNode[]
}
```

### Node types

| Type | Description |
| --- | --- |
| `document` | Root node containing top-level elements |
| `element` | A tag name, attributes, and a block |
| `flow` | Rich text and inline child nodes |
| `text` | Plain text inside a flow block |
| `literal` | Raw fenced string content |
| `empty` | No block content |

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
  quote: '"' | "'" | "`",
  children: (ElementNode | TextNode)[]
}
```

If a flow block opens and closes with no content, the block is `empty` rather than `flow`.

### Literal block node

```typescript
{
  type: "literal",
  quote: '"' | "'" | "`",
  content: string
}
```

## Errors

The parser throws `Error` with one of these messages:

| Message | Typical cause |
| --- | --- |
| `Unexpected end of file` | Unclosed flow block, unclosed literal fence, or unclosed quoted attribute value |
| `Unexpected character` | Input does not start with `<`, or extra content appears after a complete element |
| `Missing Tag Close` | Tag is missing `>`, or an attribute quote is not closed before the tag ends |
| `Missing tag` | Empty tag name such as `<>` |
| `Empty ID` | Shorthand id with no value, such as `<p#>` |
| `Empty Class` | Shorthand class with no value, such as `<p.>` |
| `Multiple IDs` | Both `#id` and `id="..."` on the same tag |
| `Equals cannot be an attribute` | Malformed attribute starting with `=` |
| `Quote must follow equals` | Attribute value is missing opening quotes |

Examples:

```
<p>"unclosed
<code>"""unclosed
<p title="unclosed
<p#foo id="bar">"text"
"hello"
hello<p>"world"
```

## Limitations
- Attribute values must be quoted. HTML-style unquoted values are not supported.**I do not plan on moving this in.**
- The package exports `parse` only. Rendering, formatting, and validation beyond parsing are out of scope.

## Development

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm build
```

## Examples

### Basic page structure

```
<h1>"Heading"

<p>"Hello World"

<img src="https://example.com/image.jpg">
```

### Rich text

```
<p>"
Lorem ipsum dolor sit amet. <em>"Proin mattis erat eu sem" iaculis,
vel rhoncus mi mollis. Donec <a href="https://example.com">"consectetur" lacus
vel risus laoreet tincidunt. <strong>"Donec sed varius diam." Nulla blandit
purus eget blandit hendrerit.
"
```

### Shortcode-style component

```
<columns class="border-less" columns="2">"
    <img src="https://example.com/image1.jpg">
    <img src="https://example.com/image2.jpg">
"
```

### Code literal

```
<code lang="js">"""
console.log("Hello World")
"""
```

### Combined shorthand and HTML attributes

```
<h1#heading-1.main-title class="theme-dark">"Heading 1"
```

