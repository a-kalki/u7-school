# HTML and CSS Text Content

* * *

## HTML & CSS: Text Content

Headings, paragraphs, emphasis, and inline semantics give structure and meaning to your text.

CSS typography rules bring the words to life.

* * *

## Headings establish hierarchy

Use one `<h1>` per page, followed by `<h2>`, `<h3>`, etc.

This improves accessibility and SEO.

**Note:** Accessibility means assistive technologies can understand the page, and SEO (search engine optimization) helps your site appear in search results.

```javascript
<h1>Welcome to Campfire</h1>
<h2>Latest Updates</h2>
<h3>Release 2.0</h3>
```

If you want to read more about headings or get an in-depth understanding, go to our [Headings](https://www.w3schools.com/html/html_headings.asp) in the HTML tutorial.

* * *

## Paragraphs and line breaks

*   `<p>` wraps paragraphs of text.
*   `<br>` inserts a line break (use sparingly).
*   `<hr>` draws thematic breaks between topics.

If you want to read more about paragraphs or get an in-depth understanding, go to our [Paragraphs](https://www.w3schools.com/html/html_paragraphs.asp) in the HTML tutorial.

* * *

* * *

## Inline emphasis and semantics

*   `<strong>` - strong importance, typically bold.
*   `<em>` - emphasized text, typically italic.
*   `<mark>` - highlight; `<code>` - monospace code snippet.
*   `<abbr>`, `<cite>`, `<time>` add meaning for readers and crawlers.

If you want to read more about text semantics or get an in-depth understanding, see [Formatting](https://www.w3schools.com/html/html_formatting.asp) and [Quotation elements](https://www.w3schools.com/html/html_quotation_elements.asp) in the HTML tutorial.

* * *

## Control typography with CSS

Combine semantic markup with font families, weights, and spacing.

```javascript
<article class="story">
  <h1>A Future with HTML & CSS</h1>
  <p class="lead">Learn once, build everywhere.</p>
  <p>We explore accessible patterns, responsive layouts, and component libraries.</p>
</article>
```

If you want to read more about typography or get an in-depth understanding, see [Fonts](https://www.w3schools.com/css/css_font.asp), [Font Size](https://www.w3schools.com/css/css_font_size.asp), and [Text](https://www.w3schools.com/css/css_text.asp) in the CSS tutorial.

* * *

## Whitespace and rhythm

Use CSS `line-height`, `margin`, and `letter-spacing` to improve readability.

Maintain consistent spacing scale (4px, 8px, etc.).

**Note:** A spacing scale is a simple list of numbers you reuse (for example 4, 8, 12) so gaps feel balanced.

```javascript
<!DOCTYPE html>
<html>
<head>
<title>Typography Sample</title>
<link rel="stylesheet" href="styles.css" type="text/css">
</head>
<body>
  <h1>Designing with type</h1>
  <p>Great interfaces balance hierarchy, rhythm, and contrast.</p>
  <p>Use <mark>semantic tags</mark> to describe meaning, then layer styles.</p>
</body>
</html>
```

* * *

* * *