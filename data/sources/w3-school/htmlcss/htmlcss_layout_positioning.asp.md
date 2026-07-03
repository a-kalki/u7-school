# HTML and CSS Positioning & Z-Index

* * *

## HTML & CSS: Positioning & Z-Index

Positioning lets you break out of normal flow when you need overlays, tooltips, sticky headers, or UI chrome.

Learn how the `position` property, offsets, and `z-index` interact with stacking contexts.

* * *

## Positioning modes

*   **static** - default; the element stays in normal flow.
*   **relative** - stays in flow but offsets visually using `top/right/bottom/left`.
*   **absolute** - removed from flow and positioned relative to the nearest ancestor with positioning.
*   **fixed** - pinned to the viewport; ignores scrolling.
*   **sticky** - behaves like relative until a scroll threshold where it sticks like fixed.

**Note:** Normal flow means the browser's default placement.

Absolute and fixed positioning skip that flow, so other elements act like they are not there.

If you want to read more about CSS Positioning or get an in-depth understanding, go to [CSS Positioning](https://www.w3schools.com/css/css_positioning.asp) in the CSS tutorial.

* * *

## Offset properties

Combine `position` with offsets to place elements:

*   `top` / `bottom` control vertical displacement.
*   `left` / `right` control horizontal displacement.
*   Percentages resolve against the containing block (e.g., positioned ancestor).

**Note:** Offsets move the element away from its reference point.

For example, `top: 10px` pushes it 10 pixels down.

* * *

* * *

## Sticky Header with Scroll Indicator

Sticky headers are common in UI chrome and navigation.

```javascript
<!DOCTYPE html>
<html>
<head>
<link rel="stylesheet" href="styles.css" type="text/css">
</head>
<body>
  <header class="hero">
    <h1>Design Systems Handbook</h1>
    <progress value="25" max="100"></progress>
  </header>
  <main>
    <p>Scroll to see the sticky header stay in view while content flows underneath.</p>
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque habitant morbi tristique senectus et netus.</p>
  </main>
</body>
</html>
```

* * *

## Managing z-index

*   Only positioned elements (plus flex/grid children) respect `z-index`.
*   Higher `z-index` wins within the same stacking context.
*   New stacking contexts form when you use `position` with `z-index`, or properties like `opacity < 1`, `transform`, or `filter`.

**Note:** Think of `z-index` as depth.

Bigger numbers appear on top, but only inside the same stacking context.

If you want to read more about CSS z-index or get an in-depth understanding, go to [CSS z-index](https://www.w3schools.com/css/css_z-index.asp) in the CSS tutorial.

* * *

## Pattern: tooltip component

```javascript
<!DOCTYPE html>
<html>
<head>
<link rel="stylesheet" href="styles.css" type="text/css">
</head>
<body>
  <button class="button">
    Save draft
    <span class="tooltip">Shortcut: Ctrl + S</span>
  </button>
</body>
</html>
```

* * *

## Guidelines

*   Prefer relative + absolute positioning within components for badges or icons.
*   Keep fixed elements (like sticky navbars) minimal to avoid screen real estate issues.
*   Use `position: sticky;` for table headers or in-page navs that follow scrolling sections.
*   Audit stacking contexts when overlays misbehave-DevTools highlights them.

* * *

* * *