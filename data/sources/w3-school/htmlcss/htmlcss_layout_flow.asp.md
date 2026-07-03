# HTML and CSS Layout Fundamentals

* * *

## HTML & CSS: Layout Fundamentals

Start layout by understanding the default document flow.

Master block, inline, and inline-block behaviors before reaching for advanced techniques like positioning, Flexbox, and Grid.

* * *

## Normal flow recap

*   **Block elements** stack vertically, take full width, and respect top/bottom margins.
*   **Inline elements** sit inside a line box and respect left/right margins but not top/bottom.
*   **Inline-block elements** flow inline while allowing width/height control.

**Note:** Normal flow is the browser's automatic layout.

Learn it first so advanced techniques like Flexbox make sense.

If you want to read more about CSS Display or get an in-depth understanding, go to [CSS Display](https://www.w3schools.com/css/css_display_visibility.asp) in the CSS tutorial.

* * *

## Controlling display

Switch the flow behavior with the `display` property:

*   `display: block;` promotes inline content to a full-width block.
*   `display: inline-block;` creates boxes that flow like text but can be sized.
*   `display: none;` removes element from layout (and accessibility tree unless managed).

**Note:** When you hide elements with `display: none`, screen readers also ignore them, so use it carefully.

```javascript
<!DOCTYPE html>
<html>
<head>
<link rel="stylesheet" href="styles.css" type="text/css">
</head>
<body>
  <ul class="cards">
    <li>Launch checklist</li>
    <li>Design tokens</li>
    <li>Accessibility audit</li>
  </ul>
</body>
</html>
```

Learn more: [CSS display reference](https://www.w3schools.com/cssref/pr_class_display.asp).

* * *

* * *

## Containing floats

Legacy layouts often used floats.

If you encounter them:

*   Apply `float: left;` or `float: right;` to take elements out of normal flow.
*   Clear the float using `overflow: auto;` or `clearfix` utilities.
*   Modern layouts should prefer Flexbox or Grid, but floats remain in legacy code.

**Note:** Clearing a float tells the browser to start below floated items so the parent wraps around them properly.

```javascript
.float-layout::after {
  content: "";
  display: block;
  clear: both;
}
.left-column {
  float: left;
  width: 60%;
}
.right-column {
  float: right;
  width: 35%;
}
```

* * *

## Stacking context basics

*   Elements render in DOM order unless positioning or `z-index` is applied.
*   New stacking contexts form with properties like `position` + `z-index`, `opacity`, `transform`, or `filter`.
*   Manage stacking contexts intentionally to avoid unexpected overlays.

**Note:** A stacking context is like a mini layer system; once created, its children stack only inside that layer.

If you want to read more about CSS z-index or get an in-depth understanding, go to [CSS z-index](https://www.w3schools.com/css/css_z-index.asp) in the CSS tutorial.

* * *

* * *