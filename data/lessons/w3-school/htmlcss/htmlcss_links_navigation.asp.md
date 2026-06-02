# HTML and CSS Links & Navigation

* * *

## HTML & CSS: Links & Navigation

Links connect your site together.

Combine semantic navigation markup with CSS to create clear, accessible menus.

* * *

## Basic links

Create hyperlinks with the `<a>` tag and the `href` attribute.

```javascript
<a href="about.html">About us</a>
```

This anchor uses the `href` attribute to define the destination.

For external links, include `target="_blank"` and `rel="noopener noreferrer"`.

If you want to read more about HTML Links or get an in-depth understanding, go to [HTML Links](https://www.w3schools.com/html/html_links.asp) in the HTML tutorial.

**Note:** `target="_blank"` opens the link in a new tab. Use `rel="noopener noreferrer"` to prevent the new page from controlling your site and to avoid sending the referrer.

* * *

## Link attributes

*   `href` - destination URL.
*   `target` - where to open (`_self`, `_blank`).
*   `title` - optional tooltip.
*   `download` - download the linked file.

**In other words:** An absolute URL starts with `https://` and points anywhere on the web. A relative URL points to another file in the same project (like `about.html`).

```javascript
<a href="files/guide.pdf" download>Download the guide</a>
```

If you want to read more or get an in-depth understanding, see [Bookmarks](https://www.w3schools.com/html/html_links_bookmarks.asp) and [Link Colors](https://www.w3schools.com/html/html_links_colors.asp) in the HTML tutorial.

* * *

* * *

## Navigation menus

Wrap site navigation in a `<nav>` element.

Use lists for grouping links.

**Note:** The `aria-label` attribute gives screen readers a short description of the menu, such as "Primary navigation".

```javascript
<nav class="site-nav" aria-label="Primary">
  <ul>
    <li><a href="index.html" class="active">Home</a></li>
    <li><a href="services.html">Services</a></li>
    <li><a href="contact.html">Contact</a></li>
  </ul>
</nav>
```

This markup wraps the list of links in a semantic `<nav>` with an `aria-label` to describe its purpose to assistive technologies.

Learn more: [Links](https://www.w3schools.com/html/html_links.asp), [Semantic Elements](https://www.w3schools.com/html/html5_semantic_elements.asp).

* * *

## Styling navigation with CSS

```javascript
.site-nav ul {
  display:flex; 
  gap:16px; 
  list-style:none; 
  padding:0; 
  margin:0;
}
.site-nav a {
  display:block; 
  padding:12px 20px; 
  border-radius:999px; 
  text-decoration:none; 
  color:#0f172a; 
  font-weight:600;
}
.site-nav a:hover, .site-nav a.active {
  background:#04AA6D; 
  color:#fff;
}
```

The CSS uses flexbox to space items and applies hover/active styles for feedback and clarity.

Explore more designs: [CSS Navbar](https://www.w3schools.com/css/css_navbar.asp), [Horizontal Navbar](https://www.w3schools.com/css/css_navbar_horizontal.asp), [Vertical Navbar](https://www.w3schools.com/css/css_navbar_vertical.asp).

* * *

## Button-style links

Apply `display: inline-block`, padding, and background colors to make links look like buttons.

* * *

## Skip links for accessibility

Give keyboard users a quick path to main content.

```javascript
<a class="skip-link" href="#main">Skip to content</a>
```

The skip link is visually hidden until focused; then it becomes visible so keyboard users can jump directly to `#main`.

If you want to read more about CSS Accessibility or get an in-depth understanding, go to [CSS Accessibility](https://www.w3schools.com/css/css_accessibility.asp) in the CSS tutorial.

* * *

## Active states and transitions

*   Add `.active` class to represent the current page.
*   Use `:hover`, `:focus`, `:focus-visible` for better keyboard accessibility.
*   Apply `transition` for smooth color changes.

* * *

## Responsive menus

On mobile, convert horizontal menus into vertical stacks or hamburger navigation.

**Note:** A hamburger menu is the three-line button that expands to show links on small screens.

*   Use media queries to switch `flex-direction` to column.
*   Hide/show navigation with a menu button and JavaScript for more complex patterns.
*   See [CSS Responsive Flexbox](https://www.w3schools.com/css/css3_flexbox_responsive.asp) examples.

* * *

## Accessible navigation demo

This demo presents a simple site navigation and content area using semantic tags and accessible focus styles.

Syntax highlights: flex-based menu layout, hover/focus feedback, and an active link state.

```javascript
<!DOCTYPE html>
<html>
<head>
<link rel="stylesheet" href="styles.css" type="text/css">
</head>
<body>
  <nav aria-label="Primary navigation">
    <ul>
      <li><a href="#" class="active">Home</a></li>
      <li><a href="#">Docs</a></li>
      <li><a href="#">Blog</a></li>
      <li><a href="#">Contact</a></li>
    </ul>
  </nav>
  <main>
    <h1>Accessible Navigation</h1>
    <p>This menu uses semantic tags, keyboard focus states, and flexbox for layout.</p>
  </main>
</body>
</html>
```

The nav bar uses spacing and color contrast for readability, while the content region centers text and provides breathing room.

* * *

* * *