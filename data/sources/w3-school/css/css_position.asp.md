# CSS The position Property

* * *

## CSS Positioning

CSS positioning is about controlling the placement of elements within a web page.

With CSS positioning, you can override the normal document flow.

* * *

## The CSS position Property

The `[position](https://www.w3schools.com/cssref/pr_class_position.php)` property specifies the positioning type for an element.

This property can have one of the following values:

*   `static` - This is default. Element is positioned according to the normal document flow
*   `relative` - Element is positioned relative to its normal position in the document flow
*   `fixed` - Element is positioned relative to the viewport
*   `absolute` - Element is positioned relative to the nearest positioned ancestor
*   `sticky` - Element toggles between a relative and fixed position, depending on the scroll position

Elements are then positioned to their final location with the `[top](https://www.w3schools.com/cssref/pr_pos_top.php)`, `[bottom](https://www.w3schools.com/cssref/pr_pos_bottom.php)`, `[left](https://www.w3schools.com/cssref/pr_pos_left.php)`, and `[right](https://www.w3schools.com/cssref/pr_pos_right.php)` properties.

* * *

## CSS position: static

All HTML elements are positioned static by default.

Static positioned elements are not affected by the top, bottom, left, and right properties.

An element with `position: static;` is always positioned according to the normal flow of the page:

This <div> element has position: static;

Here is the CSS that is used:

```javascript
div.static {  position: static;  border: 3px solid #73AD21;}
```

* * *

* * *

## CSS position: relative

An element with `position: relative;` is positioned relative to its normal position in the document flow.

Setting the top, right, bottom, and left properties will cause the element to be adjusted away from its normal position. Other content will not be adjusted to fit into any gap left by the element.

This <div> has position: relative, and is skewed 30 px to the right of its normal position

Here is the CSS that is used:

```javascript
div.relative {  position: relative;  left: 30px;  border: 3px solid #73AD21;}
```

* * *

* * *