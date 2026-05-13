# cntx

The hypothetical middle ground between HTML and Markdown. Having better shortcode support (without all of the MDX import nonsense, or adding `[[[shortcode]]]` ), and a much more explicit syntax.

Inspired by Pug (everyone says formerly Jade, but it's been formerly Jade for like 11 years we can leave it off), HTML, Markdown and Pydoc. 

## Basic Example
```
<h1>"Heading"

<p>"Hello World"

<img src="https://example.com/image1.jpg"> // self closing tag
```

## Rich Text
```
<p>"
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. <em>"Proin mattis erat eu sem" iaculis, vel rhoncus mi mollis. Donec <a href="https://example.com">"consectetur" lacus vel risus laoreet tincidunt. Mauris vestibulum congue sagittis. Nunc hendrerit ante non risus luctus molestie. Vivamus tempus nisi a arcu aliquet faucibus. <strong>"Donec sed varius diam." Nulla blandit purus eget blandit hendrerit. Quisque placerat consectetur nulla. 
"
```

## Pug style classes & ids
```
<h1#heading-1>"Heading 1"
<p.large-text>"Heading 1"
```

## HTML style attributes
```
<columns class="border-less" data-columns="2">" // a columns shortcode & just a normal class
    <img src="https://example.com/image1.jpg">
    <img src="https://example.com/image2.jpg">
"
```

## String Literals for Code
```
<code lang="js">"""
console.log("Hello World")
"""
```