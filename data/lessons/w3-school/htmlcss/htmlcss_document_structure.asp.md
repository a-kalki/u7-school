# HTML and CSS Document Structure

* * *

## HTML & CSS: Document Structure

Understand how an HTML document is organized, how the `<head>` and `<body>` interact, and where CSS fits into the structure.

* * *

## HTML Boilerplate

Every page starts with:

1.  the `!DOCTYPE`
2.  `<html>` element
3.  metadata in the `<head>`
4.  visible content in the `<body>`

**Note:** Doctype tells the browser to use modern standards, metadata is information about the page, and the body holds what people see.

A boilerplate is a template that you can copy and paste to save time.

Here is a boilerplate for an HTML page:

```javascript
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Document Title</title>
</head>
<body>
  <header>...</header>
  <main>...</main>
  <footer>...</footer>
</body>
</html>
```

If you want to read more or get an in-depth understanding, see [HTML Basic](https://www.w3schools.com/html/html_basic.asp) and [HTML Head](https://www.w3schools.com/html/html_head.asp) in the HTML tutorial.

* * *

## Head metadata

*   `<meta charset="UTF-8">` ensures proper character rendering.
*   `<meta name="viewport">` makes layouts responsive.
*   `<link rel="_stylesheet_">` attaches external CSS.
*   `<script>` tags typically load at the end of `<body>` to avoid blocking rendering.
*   Use `<title>` for the browser tab and SEO, plus `<meta name="description">` for search snippets.

* * *

* * *

## Layout containers

Use semantic wrappers to provide meaning:

*   `<header>` - branding or navigation at the top.
*   `<nav>` - primary site navigation links.
*   `<main>` - unique content for the page (one per page).
*   `<section>`, `<article>`, `<aside>` - subsections with their own headings.
*   `<footer>` - closing information, links, copyright.

If you want to read more or get an in-depth understanding, see [HTML Layout](https://www.w3schools.com/html/html_layout.asp) and [HTML Semantic Elements](https://www.w3schools.com/html/html5_semantic_elements.asp) in the HTML tutorial.

* * *

## Organizing CSS

Link your CSS file in the head so styles load before the page renders.

For critical CSS, you can inline minimal styles directly, but prefer external files for maintainability.

**Note:** "Critical CSS" means tiny pieces of CSS that must load immediately to avoid flashes of unstyled content.

```javascript
<link rel="preconnect" href="https://fonts.gstatic.com">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/styles.css">
```

These tags optimize performance by preconnecting to the font host, loading a web font stylesheet, and linking your main CSS file.

Preconnecting to the font host and loading a web font stylesheet is important because without it, the browser has to wait for the font to load before rendering the page.

* * *

## Accessibility hooks

*   Add `lang` on `<html>` for screen readers.
*   Ensure each `<section>` has a heading; otherwise use `aria-label`.
*   Keep heading levels in order (h1 → h2 → h3) to describe hierarchy.

If you want to read more about HTML Accessibility or get an in-depth understanding, go to [HTML Accessibility](https://www.w3schools.com/html/html_accessibility.asp) in the HTML tutorial.

* * *

## Semantic layout demo

This demo shows a complete page shell with header, nav, main sections, and footer using semantic HTML, paired with basic page styles.

Syntax highlights: metadata in the head, semantic containers in the body, and an external stylesheet linked via `<link rel="stylesheet">`.

```javascript
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Structured Page</title>
  <link rel="stylesheet" href="styles.css" type="text/css">
</head>
<body>
  <header>
    <h1>Sky Labs</h1>
    <nav>
      <a href="#services">Services</a>
      <a href="#team">Team</a>
      <a href="#contact">Contact</a>
    </nav>
  </header>
  <main>
    <section id="services">
      <h2>Services</h2>
      <p>We craft responsive websites and design systems.</p>
    </section>
    <section id="team">
      <h2>Team</h2>
      <p>Meet the engineers and designers who make it happen.</p>
    </section>
  </main>
  <footer>
    <p>&copy; 2025 Sky Labs. Built with HTML & CSS.</p>
  </footer>
</body>
</html>
```

The CSS sets consistent spacing, colors the header/footer, and constrains the content width for readability while each section remains clearly labeled.

* * *

## Checklist

*   Document has a valid doctype and language attribute.
*   Head contains viewport, charset, title, and stylesheet links.
*   Body uses semantic wrappers with meaningful headings.
*   CSS is external (unless purposefully inlined).

* * *

* * *