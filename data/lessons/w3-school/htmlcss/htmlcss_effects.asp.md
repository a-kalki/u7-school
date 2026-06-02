# HTML and CSS Effects & Filters

* * *

## HTML & CSS: Effects & Filters

Enhance interfaces with shadows, blending, and filter effects while keeping accessibility and performance in mind.

Use these sparingly to guide focus and add depth.

* * *

## Box and text shadows

*   `box-shadow: offset-x offset-y blur spread color;`
*   Stack multiple shadows for realistic depth.
*   `text-shadow` adds glow or embossed effects.

**Note:** Offset values move the shadow right/left and up/down; positive numbers go right/down, negative numbers go left/up.

If you want to read more about CSS Shadows or get an in-depth understanding, go to [CSS Shadows](https://www.w3schools.com/css/css3_shadows.asp) in our CSS tutorial.

* * *

## Backdrop filters

*   `backdrop-filter` applies blur or saturation to the background of translucent elements.
*   Common processors: `blur()`, `brightness()`, `saturate()`.
*   Requires semi-transparent background or `background-color: rgba(...)`.

**Note:** Backdrop filters affect what is behind the element, not the element itself.

* * *

* * *

## Blend modes

*   `mix-blend-mode` blends the element with the backdrop.
*   `background-blend-mode` blends multiple background layers.
*   Use for overlays, duotones, or creative masks.

* * *

## Filters

*   `filter: blur(12px) contrast(120%);` stacks effects.
*   Hardware-accelerated but can be expensive on large surfaces-apply judiciously.
*   Respect accessibility-blurred text can affect readability.

**Note:** Combine filters carefully; too much blur or contrast can make text difficult to read.

* * *

## Example: Frosted Glass Card

This example layers a translucent card over a gradient background and uses `backdrop-filter` to blur and saturate whatever sits behind it.

```javascript
<!DOCTYPE html>
<html>
<head>
<link rel="stylesheet" href="styles.css" type="text/css">
</head>
<body>
  <article class="card">
    <h2>Product Release</h2>
    <p>New dashboard layouts, improved collaboration tools, and expanded theme controls.</p>
  </article>
</body>
</html>
```

* * *

## Performance & accessibility

*   Avoid heavy filters on large background videos or images to keep frame rates high.
*   Provide solid-color fallbacks when blend modes are unsupported.
*   Ensure text remains legible with sufficient contrast after applying effects.

* * *

* * *