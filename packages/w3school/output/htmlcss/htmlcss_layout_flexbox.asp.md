# HTML and CSS Flexbox Layout

* * *

## HTML & CSS: Flexbox Layout

Flexbox (Flexible Box Layout) excels at arranging components in one dimension, either rows or columns, while distributing space and aligning items responsively.

* * *

## Why flexbox?

*   Simple alignment: center items vertically and horizontally without hacks.
*   Adaptive spacing: flex items expand, shrink, or wrap within available space.
*   Component-friendly: build navbars, cards, media objects, toolbars, and forms.

If you want to read more about CSS Flexbox or get an in-depth understanding, go to [CSS Flexbox](https://www.w3schools.com/css/css3_flexbox.asp) in the CSS tutorial.

* * *

## Creating a flex container

Enable Flexbox by setting `display: flex;` (row) or `display: inline-flex;`. Use `flex-direction` to switch to columns.

**Note:** A flex container is the parent element.

Its children become flex items that follow the rules below.

```javascript
.toolbar {
  display: flex;
  gap: 16px;
  align-items: center;
}
.toolbar .spacer {
  flex: 1 1 auto;
}
```

* * *

* * *

## Axis and alignment

*   **Main axis** follows `flex-direction`. Control distribution with `justify-content`.
*   **Cross axis** is perpendicular. Align items with `align-items` or per-item `align-self`.
*   Use `gap` for consistent spacing without extra margins.

**Note:** If `flex-direction` is row, the main axis is horizontal and the cross axis is vertical.

Switching to column flips them.

```javascript
<!DOCTYPE html>
<html>
<head>
<link rel="stylesheet" href="styles.css" type="text/css">
</head>
<body>
  <section class="cards">
    <article>
      <h2>Prototype</h2>
      <p>Validate ideas quickly with interactive mockups.</p>
    </article>
    <article>
      <h2>Build</h2>
      <p>Create accessible, responsive components in code.</p>
    </article>
    <article>
      <h2>Ship</h2>
      <p>Automate deployment pipelines and monitoring.</p>
    </article>
  </section>
</body>
</html>
```

* * *

## Controlling flex items

*   `flex: grow shrink basis;` defines how items consume space (default `0 1 auto`).
*   `flex-basis` sets ideal size before free space is distributed.
*   Combine `flex` shortcuts like `flex: 1;` (equal widths) or `flex: 0 0 300px;` (fixed width).

**Note:** The three numbers in `flex` mean grow, shrink, and base size.

For example, `flex: 1` lets items grow equally.

* * *

## Ordering and wrapping

*   `flex-wrap: wrap;` breaks items into new rows or columns.
*   `order` reorders items visually without changing the DOM.
*   Use `align-content` when multiple flex lines exist.

**Note:** Wrapping stops items from squishing too small; they move to the next line instead.

* * *

## Common patterns

*   Toolbar with growing spacer.
*   Split layout: two columns with `flex: 2` and `flex: 1`.
*   Responsive media object: image + text that stacks on small screens.

* * *

* * *