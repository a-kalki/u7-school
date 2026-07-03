# HTML and CSS Styling Essentials

* * *

## HTML & CSS: Styling Essentials

CSS (Cascading Style Sheets) controls color, typography, spacing, and layout.

Master the basics to transform plain markup into polished designs.

* * *

## How CSS works

*   CSS is a set of rules applied to HTML elements.
*   Each rule consists of a **selector** and a set of **declarations**.
*   The browser reads stylesheets top to bottom and resolves conflicts using the cascade.

**Note:** A selector names the HTML element you want to style, and the cascade is the decision process the browser uses when two rules try to style the same element.

```javascript
section.hero {
  background: #0f172a;
  color: #fff;
  padding: 80px 24px;
}
```

Review: [CSS Syntax](https://www.w3schools.com/css/css_syntax.asp).

* * *

## Ways to include CSS

*   **External stylesheet:** `<link rel="stylesheet" href="css/styles.css">` (recommended).
*   **Internal stylesheet:** `<style>` inside the `<head>`.
*   **Inline styles:** `style="..."` on an element (use sparingly).

If you want to read more about how to add CSS or get an in-depth understanding, go to [How to Add CSS](https://www.w3schools.com/css/css_howto.asp) in the CSS tutorial.

* * *

* * *

## Common selectors

Selectors target elements by type, class, id, or relationship.

Explore the dedicated chapter next.

*   Type selector: `p { ... }`
*   Class selector: `.card { ... }`
*   ID selector: `#hero { ... }`
*   Attribute selector: `input[type="email"] { ... }`

**Note:** Type selectors match element names, classes group many elements, and IDs target a single unique element.

If you want to read more about CSS Selectors or get an in-depth understanding, go to [CSS Selectors](https://www.w3schools.com/css/css_selectors.asp) in the CSS tutorial.

* * *

## Declarations and values

Each declaration has a property name and value, ending with a semicolon.

```javascript
body {
  font-family: "Inter", sans-serif;
  line-height: 1.7;
  background-color: #f4f6fb;
}
```

Check [CSS Reference](https://www.w3schools.com/cssref/index.php) for property/value definitions.

* * *

## The cascade and inheritance

*   Later rules override earlier ones when specificity is equal.
*   Inline styles override internal/external styles.
*   Some properties inherit from parent elements (e.g., `color`, `font-family`).
*   Use `!important` only as a last resort.

**Note:** Specificity is a scoring system: IDs are stronger than classes, and classes are stronger than element names.

More details: [CSS How To](https://www.w3schools.com/css/css_howto.asp), [CSS Specificity](https://www.w3schools.com/css/css_specificity.asp).

* * *

## Working with color

Specify colors via keywords, hex, RGB, or HSL.

```javascript
.hero { background: #04AA6D; }
.card { background: rgb(255, 255, 255); }
.highlight { background: hsl(205, 90%, 60%); }
```

**Note:** Hex values start with `#`, `rgb()` uses red/green/blue numbers, and `hsl()` uses hue, saturation, and lightness.

Explore: [CSS Colors](https://www.w3schools.com/css/css_colors.asp).

* * *

## Typography basics

*   Fonts: `font-family`.
*   Size: `font-size` (px, rem, em).
*   Weight: `font-weight` (400 = normal, 700 = bold).
*   Line height, letter spacing, text alignment.

**Note:** Pixels are fixed dots, `rem` sizes relative to the root font size, and `em` sizes relative to the parent element.

If you want to read more or get an in-depth understanding, see [CSS Fonts](https://www.w3schools.com/css/css_font.asp) and [CSS Text](https://www.w3schools.com/css/css_text.asp) in the CSS tutorial.

* * *

## Spacing essentials

Use `margin` (outside) and `padding` (inside) to control space, along with `border`.

**Note:** Margins push elements away from neighbors; padding creates space between the border and the content inside.

```javascript
.card {
  margin-bottom: 24px;
  padding: 24px;
  border-radius: 12px;
}
```

Learn more in the upcoming Box Model chapter.

* * *

## Display and layout

The `display` property determines how elements flow.

*   `block`, `inline`, `inline-block` foundations.
*   `flex` and `grid` for modern layouts (covered later).

**Note:** Block elements take the full row, inline elements sit inside text, and inline-block combines both behaviors.

If you want to read more about Display & Visibility or get an in-depth understanding, go to [Display & Visibility](https://www.w3schools.com/css/css_display_visibility.asp) in the CSS tutorial.

* * *

## Try it Yourself

Experiment with the example below to see how different css properties affect layout.

```javascript
<!DOCTYPE html>
<html>
<head>
<link rel="stylesheet" href="styles.css" type="text/css">
</head>
<body>
  <header>
    <h1>Styling Essentials</h1>
    <p>CSS transforms HTML into beautiful interfaces.</p>
  </header>
  <main>
    <article class="card">
      <h2>Typography</h2>
      <p>Adjust fonts, weights, and spacing.</p>
    </article>
    <article class="card">
      <h2>Colors</h2>
      <p>Create consistent palettes with hex or HSL.</p>
    </article>
  </main>
</body>
</html>
```

* * *

* * *