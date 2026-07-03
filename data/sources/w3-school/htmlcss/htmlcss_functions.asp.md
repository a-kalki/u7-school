# HTML and CSS Functions & Calculations

* * *

## HTML & CSS: Functions & Calculations

CSS functions let you compute values, blend colors, and respond to context without extra JavaScript.

Combine them with custom properties to build smart, responsive design systems.

* * *

## Math helpers

*   `calc()` - add, subtract, multiply, or divide units (e.g., `width: calc(100% - 2rem);`).
*   `min()` / `max()` - pick the smallest or largest value.
*   `clamp(min, preferred, max)` - constrain a value to a responsive range.

**Note:** Think of `calc()` as a calculator in CSS, and `clamp()` as setting a minimum and maximum limit for a value.

If you want to read more or get an in-depth understanding, see [CSS calc()](https://www.w3schools.com/css/css_func_calc.asp) and [CSS clamp()](https://www.w3schools.com/css/css_func_clamp.asp) in the CSS tutorial.

* * *

## Example: Fluid Spacing

This example builds a responsive spacing scale with `clamp()` and applies it to padding, margins, and radii via custom properties.

```javascript
:root {
  --space-xs: clamp(0.5rem, 1vw, 0.75rem);
  --space-sm: clamp(0.75rem, 1.5vw, 1.125rem);
  --space-lg: clamp(1.5rem, 3vw, 2.5rem);
}
.card {
  padding: var(--space-lg);
  margin-block: var(--space-sm);
  border-radius: calc(var(--space-xs) * 2);
}
```

`clamp(min, preferred, max)` keeps spacing within bounds: it scales with viewport width but never shrinks below the minimum or grows beyond the maximum.

* * *

* * *

## Color functions

*   `rgb()`, `hsl()` accept decimals and alpha channels.
*   `color-mix()` blends two colors with a defined percentage.
*   `color-contrast()` (experimental) returns the best contrasting color.

**Note:** Alpha channels control transparency; a value of 0 is fully transparent and 1 is fully opaque.

If you want to read more or get an in-depth understanding, see [RGB Colors](https://www.w3schools.com/css/css_colors_rgb.asp) and [HSL Colors](https://www.w3schools.com/css/css_colors_hsl.asp) in the CSS tutorial.

* * *

## Trigonometry & geometry

*   Modern browsers support `sin()`, `cos()`, `tan()`, and `hypot()`.
*   Use them for animations, gradients, or polar positioning.
*   Pair with custom properties for interactive charts.

* * *

## Environment helpers

*   `env()` exposes safe-area insets on mobile devices.
*   `var()` fetches custom property values with optional fallbacks.
*   `attr()` retrieves attribute values inside generated content.

* * *

* * *