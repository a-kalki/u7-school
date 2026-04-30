# HTML and CSS Reusable Components

* * *

## HTML & CSS: Reusable Components

Components are reusable chunks of markup and styles-cards, buttons, banners-that keep your design consistent and speed up development.

**Note:** Think of a component as a mini layout you can copy and reuse across many pages.

* * *

## Component philosophy

*   Create HTML structures with meaningful class names (e.g., `.card`, `.cta-button`).
*   Scope styles to the component to avoid unintended side effects.
*   Document usage, variations, and accessibility considerations.

**Note:** Scoped styles mean the CSS only affects that component, so other parts of the page stay untouched.

* * *

## Buttons

Buttons are links or controls styled with reusable classes.

Use a base `.btn` and add variants like `.btn-primary` or `.btn-ghost` for different emphasis.

```javascript
<a href="#" class="btn btn-primary">Primary</a>
<a href="#" class="btn btn-ghost">Ghost</a>
```

The base class handles padding, rounded corners, and transitions.

Variants change colors and hover styles without altering markup.

If you want to read more about CSS Buttons or get an in-depth understanding, go to [CSS Buttons](https://www.w3schools.com/css/css3_buttons.asp) in the CSS tutorial.

* * *

* * *

## Card component

Cards group related content with an image, heading, text, and a call-to-action.

Structure markup with semantic tags and utility classes.

```javascript
<article class="card">
  <img src="images/dashboard.png" alt="Dashboard preview" loading="lazy">
  <div class="card-body">
    <h3>Analytics</h3>
    <p>Track performance with real-time dashboards.</p>
    <a href="#" class="btn btn-primary">View Demo</a>
  </div>
</article>
```

The CSS rounds corners, adds a subtle shadow, and spaces the body content for readability.

Images scale responsively to the card width.

Source inspiration: [CSS Cards](https://www.w3schools.com/howto/howto_css_cards.asp).

* * *

## Alert/notification

Alerts surface inline feedback.

Pair a base `.alert` with status modifiers like `.alert-success` for color and borders.

```javascript
<div class="alert alert-success" role="status">
  <strong>Success:</strong> Profile updated!
</div>
```

The status modifier sets background and border to convey meaning.

Use ARIA roles like `role="status"` where appropriate.

Consider ARIA roles for accessibility.

* * *

## Navigation component

Combine patterns you learned in the navigation chapter with button styling for call-to-action links.

* * *

## Component variations

*   Use modifier classes (BEM naming) like `.card--compact` for variations.
*   Store component styles in separate files (`components/card.css`, `components/button.css`).
*   Create documentation pages or a living style guide for your team.

If you want to read more or get an in-depth understanding, see [CSS Templates](https://www.w3schools.com/css/css_templates.asp) and [CSS Snippets](https://www.w3schools.com/css/css_snippets.asp) in the CSS tutorial.

* * *

## Accessibility tips

*   Ensure focus styles are visible on interactive components.
*   Use appropriate ARIA attributes where necessary (`role="alert"`, `aria-live`).
*   Provide sufficient color contrast and larger hit targets.

Review [CSS Accessibility](https://www.w3schools.com/css/css_accessibility.asp).

* * *

## Component gallery demo

This demo renders a small gallery of components-button, alert, and card-so you can experiment with styles in one place.

Syntax highlights: composable classes (`.btn` variants), semantic alert roles, and a simple content card with spacing tokens.

```javascript
<!DOCTYPE html>
<html>
<head>
<link rel="stylesheet" href="styles.css" type="text/css">
</head>
<body>
  <a href="#" class="btn btn-primary">Primary button</a>
  <div class="alert alert-info" role="status">Heads up! New updates available.</div>
  <article class="card">
    <h2>Reusable Components</h2>
    <p>Bundle markup and styles into composable building blocks.</p>
  </article>
</body>
</html>
```

The gallery page uses spacing and shadows to separate components and demonstrates how base classes plus modifiers create consistent, reusable UI.

* * *

* * *