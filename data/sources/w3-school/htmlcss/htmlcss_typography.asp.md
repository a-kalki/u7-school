# HTML and CSS Typography

* * *

## HTML & CSS: Typography

Typography shapes the voice of your interface.

Combine semantic HTML with CSS font, size, weight, and spacing utilities to craft clear, readable content.

* * *

## Choosing fonts

*   Use system fonts for performance or host web fonts via services like Google Fonts.
*   Set a base font on `body` and use fallbacks: `font-family: "Inter", "Segoe UI", sans-serif;`
*   Limit the number of font families to keep the design cohesive.

**Note:** A fallback is a backup font used if the first choice is unavailable.

If you want to read more or get an in-depth understanding, see [CSS Fonts](https://www.w3schools.com/css/css_font.asp) and [Google Fonts](https://www.w3schools.com/css/css_font_google.asp) in the CSS tutorial.

* * *

## Scaling type

Use relative units (`rem`, `em`) so text responds to user preferences.

**Note:** `rem` scales from the root font size, while `em` scales from the parent element.

```javascript
:root {
  font-size: 100%; /* 16px default */
}
body {
  font-size: 1rem; /* 16px */
}
h1 { font-size: clamp(2.5rem, 5vw, 3.5rem); }
h2 { font-size: 2rem; }
p  { font-size: 1.125rem; }
```

This scale sets base size on `body` and uses `clamp()` for headings so text adapts smoothly across viewports.

Learn more: [CSS Font Size](https://www.w3schools.com/css/css_font_size.asp).

* * *

* * *

## Font weight and style

*   `font-weight: 400;` normal, `700;` bold, `500` medium.
*   `font-style: italic;` applies emphasis.

**Note:** Weights are numeric: the higher the number, the thicker the text.

If you want to read more or get an in-depth understanding, see [Font Weight](https://www.w3schools.com/css/css_font_weight.asp) and [Font Style](https://www.w3schools.com/css/css_font_style.asp) in the CSS tutorial.

* * *

## Line height and spacing

Set `line-height` between 1.5 and 1.8 for paragraphs.

Use `letter-spacing` sparingly for uppercase text.

**Note:** `line-height` adds vertical space between lines, and `letter-spacing` adjusts the gap between characters.

* * *

## Text alignment and decoration

*   `text-align` for horizontal alignment.
*   `text-transform` for uppercase/lowercase.
*   `text-decoration` for underlines; customize color and thickness.

If you want to read more or get an in-depth understanding, see [CSS Text](https://www.w3schools.com/css/css_text.asp) and [Text Decoration](https://www.w3schools.com/css/css_text_decoration.asp) in the CSS tutorial.

* * *

## Responsive typography

Use clamp() and media queries to adjust font sizes on different screens.

```javascript
.hero h1 { font-size: clamp(2.75rem, 8vw, 4rem); }
.hero p  { font-size: clamp(1.125rem, 3vw, 1.5rem); }
```

* * *

## Global typography reset

Normalize defaults by setting base styles on `body`, `h1-h6`, `p`, and `a`.

```javascript
body { font-family:"Source Sans Pro",sans-serif; color:#0f172a; margin:0; }
h1, h2, h3 { line-height:1.2; margin:0 0 0.75em; }
p { margin:0 0 1.5em; }
a { color:#2563eb; text-decoration:none; }
a:hover { text-decoration:underline; }
```

* * *

## Accessible text

*   Ensure contrast ratios meet WCAG AA (4.5:1 for body text).
*   Do not lock users to absolute font sizes; respect browser zoom.
*   Use semantic tags (`<strong>`, `<em>`) for meaning.

If you want to read more about CSS Accessibility or get an in-depth understanding, go to [CSS Accessibility](https://www.w3schools.com/css/css_accessibility.asp) in the CSS tutorial.

* * *

## Article typography demo

This example shows a short article layout with a subtitle, headline, and body copy.

It pairs a responsive type scale with comfortable line height.

Syntax highlights: `clamp()` for fluid headings, and a styled `blockquote` using a left border.

```javascript
<!DOCTYPE html>
<html>
<head>
<link rel="stylesheet" href="styles.css" type="text/css">
</head>
<body>
  <main>
    <p class="subtitle">Typography foundations</p>
    <h1>Readable, scalable, delightful</h1>
    <p>Establish a type scale, use semantic headings, and adjust spacing for clarity.</p>
    <blockquote>"Typography is the craft of endowing human language with a durable visual form." - Robert Bringhurst</blockquote>
  </main>
</body>
</html>
```

The CSS centers the content column, applies larger leading for paragraphs, and visually emphasizes the quote with a colored border and italics.

* * *

* * *