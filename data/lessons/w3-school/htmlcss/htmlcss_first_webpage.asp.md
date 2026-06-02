# HTML and CSS First Web Page

* * *

## HTML & CSS: First Web Page

Let's build our first web page that combines HTML structure with CSS styling.

Follow these steps and you will have a working homepage in minutes.

* * *

## Step 1: Create `index.html`

Open your editor and paste the HTML skeleton below.

This structure matches what we cover in [HTML Basic](https://www.w3schools.com/html/html_basic.asp) but also includes placeholders to style.

```javascript
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>My First Website</title>
  <link rel="stylesheet" href="css/styles.css" type="text/css">
</head>
<body>
  <header>
    <h1>Hello, world!</h1>
    <p>This site is built with HTML and CSS.</p>
  </header>
  <main>
    <section>
      <h2>About Me</h2>
      <p>I am learning how to code websites from scratch.</p>
    </section>
    <section>
      <h2>Projects</h2>
      <ul>
        <li>Portfolio landing page</li>
        <li>Product showcase</li>
        <li>Responsive blog layout</li>
      </ul>
    </section>
  </main>
  <footer>
    <p>Built with ❤️ using HTML & CSS.</p>
  </footer>
</body>
</html>
```

This skeleton includes the doctype, language attribute, essential meta tags, a page title, and a stylesheet link where you will connect your CSS.

Save this file as `index.html` in your project folder.

* * *

## Step 2: Create `css/styles.css`

Next, add a stylesheet that controls colors, spacing, and typography.

Place the file in a `css` folder.

```javascript
* {
  box-sizing: border-box;
}
body {
  font-family: "Segoe UI", Roboto, sans-serif;
  margin: 0;
  background: #f4f7fb;
  color: #253238;
}
header {
  background: linear-gradient(120deg, #04AA6D, #058457);
  color: #fff;
  padding: 60px 20px;
  text-align: center;
}
main {
  max-width: 960px;
  margin: 0 auto;
  padding: 40px 20px;
}
section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08);
}
section h2 {
  margin-top: 0;
  color: #04AA6D;
}
footer {
  padding: 24px;
  text-align: center;
  background: #e8edf4;
  font-size: 0.9rem;
}
```

These rules set base typography and colors, style the header with a gradient, and give sections padding, rounded corners, and a soft shadow.

**Note:** The rule `linear-gradient` creates a smooth color blend, and `box-shadow` adds a soft shadow under each section.

Save the CSS file.

Your directory now looks like:

htmlcss-course/
  index.html
  css/
    styles.css

* * *

* * *

## Step 3: Open in a browser

1.  Double-click `index.html` to open it in your default browser.
2.  If the layout looks plain, confirm the `link` tag points to `css/styles.css` and that the file path exists.
3.  Use **Reload** after every change; keep DevTools open to inspect styles.

* * *

## Experiment

*   Change the gradient colors in `header` and refresh.
*   Add another section to practice working with HTML structure.
*   Swap fonts by using a Google Fonts embed in the `<head>`.

* * *

## Mini homepage demo

This demo combines the HTML skeleton with basic CSS to render a small one-section homepage.

Syntax highlights: an external stylesheet via `<link>`, semantic tags (`<header>`, `<main>`, `<section>`), and simple spacing utilities.

```javascript
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>My First Website</title>
  <link rel="stylesheet" href="css/styles.css" type="text/css">
</head>
<body>
  <header>
    <h1>Hello, world!</h1>
    <p>This site is built with HTML and CSS.</p>
  </header>
  <main>
    <section>
      <h2>About Me</h2>
      <p>I am learning how to code websites from scratch.</p>
    </section>
    <section>
      <h2>Projects</h2>
      <ul>
        <li>Portfolio landing page</li>
        <li>Product showcase</li>
        <li>Responsive blog layout</li>
      </ul>
    </section>
  </main>
  <footer>
    <p>Built with ❤️ using HTML & CSS.</p>
  </footer>
</body>
</html>
```

The CSS centers the main column, applies spacing and rounded corners to the section, and colors the header for a clear visual hierarchy.

**Tip:** After experimenting in the Try it editor, copy your favorite changes back to your local files.

* * *

* * *