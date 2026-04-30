# HTML and CSS Selectors & Specificity

* * *

## HTML & CSS: Selectors & Specificity

Selectors target the elements you want to style.

Specificity determines which rule wins when multiple selectors apply.

Master both to control your designs precisely.

* * *

## Basic selectors

Selector

Example

Description

Type

`p { ... }`

Matches all <p> elements.

Class

`.btn { ... }`

Matches elements with `class="btn"`.

ID

`#hero { ... }`

Matches the element with `id="hero"`.

Universal

`* { ... }`

Matches all elements.

If you want to read more about CSS Selectors or get an in-depth understanding, go to [CSS Selectors](https://www.w3schools.com/css/css_selectors.asp) in the CSS tutorial.

**Note:** Selectors are like addresses for elements.

Use them to point CSS at the exact parts of the page you want to change.

* * *

## Attribute selectors

*   `a[target="_blank"]` - links that open in a new tab.
*   `input[type="email"]` - email inputs.
*   `[class^="icon-"]` - classes starting with "icon-".

If you want to read more about Attribute Selectors or get an in-depth understanding, go to [CSS Attribute Selectors](https://www.w3schools.com/css/css_attribute_selectors.asp) in the CSS tutorial.

**Note:** Attribute selectors look inside an element's attributes, such as `href` or `type`, to find matches.

* * *

* * *

## Combinators

*   `.card p` - descendant selector.
*   `.card > h3` - direct child.
*   `h2 + p` - adjacent sibling.
*   `h2 ~ p` - general sibling.

If you want to read more about CSS Combinators or get an in-depth understanding, go to [CSS Combinators](https://www.w3schools.com/css/css_combinators.asp) in the CSS tutorial.

**Note:** Combinators describe relationships, for example "descendant" means any element inside another, while "child" means one level deep.

* * *

## Pseudo-classes and pseudo-elements

*   `a:hover`, `a:focus`, `a:visited`.
*   `input:required`, `input:invalid`.
*   `li:first-child`, `li:nth-child(2n)`.
*   `p::first-line`, `p::after`.

Learn more: [Pseudo-classes](https://www.w3schools.com/css/css_pseudo_classes.asp), [Pseudo-elements](https://www.w3schools.com/css/css_pseudo_elements.asp).

**Note:** Pseudo-classes target elements in a special state (like hover), and pseudo-elements let you style parts of an element, such as the first letter.

* * *

## Specificity rules

Specificity is calculated based on the selector type:

*   Inline styles: highest (1000).
*   ID selectors: 100.
*   Class/attribute/pseudo-class: 10.
*   Type/pseudo-element: 1.

**Note:** Think of these numbers as points.

The selector with more points wins when two rules try to style the same element.

When two rules conflict, the one with higher specificity wins.

If specificity ties, the later rule in the stylesheet wins.

This example compares class, class+class, and ID selectors to show how the browser resolves conflicts based on scores.

```javascript
.card { color:#475569; }
.card.highlight { color:#1d4ed8; }
#feature.card { color:#be123c; }
```

The ID selector has a higher specificity than classes, so its rule wins.

If two selectors have equal specificity, the one that appears later wins.

Element with id `feature` and class `card highlight` will be red `(#be123c)` because the ID selector wins.

More details: [CSS Specificity](https://www.w3schools.com/css/css_specificity.asp).

* * *

## Using the cascade strategically

*   Write from general to specific: base styles first, overrides later.
*   Group related selectors so overrides are easy to find.
*   Avoid `!important`; instead refactor selectors or order.

* * *

## Debugging specificity

*   Use browser DevTools to inspect computed styles and see which rule applies.
*   Keep selectors short (prefer classes over deeply nested selectors) to maintain clarity.

* * *

## Specificity cascade demo

This demo renders three cards to illustrate specificity and source order.

Try changing selector types to see which rule wins.

Syntax highlights: base `.card` class, a modifier class `.highlight`, and an ID selector that overrides both.

```javascript
<!DOCTYPE html>
<html>
<head>
<link rel="stylesheet" href="styles.css" type="text/css">
</head>
<body>
  <article class="card">
    <p>Default card text.</p>
  </article>
  <article class="card highlight">
    <p>Highlight card text.</p>
  </article>
  <article id="feature" class="card highlight">
    <p>Feature card text (ID wins).</p>
  </article>
</body>
</html>
```

Because `#feature` has the highest specificity, its color wins.

Remove the ID or adjust selectors to change the outcome.

* * *

* * *