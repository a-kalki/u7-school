# HTML and CSS Custom Properties (CSS Variables)

* * *

## HTML & CSS: Custom Properties (CSS Variables)

CSS custom properties, commonly called variables, let you centralize design tokens like colors, spacing, and typography.

They enable dynamic theming and reduce duplication across components.

* * *

## Declaring variables

*   Use the `:root` selector to define global tokens.
*   Variables are written as `--token-name` and accessed with `var(--token-name)`.
*   Custom properties inherit, so redefine them on containers to theme subsections.

**Note:** `:root` targets the whole document, so variables defined there are available everywhere.

If you want to read more about CSS Custom Properties or get an in-depth understanding, go to [CSS Custom Properties](https://www.w3schools.com/css/css3_property.asp) in our CSS tutorial.

* * *

## Example: Design Tokens

```javascript
:root {
  --color-brand: #2563eb;
  --color-brand-contrast: #eef2ff;
  --font-base: "Inter", system-ui, sans-serif;
  --space-md: clamp(1rem, 2vw, 1.625rem);
}
main {
  font-family: var(--font-base);
  padding: var(--space-md);
  background: var(--color-brand-contrast);
}
.btn-primary {
  background: var(--color-brand);
  color: #fff;
  padding: 0.75rem 1.5rem;
  border-radius: 999px;
}
```

Changing a token once updates every place it is used with `var(--token)`, making themes and global tweaks easy.

* * *

* * *

## Dynamic theming

*   Switch themes by toggling class names on `<html>` or `<body>`.
*   Media queries can update variables for prefers-color-scheme.
*   JavaScript can read and update custom properties at runtime.

**Note:** Because variables are live, changing them once automatically updates every place they are used.

```javascript
<!DOCTYPE html>
<html>
<head>
<link rel="stylesheet" href="styles.css" type="text/css">
<script>
const toggleTheme = () => {
  const root = document.documentElement;
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = next;
};
</script>
</head>
<body>
  <button onclick="toggleTheme()">Toggle theme</button>
</body>
</html>
```

* * *

## Scoping tokens

*   Create component-specific tokens under a wrapper class to avoid global overrides.
*   Use fallback values with `var(--token, fallback)` to guard against missing definitions.
*   Combine with `@layer` or style modules for maintainable design systems.

**Note:** Fallbacks act like default values; they are used if the variable has not been set.

* * *

## Runtime calculations

Variables work inside `calc()`, `clamp()`, gradients, and even media queries (where supported).

*   `padding: calc(var(--space-md) * 1.5);`
*   `background: linear-gradient(var(--angle, 45deg), ...);`
*   Feature detect with `@supports (--custom: property)`.

* * *

* * *