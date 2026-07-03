# HTML and CSS Responsive Design

* * *

## HTML & CSS: Responsive Design

Responsive design ensures every layout looks and works great on any device.

Combine flexible grid systems, fluid typography, and media queries to adapt content gracefully.

* * *

## Viewport basics

*   Add the viewport meta tag to control scaling: `<meta name="viewport" content="width=device-width, initial-scale=1">`.
*   Design mobile-first: start with a narrow viewport and progressively enhance for larger screens.
*   Use relative units (`rem`, `vw`, `%`) so elements scale naturally.

**Note:** Mobile-first means you write styles for phones first, then add media queries for tablets and desktops.

If you want to read more about Responsive Viewport or get an in-depth understanding, go to [CSS Viewport](https://www.w3schools.com/css/css_rwd_viewport.asp) in the CSS tutorial.

* * *

## Fluid grids

*   Leverage Flexbox and Grid with fractional units to flow content.
*   Apply `max-width` to prevent overly wide text blocks.
*   Wrap tracks with `minmax()` and `auto-fit`/`auto-fill` for automatic column counts.

**Note:** Fractional units like `1fr` share leftover space evenly, so columns resize smoothly.

* * *

* * *

## Responsive typography

*   Use `clamp()` to set min/preferred/max values: `font-size: clamp(1rem, 2vw, 1.5rem);`.
*   Scale headings and spacing together to maintain rhythm.
*   Consider fluid spacing tokens, e.g., `var(--space-fluid-sm)`.

**Note:** `clamp()` picks a value between a minimum and maximum, so text stays readable on every screen.

* * *

## Media queries

Apply breakpoints based on design needs-not specific devices.

**Note:** A breakpoint is the screen width where your layout needs to change.

Choose widths that fit your content.

```javascript
:root {
  --space: clamp(1rem, 2vw, 1.5rem);
}
.page {
  display: grid;
  gap: var(--space);
}
@media (min-width: 768px) {
  .page {
    grid-template-columns: 240px 1fr;
  }
}
@media (min-width: 1200px) {
  .page {
    grid-template-columns: 280px 2fr 1fr;
  }
}
```

Learn more: [CSS Media Queries](https://www.w3schools.com/css/css_rwd_mediaqueries.asp).

* * *

## Container queries (optional)

*   Use `@container` when component changes depend on parent width.
*   Wrap elements with `container-type: inline-size;`.
*   Still provide fallbacks for browsers without container query support.

**Note:** Container queries watch the size of a parent element instead of the whole screen, so components adapt exactly where needed.

* * *

## Responsive media

*   Make images fluid using `img { max-width: 100%; height: auto; }`.
*   Serve different sources via `<picture>` or `<source media>`.
*   Preserve aspect ratios using `object-fit` or padding hacks for embeds.

* * *

## Testing strategy

*   Use browser DevTools device mode to preview breakpoints quickly.
*   Test real devices when possible; pay attention to touch targets and orientation.
*   Audit performance-responsive assets should be optimized for mobile bandwidth.

* * *

* * *