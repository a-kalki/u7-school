# HTML and CSS Cascade & Inheritance

* * *

## HTML & CSS: Cascade & Inheritance

When several rules target the same element, the CSS cascade decides which one applies.

Inheritance flows styles down the DOM tree.

Understanding both keeps your styles predictable.

* * *

## The cascade

The cascade evaluates styles in three stages:

1.  **Importance:** origin (browser, user, author) and `!important`.
2.  **Specificity:** selector weight.
3.  **Source order:** later rules win when specificity ties.

**Note:** Think of this as a contest: first the browser checks how important the rule is, then how specific the selector is, and finally which rule appears last.

If you want to read more or get an in-depth understanding, see [How To Add CSS](https://www.w3schools.com/css/css_howto.asp) and [Specificity](https://www.w3schools.com/css/css_specificity.asp) in the CSS tutorial.

* * *

## Inheritance

Some properties (color, font, line-height) automatically inherit from their parent elements.

Others (margin, padding, border) do not.

*   Use `inherit` to force inheritance.
*   Use `initial` to reset to the default.
*   Use `revert` to roll back to the user agent style.

**Note:** Inheritance saves time: children copy certain styles from their parent unless you override them.

If you want to read more about CSS Inheritance or get an in-depth understanding, go to [CSS Inheritance](https://www.w3schools.com/css/css_inheritance.asp) in the CSS tutorial.

* * *

* * *

## Specificity refresher

Specificity is counted as (inline, IDs, classes/attributes/pseudo-classes, elements/pseudo-elements).

Higher numbers win.

**Note:** You can read scores like (0,1,0,0).

The first number is inline styles, the second is IDs, the third is classes, and the last is element names.

```javascript
/* Score: (0,1,0,0) */
#hero { background:#0ea5e9; }

/* Score: (0,0,2,0) */
.card.highlight { background:#f0f9ff; }

/* Score: (0,0,1,1) */
section.card { background:#fff; }
```

The ID selector's specificity score (0,1,0,0) beats class combinations (0,0,2,0) and element+class (0,0,1,1), so the `#hero` rule applies.

* * *

## Source order demo

If specificity is equal, the browser uses the last declaration.

```javascript
.card { border:2px solid #94a3b8; }
.card { border:2px solid #2563eb; }
```

* * *

## The `!important` flag

*   Overrides normal cascade, but should be rare.
*   Use it to break out of third-party styles or debug, then remove.
*   Try refactoring selectors or ordering rules instead.

* * *

## Debugging conflicts

*   Open DevTools ➜ Elements ➜ Styles to view applied rules and their origins.
*   Toggle rules on/off to check cascade effects.
*   Consider using CSS layers (`@layer`) in large codebases to control priority.

If you want to read more or get an in-depth understanding, see [Specificity](https://www.w3schools.com/css/css_specificity.asp) and [Browser Support](https://www.w3schools.com/css/css3_browsers.asp) in the CSS tutorial.

* * *

## Cascade demo: last rule wins

This demo combines semantic HTML with layered CSS rules to show how the cascade resolves conflicts.

Syntax highlights: custom properties for a brand color, plus two matching selectors where the later rule overrides the earlier one.

```javascript
<!DOCTYPE html>
<html>
<head>
<link rel="stylesheet" href="styles.css" type="text/css">
</head>
<body>
  <article class="card feature">
    <h2>Cascade in action</h2>
    <p>The dashed border appears because the last matching rule wins.</p>
  </article>
</body>
</html>
```

The dashed orange border appears because the final matching rule wins when specificity ties, even if earlier rules set colors or variables.

* * *

* * *