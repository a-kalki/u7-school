# HTML and CSS Colors & Backgrounds

* * *

## HTML & CSS: Colors & Backgrounds

Color sets the mood and guides focus.

Learn how to use CSS color functions, gradients, and backgrounds to create rich visual design.

* * *

## Color notations

*   Keywords: `color: royalblue;`
*   Hex: `#0F172A`
*   RGB/RGBA: `rgb(15, 23, 42)`, `rgba(14, 165, 233, 0.2)`
*   HSL/HSLA: `hsl(210, 40%, 15%)`

**Note:** RGB mixes red, green, and blue values, while HSL stands for hue (color), saturation (intensity), and lightness (brightness).

If you want to read more or get an in-depth understanding, see [CSS Colors](https://www.w3schools.com/css/css_colors.asp), [RGB](https://www.w3schools.com/css/css_colors_rgb.asp), and [HSL](https://www.w3schools.com/css/css_colors_hsl.asp) in the CSS tutorial.

* * *

## CSS variables for color palettes

Define reusable color tokens as custom properties on `:root`, then reference them with `var(--name)` in your rules.

This keeps palettes consistent and easy to theme.

Syntax: `:root { --color-primary: #2563eb; } .hero { background: var(--color-primary); }`

```javascript
:root {
  --color-primary: #2563eb;
  --color-primary-dark: #1d4ed8;
  --color-neutral-900: #0f172a;
}
.hero { background: var(--color-primary); color: #fff; }
.hero h1 { color: #fff; }
```

This snippet declares `--color-primary` and uses `var(--color-primary)` to color a hero section.

Updating the variable updates all usages automatically.

Learn more: [CSS Variables](https://www.w3schools.com/css/css3_variables.asp).

**Note:** CSS variables (also called custom properties) let you store colors once and reuse them across styles.

* * *

* * *

## Background properties

*   `background-color` - solid colors.
*   `background-image` - images or gradients.
*   `background-size` - `cover`, `contain`, or dimensions.
*   `background-position`, `background-repeat`, `background-attachment`.

If you want to read more about CSS Background or get an in-depth understanding, go to [CSS Background](https://www.w3schools.com/css/css_background.asp) in our CSS tutorial.

* * *

## Gradients

Create smooth color transitions using `linear-gradient`, `radial-gradient`, or `conic-gradient`.

**Note:** Gradients blend two or more colors together, and you can control direction and shape.

```javascript
.hero {
  background-image: linear-gradient(135deg, #6366f1 0%, #ec4899 100%);
}
```

The rule applies a `linear-gradient(135deg, ...)` as the element's `background-image`, producing a diagonal blend from indigo to pink.

Explore: [CSS Gradients](https://www.w3schools.com/css/css3_gradients.asp).

* * *

## Overlay techniques

Layer gradients above images using multiple backgrounds.

```javascript
.hero {
  background-image:
    linear-gradient(rgba(15, 23, 42, 0.6), rgba(15, 23, 42, 0.6)),
    url("images/mountains.jpg");
  background-size: cover;
  background-position: center;
}
```

Multiple backgrounds are layered from top to bottom: the semi-transparent gradient is listed first so it overlays the image.

`background-size: cover` ensures the image fills the area.

* * *

## Background patterns

Use data URIs or CSS gradients for subtle patterns without extra assets.

* * *

## Color contrast and accessibility

*   Ensure contrast ratio of at least 4.5:1 for body text and 3:1 for large text.
*   Test with tools like the W3C contrast checker.
*   Avoid using color alone to convey meaning; add icons or text.

If you want to read more about CSS Accessibility or get an in-depth understanding, go to [CSS Accessibility](https://www.w3schools.com/css/css_accessibility.asp) in our CSS tutorial.

* * *

## Hero with gradient overlay and image

This example composes a full-viewport hero using two layered backgrounds: a semi-transparent gradient on top of a photo.

It centers content with CSS Grid.

Syntax highlights: multiple `background-image` values separated by commas, plus responsive `clamp()` sizing for headings.

```javascript
<!DOCTYPE html>
<html>
<head>
<link rel="stylesheet" href="styles.css" type="text/css">
</head>
<body>
  <section class="hero">
    <div>
      <h1>Design with color</h1>
      <p>Layer gradients and imagery with accessible contrast.</p>
    </div>
  </section>
</body>
</html>
```

The gradient is listed before the image so it sits above it.

The hero fills the viewport with `min-height: 100vh`, and text remains readable due to the overlay and color choices.

* * *

* * *