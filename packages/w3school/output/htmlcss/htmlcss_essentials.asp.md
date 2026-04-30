# HTML and CSS Essentials

* * *

## HTML & CSS: Essentials

Learn the core building blocks: HTML elements, attributes, and how CSS hooks onto them to control presentation.

* * *

## HTML element anatomy

Every element has an opening tag, optional content, and a closing tag.

The browser reads this tree (called the DOM) to render the page.

```javascript
<p class="lead" title="Intro">Hello world</p>
```

*   **Tag name:** `p` defines a paragraph.
*   **Attributes:** `class` and `title` supply metadata.
*   **Content:** Inner text that users see.

If you want to read more or get an in-depth understanding, see [HTML Elements](https://www.w3schools.com/html/html_elements.asp) and [HTML Attributes](https://www.w3schools.com/html/html_attributes.asp) in the HTML tutorial.

* * *

## Global attributes you will use everywhere

*   `class` - groups elements for CSS styling.
*   `id` - unique identifier for one element (useful for anchors and scripting).
*   `title` - tooltip text.
*   `lang` - language of a document or element (`<html lang="en">`).
*   `data-*` - custom data attributes for scripts or styling hooks.

Reference: [HTML Global Attributes](https://www.w3schools.com/tags/ref_standardattributes.asp).

* * *

* * *

## How CSS attaches to HTML

Use selectors based on tag, class, or id to style the markup.

Inline styles work, but external stylesheets keep projects maintainable.

**Note:** Selectors are words that tell CSS which HTML element to style, for example `.card` for any element with class="card".

```javascript
<article class="card" id="intro">
  <h2>Welcome</h2>
  <p>Learning HTML and CSS together unlocks creative freedom.</p>
</article>
```

If you want to read more or get an in-depth understanding, see [CSS Syntax](https://www.w3schools.com/css/css_syntax.asp) and [How To Add CSS](https://www.w3schools.com/css/css_howto.asp) in the CSS tutorial.

* * *

## Semantic structure matters

Prefer semantic tags (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`) over generic `<div>`s.

They help screen readers and search engines understand the page.

Check [HTML Semantics](https://www.w3schools.com/html/html5_semantic_elements.asp) for full definitions.

* * *

## Block vs inline

*   **Block elements** (e.g., `<div>`, `<section>`, `<p>`) span full width and start on a new line.
*   **Inline elements** (e.g., `<span>`, `<a>`, `<strong>`) only take necessary width.

This distinction affects layout and is crucial when applying CSS display rules.

If you want to read more about HTML Block & Inline or get an in-depth understanding, go to [HTML Block & Inline](https://www.w3schools.com/html/html_blocks.asp) in the HTML tutorial.

* * *

## Whitespace and indentation

Indent child elements consistently to visualize hierarchy.

Browsers ignore extra whitespace, but it makes code easier to read for us humans.

<main>
  <section>
    <h2>Headline</h2>
    <p>Supporting text.</p>
  </section>
</main>

* * *

* * *