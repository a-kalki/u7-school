# HTML and CSS Animations

* * *

## Animations

CSS animations run keyframe sequences directly in the browser, ideal for micro-interactions, loading indicators, and storytelling without heavy JavaScript.

* * *

## Keyframe syntax

*   Define an animation with `@keyframes name { ... }`.
*   Specify property values at percentages (0%, 50%, 100%) or keywords (`from`/`to`).
*   Apply the animation to elements with `animation-name`, `animation-duration`, and related properties.

**Note:** Keyframes are snapshots of styles at certain times.

The browser fills in the frames between them automatically.

If you want to read more about CSS Animations or get an in-depth understanding, go to [CSS Animations](https://www.w3schools.com/css/css3_animations.asp) in our CSS tutorial.

* * *

## Animation properties

*   `animation-duration`, `animation-delay` control timing.
*   `animation-timing-function` sets easing between keyframes.
*   `animation-iteration-count` defines loop count or `infinite`.
*   `animation-direction` (`normal`, `reverse`, `alternate`).
*   `animation-fill-mode` determines styles before/after animation.

**Note:** `animation-fill-mode: forwards` keeps the final style after the animation finishes; `backwards` applies the first keyframe before it starts.

Use `animation` shorthand to set multiple values at once.

* * *

* * *

## Example: Loading Pulse

This example defines a simple pulse using `@keyframes` and applies it to a dot.

The animation alternates between two states using the `alternate` direction.

```javascript
<!DOCTYPE html>
<html>
<head>
<link rel="stylesheet" href="styles.css" type="text/css">
</head>
<body>
  <div class="loader"></div>
</body>
</html>
```

The `from`/`to` keyframes scale and fade the dot.

The `infinite alternate` setting loops the animation back and forth smoothly.

* * *

## Sequencing

*   Use delays or staggered start times for list reveal animations.
*   Combine multiple animations using comma-separated values.
*   Paired elements can share keyframes with different durations or delays.

* * *

## Accessibility considerations

*   Respect `@media (prefers-reduced-motion: reduce)`: disable or simplify animations.
*   Avoid large parallax or flashing effects that cause motion sickness.
*   Provide user controls for complex animated sequences.

**Note:** Always give users a way to pause long or looping animations so they do not become distracting.

* * *

* * *