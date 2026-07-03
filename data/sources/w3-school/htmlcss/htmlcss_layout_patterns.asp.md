# HTML and CSS Layout Patterns

* * *

## HTML & CSS: Layout Patterns

Combine Flexbox, Grid, and modern CSS features to build reusable page layouts-hero sections, split panels, dashboards, and marketing pages-without resorting to brittle floats.

* * *

## Hero with split emphasis

Pair messaging with media using a two-column grid that collapses on smaller screens.

**Note:** Collapsing means the columns stack vertically when the screen is narrow.

```javascript
<!DOCTYPE html>
<html>
<head>
<link rel="stylesheet" href="styles.css" type="text/css">
</head>
<body>
  <section class="hero">
    <div>
      <h1>Build accessible interfaces faster</h1>
      <p>Create design systems that delight users and empower teams.</p>
      <a class="cta" href="#" style="display:inline-block;padding:12px 24px;border-radius:999px;background:#fff;color:#0f172a;font-weight:600;text-decoration:none;">Start prototyping</a>
    </div>
    <figure>
      <img src="images/dashboard.png" alt="Dashboard preview" style="width:100%;border-radius:20px;">
    </figure>
  </section>
</body>
</html>
```

This pattern uses a responsive two-column grid that stacks on small screens via `auto-fit` and `minmax()`, keeping text and media legible.

* * *

## Split panel layout

Use Flexbox or Grid to balance navigation and content for application shells.

**Note:** An application shell is the basic frame of the app-sidebar, header, and main area without page-specific data.

```javascript
.layout-shell {
  display: grid;
  min-height: 100vh;
  grid-template-columns: 280px 1fr;
}
.layout-shell nav {
  background: #0f172a;
  color: #fff;
  padding: 32px;
}
.layout-shell main {
  padding: 48px clamp(32px, 6vw, 96px);
  background: #f8fafc;
}
@media (max-width: 960px) {
  .layout-shell {
    grid-template-columns: 1fr;
  }
  .layout-shell nav {
    position: sticky;
    top: 0;
  }
}
```

The app shell sets two grid columns for desktop and collapses to one on mobile; the sidebar becomes sticky so navigation remains in view.

* * *

* * *

## Dashboard cards

Create responsive card grids that adapt gracefully from desktop to mobile.

**Note:** Responsive cards rearrange automatically so each card stays readable on phones and tablets.

*   Use `grid-auto-fit` with `minmax()` to fluidly adjust column count.
*   Add `grid-template-areas` for highlighted cards spanning multiple columns.
*   Combine `clamp()` for adaptive padding and typography.

* * *

## Marketing content blocks

Alternate text and imagery using a reusable flip class or `nth-child` selectors.

**Note:** A flip class is just an extra CSS class that reverses the order of elements when needed.

*   Wrap sections in a grid with two columns.
*   Flip order via `order` (Flexbox) or `grid-template-areas`.
*   Stack vertically under a mobile breakpoint.

* * *

## Footer patterns

Combine CSS Grid for multi-column link groups and Flexbox for legal copy alignment.

**Note:** Legal copy usually means the small copyright line at the bottom; Flexbox helps keep it aligned.

*   Use `grid-template-columns: repeat(auto-fit, minmax(160px, 1fr))` for link clusters.
*   Place social icons with Flexbox; add `gap` for spacing.
*   Respect contrast and accessible focus outlines.

* * *

* * *