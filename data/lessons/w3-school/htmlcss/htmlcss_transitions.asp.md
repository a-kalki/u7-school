# HTML and CSS Transitions

* * *

## Transitions

CSS transitions animate changes to CSS properties, creating smooth hover states, focus styles, and UI feedback without JavaScript.

* * *

## Core properties

*   `transition-property` - which properties to animate (e.g., `background-color`, `transform`).
*   `transition-duration` - total time for the transition.
*   `transition-timing-function` - easing curve (e.g., `ease`, `cubic-bezier()`).
*   `transition-delay` - wait time before animation starts.
*   `transition` shorthand sets all four at once.

**Note:** Easing controls how fast or slow the animation feels.

`ease-in` starts slow, while `ease-out` ends slow.

If you want to read more about CSS Transitions or get an in-depth understanding, go to [CSS Transitions](https://www.w3schools.com/css/css3_transitions.asp) in our CSS tutorial.

* * *

## Example: Buttons

This example animates background color and slight lift on hover/focus using the `transition` shorthand for smooth feedback.

```javascript
<!DOCTYPE html>
<html>
<head>
<link rel="stylesheet" href="styles.css" type="text/css">
</head>
<body>
  <a class="cta" href="#">Launch project</a>
</body>
</html>
```

On interaction, the background changes and the element translates up a few pixels.

The easing makes the motion feel responsive, not abrupt.

* * *

* * *

## Timing functions

*   Common curves: `ease`, `linear`, `ease-in`, `ease-out`, `ease-in-out`.
*   Custom easing with `cubic-bezier(x1, y1, x2, y2)`.
*   Use `steps(n, direction)` for discrete animations (menus, counters).

* * *

## Responsive motion

*   Respect `@media (prefers-reduced-motion: reduce)` by disabling or simplifying transitions.
*   Avoid large `transform` distances that cause layout shifts.
*   Limit duration to 200-300ms for snappy feedback, longer for complex transitions.

**Note:** Reduced motion is an accessibility setting; honoring it prevents discomfort for sensitive users.

* * *

* * *