# CSS Flexbox

* * *

## CSS Flexbox (Flexible Box Layout)

CSS Flexbox is short for the CSS Flexible Box Layout module.

Flexbox is a layout model for arranging items (horizontally or vertically) within a container, in a flexible and responsive way.

Flexbox makes it easy to design a flexible and responsive layout, without using `[float](https://www.w3schools.com/cssref/pr_class_float.php)` or positioning.

### Item 1

### Item 2

### Item 3

### Item 4

### Item 5

[Try it Yourself »](https://www.w3schools.com/css/tryit.asp?filename=trycss3_flexbox)

### Flexbox vs. Grid

CSS Flexbox is used for a one-dimensional layout, with rows OR columns.

[CSS Grid](css_grid.asp.html) is used for a two-dimensional layout, with rows AND columns.

* * *

## CSS Flexbox Components

A flexbox always consists of:

*   **A Flex Container** - The parent (container) element, where the `[display](https://www.w3schools.com/cssref/pr_class_display.php)` property is set to `flex` or `inline-flex`
*   **One or more Flex Items** - The direct children of the flex container automatically becomes flex items

* * *

* * *

## A Flex Container with Three Flex Items

The element below represents a **flex container** (the blue area) with three **flex items**.

### Item 1

### Item 2

### Item 3

```javascript
<html><head><style>.container {  display: flex;  background-color: DodgerBlue;}.container div {  background-color: #f1f1f1;  margin: 10px;  padding: 20px;  font-size: 30px;}</style></head><body><div class="container">  <div>Item 1</div>  <div>Item 2</div>  <div>Item 3</div></div></body></html>
```

You will learn more about flex containers and flex items in the next chapters.

* * *

* * *