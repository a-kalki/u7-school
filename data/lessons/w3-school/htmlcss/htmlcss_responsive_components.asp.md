# HTML and CSS Responsive Components

* * *

## HTML & CSS: Responsive Components

Turn design patterns into resilient components that adapt to any viewport.

Combine fluid units, Flexbox/Grid, and interaction states to deliver accessible, responsive UI building blocks.

* * *

## Responsive navigation

*   Use Flexbox for desktop horizontal menus and collapse to a vertical drawer on mobile.
*   Control visibility with `display` utilities or `@media` toggles.
*   Preserve keyboard and screen reader support when revealing hidden navs.

**Note:** A vertical drawer is the slide-out menu you often see behind a hamburger button on phones.

```javascript
<!DOCTYPE html>
<html>
<head>
<link rel="stylesheet" href="styles.css" type="text/css">
<script>
function toggleNav() {
  const list = document.querySelector('.nav-links');
  const expanded = list.getAttribute('data-open') === 'true';
  list.setAttribute('data-open', !expanded);
  const button = document.querySelector('.nav-toggle');
  if (button) {
    button.setAttribute('aria-expanded', String(!expanded));
  }
}
</script>
</head>
<body>
  <nav class="navbar">
    <span>Product Studio</span>
    <button class="nav-toggle" aria-expanded="false" onclick="toggleNav()">☰</button>
    <ul class="nav-links" data-open="false">
      <li><a href="#" style="color:#fff;text-decoration:none;">Docs</a></li>
      <li><a href="#" style="color:#fff;text-decoration:none;">Components</a></li>
      <li><a href="#" style="color:#fff;text-decoration:none;">Pricing</a></li>
      <li><a href="#" style="color:#fff;text-decoration:none;">Support</a></li>
    </ul>
  </nav>
</body>
</html>
```

* * *

## Responsive cards

*   Stack cards vertically on mobile, then use Flexbox/Grid for multi-column layouts.
*   Keep content hierarchy consistent: image ➜ heading ➜ text ➜ CTA.
*   Use `minmax()` and `auto-fit` for fluid card grids.

**Note:** CTA means call to action, usually a button or link that prompts the next step.

* * *

* * *

## Data tables

*   Hide nonessential columns or transform tables into card stacks using `display: block;` at narrow widths.
*   Provide alternative views (e.g., accordions) for small screens.
*   Ensure keyboard navigation and semantics remain intact.

**Note:** When you turn rows into cards, keep headers visible so users still understand each data point.

* * *

## Forms

*   Use responsive grids to align labels and inputs on desktop while stacking on mobile.
*   Preserve accessible label connections via `for`/`id`.
*   Allow buttons and inputs to grow to full width on narrow viewports.

**Note:** Full-width inputs make it easier for people to tap fields on touch screens.

* * *

## Micro-interactions

*   Ensure hover-only behaviors also respond to focus and touch.
*   Use CSS transitions and transforms that respect reduced-motion preferences.
*   Test tap targets; provide at least 44px height/width.

**Note:** Reduced-motion preferences come from the operating system; respect them to avoid motion sickness.

* * *

* * *