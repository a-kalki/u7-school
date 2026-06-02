# HTML and CSS Transforms

* * *

## HTML & CSS: Transforms

CSS transforms let you rotate, scale, skew, and translate elements without affecting the normal flow.

Combine them with transitions and animations for compelling interactions.

* * *

## 2D transforms

*   `translate()` - move along X or Y axes.
*   `scale()` - resize elements uniformly or per axis.
*   `rotate()` - spin elements by degrees or turns.
*   `skew()` - slant shapes for dynamic effects.

**Note:** X axis is horizontal, Y axis is vertical.

Positive values move right or down, negative values move left or up.

If you want to read more about CSS 2D Transforms or get an in-depth understanding, go to [CSS 2D Transforms](https://www.w3schools.com/css/css3_2dtransforms.asp) in our CSS tutorial.

* * *

## Example: Interactive Cards

This example uses 3D transforms to tilt cards on hover/focus.

Perspective is set on the element to create depth, and transforms are applied on interaction.

```javascript
<!DOCTYPE html>
<html>
<head>
<link rel="stylesheet" href="styles.css" type="text/css">
</head>
<body>
  <section class="grid">
    <article class="card" tabindex="0">Design tokens</article>
    <article class="card" tabindex="0">Accessibility audit</article>
    <article class="card" tabindex="0">Team workflows</article>
  </section>
</body>
</html>
```

On interaction, the card tilts and lifts slightly, creating a dynamic feel.

The perspective and easing make the motion feel natural.

* * *

* * *

## 3D transforms

*   Enable 3D perspective on a parent: `perspective: 800px;`.
*   Use `rotateX`, `rotateY`, `rotateZ`, and `translateZ`.
*   Apply `transform-style: preserve-3d;` to keep child depth.

**Note:** Perspective controls how strong the 3D effect feels-the smaller the number, the more dramatic the depth.

* * *

## Transform origin

*   Default origin is the element center.
*   Shift the anchor with `transform-origin: top left;` or percentages.
*   Useful for pivoting menus or scaling from a specific corner.

* * *

## Performance tips

*   Transforms are GPU-accelerated; prefer them over changing `top`/`left`.
*   Avoid forcing layout by combining transforms with `will-change` when necessary.
*   Provide reduced-motion fallbacks for large movements.

**Note:** `will-change` is a performance hint that tells the browser which properties might animate soon.

* * *

* * *