# HTML and CSS Grid Layout

* * *

## HTML & CSS: Grid Layout

CSS Grid unlocks two-dimensional layout.

Define rows, columns, and regions to design dashboards, landing pages, and complex responsive structures with minimal markup.

* * *

## Grid container essentials

*   Enable Grid with `display: grid;` or `inline-grid;`.
*   Use `grid-template-columns` and `grid-template-rows` to declare tracks.
*   `gap` (or `column-gap`/`row-gap`) handles spacing between tracks.

**Note:** A track is one column or row.

Imagine drawing a table with lines-Grid lets you define those lines in CSS.

If you want to read more about CSS Grid or get an in-depth understanding, go to [CSS Grid](https://www.w3schools.com/css/css_grid.asp) in the CSS tutorial.

* * *

## Track sizing strategies

*   Fixed tracks: `grid-template-columns: 300px 1fr 1fr;`.
*   Fractional units (`fr`) distribute remaining space.
*   Responsive tracks: `repeat(auto-fit, minmax(220px, 1fr))`.

**Note:** `fr` stands for "fraction"; it shares leftover space.

`minmax()` sets a minimum and maximum size so items can stretch.

* * *

* * *

## Example: Marketing Layout

This example uses a 12-column grid for the hero section (split copy and visual) and an auto-fit feature grid below.

It demonstrates responsive tracks and spacing.

```javascript
<!DOCTYPE html>
<html>
<head>
<link rel="stylesheet" href="styles.css" type="text/css">
</head>
<body>
  <section class="hero">
    <div class="copy">
      <h1>Design systems that scale</h1>
      <p>Unify design and engineering with a shared language of tokens, components, and guidelines.</p>
      <a class="cta" href="#">Get started</a>
    </div>
    <div class="visual">
      <h2>Release highlights</h2>
      <ul>
        <li>Theme builder with live preview</li>
        <li>Component usage analytics</li>
        <li>Accessibility score tracking</li>
      </ul>
    </div>
  </section>
  <section class="features">
    <article>
      <h3>Token management</h3>
      <p>Promote core spacing, color, and typography values across apps.</p>
    </article>
    <article>
      <h3>Component lifecycles</h3>
      <p>Track usage, adoption, and deprecation with analytics dashboards.</p>
    </article>
    <article>
      <h3>Design reviews</h3>
      <p>Automate review workflows and close the loop between design and code.</p>
    </article>
  </section>
</body>
</html>
```

The hero uses `grid-template-columns: repeat(12, 1fr)` and spans 6 columns per side on large screens, collapsing to full width via a media query.

The features use `repeat(auto-fit, minmax(220px, 1fr))` to adapt card count.

* * *

## Placing grid items

*   Auto-placement fills tracks in source order by default.
*   Explicit placement: `grid-column: 1 / 7;`, `grid-row: 2 / span 2;`.
*   Use named areas: `grid-template-areas` plus `grid-area` on items.

**Note:** "Auto" lets the browser place items automatically.

Explicit placement gives exact coordinates so items land where you want.

* * *

## Alignment controls

*   `justify-items` and `align-items` align content inside tracks.
*   `justify-content` and `align-content` distribute overall grid within the container.
*   `place-items` and `place-content` combine both axes.

* * *

## Responsive patterns

*   Use `auto-fit`/`auto-fill` with `minmax()` for fluid cards.
*   Combine media queries with track adjustments for complex breakpoints.
*   Switch to stacked layout by changing `grid-template-areas` on small screens.

**Note:** `auto-fit` collapses empty tracks, while `auto-fill` preserves them.

Both help grids adapt to screen size.

* * *

* * *