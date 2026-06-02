# HTML and CSS Box Model

* * *

## HTML & CSS: Box Model

Every element on the page is a rectangular box.

Understanding the box model helps you control spacing, borders, and layout with precision.

* * *

## The four layers

*   **Content** - text or media inside the element.
*   **Padding** - space between content and border; inherits background.
*   **Border** - stroke around padding and content.
*   **Margin** - outer spacing that separates the element from neighbors.

**Note:** Remember: content sits in the middle, padding surrounds it, the border wraps both, and the margin is the outside buffer.

If you want to read more about CSS Box Model or get an in-depth understanding, go to [CSS Box Model](https://www.w3schools.com/css/css_boxmodel.asp) in our CSS tutorial.

* * *

## Default vs. alternate sizing

By default (`box-sizing: content-box`), width and height apply to content only.

Switching to `border-box` includes padding and border in the declared size, making layout math easier.

**Note:** With `border-box`, a 300px wide box stays 300px even after you add padding and border.

```javascript
* {
  box-sizing: border-box;
}
.card {
  width: 320px;
  padding: 24px;
  border: 2px solid #cbd5f5;
  margin-bottom: 24px;
}
.callout {
  margin: 32px 0;
  padding: 16px;
  border-left: 6px solid #2563eb;
  background: #eff6ff;
}
```

Learn more: [CSS box-sizing](https://www.w3schools.com/css/css3_box-sizing.asp).

* * *

* * *

## Visualizing with DevTools

Inspect an element in Chrome or Firefox DevTools to see a box model diagram showing margin, border, padding, and content all at once.

* * *

## Collapsing margins

*   Vertical margins between block elements collapse to the largest value.
*   A parent and its first/last child can share margins unless padding or borders intervene.
*   Use padding on containers to avoid unexpected collapses.

If you want to read more about Margin Collapse or get an in-depth understanding, go to [CSS Margin](https://www.w3schools.com/css/css_margin.asp) in our CSS tutorial.

* * *

## Shorthand properties

Control spacing efficiently with shorthands:

*   `margin: 24px 16px;` ➜ top/bottom 24px, left/right 16px.
*   `padding: 8px 12px 16px;` ➜ top/right/bottom/left in clockwise order.
*   `border: 2px solid #1d4ed8;` ➜ width, style, color.

* * *

## Example layout

```javascript
<!DOCTYPE html>
<html>
<head>
<link rel="stylesheet" href="styles.css" type="text/css">
</head>
<body>
  <article class="card">
    <h2>UX Writing Checklist</h2>
    <p>Keep copy concise, conversational, and aligned with the design system voice.</p>
    <a class="cta" href="#">Download PDF</a>
  </article>
</body>
</html>
```

* * *

## Spacing strategies

*   Create a spacing scale (e.g., base of 4 or 8) and stick to it across components.
*   Use CSS custom properties for consistent margins and padding.
*   Combine `gap` with Flexbox or Grid to separate items without extra margins.

* * *

* * *