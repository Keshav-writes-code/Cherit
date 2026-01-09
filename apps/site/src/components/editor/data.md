# Markdown Features Showcase

This document demonstrates a wide variety of Markdown features. Use it as a reference or template.

---

## Headings

# H1 Heading

## H2 Heading

### H3 Heading

#### H4 Heading

##### H5 Heading

###### H6 Heading

---

## Emphasis

*This text is italic*  
*This is also italic*  

**This text is bold**  
**This is also bold**  

~~This text is strikethrough~~

---

## Blockquotes

> This is a blockquote.
>
> > Nested blockquote.

---

## Lists

### Unordered List

- Item 1
    - Subitem 1.1
      - Subitem 1.1.1
- Item 2
- Item 3

### Ordered List

1. First item
2. Second item
      1. Subitem 2.1
      2. Subitem 2.2
3. Third item

### Task List

- [x] Task 1
- [ ] Task 2 (incomplete)
- [x] Task 3

---

## Links

[Visible Text Link](https://github.com)

<https://github.com>

[Relative Link](docs/example.md)

---

## Images

![GitHub Logo](https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png)

---

## Inline Code

Wrap code snippets with backticks:  
`console.log('Hello, world!');`

---

## Code Blocks

```python
def greet(name):
    print(f"Hello, {name}!")
greet("Markdown")
```

```html
<!-- HTML Example -->
<div>Hello World</div>
```

    # Indented code block
    echo "Hello from indented block"

---

## Horizontal Rule

---

## Tables

| Syntax      | Description  |
| ----------- | ------------ |
| Header      | Title        |
| Paragraph   | Text         |

| Left Aligned  | Center Aligned |  Right Aligned |
| :------------ | :------------: | -------------: |
| Left          | Center         | Right          |

---

## HTML in Markdown

<b>This is bold HTML text</b>  
<i>This is italic HTML text</i>

---

## Footnotes

Here is a simple footnote[^1].

[^1]: This is the footnote text.

---

## Definition Lists

Term 1
:   Definition of term 1

Term 2
:   Definition of term 2

---

## Emoji

:tada: :rocket: :smile:

---

## Math (GitHub Flavored Markdown support is limited)

Inline math: $a^2 + b^2 = c^2$

Block math:

```math
E = mc^2
```

---

## Mention

@Keshav-writes-code

---

## Reference-style Links

See [GitHub][gh].

[gh]: https://github.com

---

## Collapsible Section (details tag, works on GitHub)

<details>
  <summary>Click to expand</summary>
  
  Hidden details go here!

  - Item A
  - Item B

</details>

---

*End of Markdown Features Showcase*
