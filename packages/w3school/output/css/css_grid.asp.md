# CSS Grid Layout

* * *

## CSS Grid Layout Module

The Grid Layout Module offers a grid-based layout system, with rows and columns.

The Grid Layout Module allows developers to easily create complex web layouts.

The Grid Layout Module makes it easy to design a responsive layout structure, without using `[float](https://www.w3schools.com/cssref/pr_class_float.php)` or positioning.

## My Header

[Link 1](css_grid.asp.html#)  
[Link 2](css_grid.asp.html#)  
[Link 3](css_grid.asp.html#)

### Lorem Ipsum

Lorem ipsum odor amet, consectetuer adipiscing elit. Ridiculus sit nisl laoreet facilisis aliquet. Potenti dignissim litora eget montes rhoncus sapien neque urna. Cursus libero sapien integer magnis ligula lobortis quam ut.

#### Footer

[Try it Yourself »](https://www.w3schools.com/css/tryit.asp?filename=trycss_grid_layout_named)

### Grid vs. Flexbox

CSS Grid is used for two-dimensional layout, with rows AND columns.

[CSS Flexbox](css3_flexbox.asp.html) is used for one-dimensional layout, with rows OR columns.

* * *

## CSS Grid Components

A grid always consists of:

*   **A Grid Container** - The parent (container) element, where the `[display](https://www.w3schools.com/cssref/pr_class_display.php)` property is set to `grid` or `inline-grid`
*   **One or more Grid Items** - The direct children of the grid container automatically becomes grid items

* * *

* * *

## A Grid Container with Five Grid Items

The element below represents a **grid container** (the blue area) with five **grid items**.

1

2

3

4

5

```javascript
<html><head><style>.container {  display: grid;  grid-template-columns: auto auto auto;  background-color: dodgerblue;  padding: 10px;}.container div {  background-color: #f1f1f1;  border: 1px solid black;  padding: 10px;  font-size: 30px;  text-align: center;}</style></head><body><div class="container">  <div>1</div>  <div>2</div>  <div>3</div>  <div>4</div>  <div>5</div></div></body></html>
```

**Note:** You will learn more about grid containers and grid items in the next chapters.

## All CSS Grid Properties

Property

Description

[align-content](https://www.w3schools.com/cssref/css3_pr_align-content.php)

Vertically aligns the whole grid inside the container (when total grid size is smaller than container)

[align-items](https://www.w3schools.com/cssref/css3_pr_align-items.php)

Specifies the default alignment for items inside a flexbox or grid container

[align-self](https://www.w3schools.com/cssref/css3_pr_align-self.php)

Aligns the content for a specific grid item along the column axis

[display](https://www.w3schools.com/cssref/pr_class_display.php)

Specifies the display behavior (the type of rendering box) of an element

[column-gap](https://www.w3schools.com/cssref/css3_pr_column-gap.php)

Specifies the gap between the columns

[gap](https://www.w3schools.com/cssref/css3_pr_gap.php)

A shorthand property for the _row-gap_ and the _column-gap_ properties

[grid](https://www.w3schools.com/cssref/pr_grid.php)

A shorthand property for the _grid-template-rows, grid-template-columns, grid-template-areas, grid-auto-rows, grid-auto-columns_, and the _grid-auto-flow_ properties

[grid-area](https://www.w3schools.com/cssref/pr_grid-area.php)

Either specifies a name for the grid item, or this property is a shorthand property for the _grid-row-start_, _grid-column-start_, _grid-row-end_, and _grid-column-end_ properties

[grid-auto-columns](https://www.w3schools.com/cssref/pr_grid-auto-columns.php)

Specifies a default column size

[grid-auto-flow](https://www.w3schools.com/cssref/pr_grid-auto-flow.php)

Specifies how auto-placed items are inserted in the grid

[grid-auto-rows](https://www.w3schools.com/cssref/pr_grid-auto-rows.php)

Specifies a default row size

[grid-column](https://www.w3schools.com/cssref/pr_grid-column.php)

A shorthand property for the _grid-column-start_ and the _grid-column-end_ properties

[grid-column-end](https://www.w3schools.com/cssref/pr_grid-column-end.php)

Specifies where to end the grid item

[grid-column-start](https://www.w3schools.com/cssref/pr_grid-column-start.php)

Specifies where to start the grid item

[grid-row](https://www.w3schools.com/cssref/pr_grid-row.php)

A shorthand property for the _grid-row-start_ and the _grid-row-end_ properties

[grid-row-end](https://www.w3schools.com/cssref/pr_grid-row-end.php)

Specifies where to end the grid item

[grid-row-start](https://www.w3schools.com/cssref/pr_grid-row-start.php)

Specifies where to start the grid item

[grid-template](https://www.w3schools.com/cssref/pr_grid-template.php)

A shorthand property for the _grid-template-rows_, _grid-template-columns_ and _grid-areas_ properties

[grid-template-areas](https://www.w3schools.com/cssref/pr_grid-template-areas.php)

Specifies how to display columns and rows, using named grid items

[grid-template-columns](https://www.w3schools.com/cssref/pr_grid-template-columns.php)

Specifies the size of the columns, and how many columns in a grid layout

[grid-template-rows](https://www.w3schools.com/cssref/pr_grid-template-rows.php)

Specifies the size of the rows in a grid layout

[justify-content](https://www.w3schools.com/cssref/css3_pr_justify-content.php)

Horizontally aligns the whole grid inside the container (when total grid size is smaller than container)

[justify-self](https://www.w3schools.com/cssref/css_pr_justify-self.php)

Aligns the content for a specific grid item along the row axis

[place-self](https://www.w3schools.com/cssref/css_pr_place-self.php)

A shorthand property for the _align-self_ and the _justify-self_ properties

[place-content](https://www.w3schools.com/cssref/css_pr_place-content.php)

A shorthand property for the _align-content_ and the _justify-content_ properties

[row-gap](https://www.w3schools.com/cssref/css3_pr_row-gap.php)

Specifies the gap between the grid rows