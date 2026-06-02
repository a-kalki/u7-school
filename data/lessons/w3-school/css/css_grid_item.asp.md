# CSS Grid Items

* * *

## CSS Grid Items

A grid container contains one or more grid items.

All direct child elements of a grid container automatically become grid items.

Below is a grid container with five grid items:

1

2

3

4

5

[Try it Yourself »](https://www.w3schools.com/css/tryit.asp?filename=trycss_grid_item)

* * *

## CSS Sizing/Spanning Grid Items

A grid item can span over mulitiple columns or rows.

We can specify where to start and end a grid item by using the following properties:

*   `grid-column-start` - Specifies on which column-line the grid item will start
*   `grid-column-end` - Specifies on which column-line the grid item will end
*   `grid-column` - Shorthand property for `grid-column-start` and `grid-column-end`
*   `grid-row-start` - Specifies on which row-line the grid item will start
*   `grid-row-end` - Specifies on which row-line the grid item will end
*   `grid-row` - Shorthand property for `grid-row-start` and `grid-row-end`

The lines between the columns in a grid are called _column-lines_, and the lines between the rows in a grid are called _row-lines_.

We can refer to line numbers when placing a grid item in a grid container.

* * *

## CSS grid-column-start and grid-column-end

The `[grid-column-start](https://www.w3schools.com/cssref/pr_grid-column-start.php)` property specifies on which column-line the grid item will start.

The `[grid-column-end](https://www.w3schools.com/cssref/pr_grid-column-end.php)` property specifies on which column-line the grid item will end.

```javascript
.item1 {  grid-column-start: 1;  grid-column-end: 3;}
```

* * *

* * *

## The CSS grid-column Property

The `[grid-column](https://www.w3schools.com/cssref/pr_grid-column.php)` property is a shorthand property for the `[grid-column-start](https://www.w3schools.com/cssref/pr_grid-column-start.php)` and the `[grid-column-end](https://www.w3schools.com/cssref/pr_grid-column-end.php)` properties.

```javascript
.item1 {  grid-column: 1 / span 2;}
```

* * *

## CSS grid-row-start and grid-row-end

The `[grid-row-start](https://www.w3schools.com/cssref/pr_grid-row-start.php)` property specifies on which row-line the grid item will start.

The `[grid-row-end](https://www.w3schools.com/cssref/pr_grid-row-end.php)` property specifies on which row-line the grid item will end.

```javascript
.item1 {  grid-row-start: 1;  grid-row-end: 3;}
```

* * *

## The CSS grid-row Property

The `[grid-row](https://www.w3schools.com/cssref/pr_grid-row.php)` property is a shorthand property for the `[grid-row-start](https://www.w3schools.com/cssref/pr_grid-row-start.php)` and the `[grid-row-end](https://www.w3schools.com/cssref/pr_grid-row-end.php)` properties.

```javascript
.item1 {  grid-row: 1 / span 2;}
```

* * *

## Combine grid-column and grid-row

Here we use both the `[grid-column](https://www.w3schools.com/cssref/pr_grid-column.php)` and `[grid-row](https://www.w3schools.com/cssref/pr_grid-row.php)` properties to let a grid item span both columns and rows.

```javascript
.item1 {  grid-column: 1 / span 2;  grid-row: 1 / span 2;}
```

* * *

* * *

## All CSS Grid Item Properties

Property

Description

[align-self](https://www.w3schools.com/cssref/css3_pr_align-self.php)

Aligns the content for a specific grid item along the column axis

[grid-area](https://www.w3schools.com/cssref/pr_grid-area.php)

A shorthand property for the _grid-row-start, grid-column-start_, _grid-row-end_ and the _grid-column-end_ properties

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

[justify-self](https://www.w3schools.com/cssref/css_pr_justify-self.php)

Aligns the content for a specific grid item along the row axis

[place-self](https://www.w3schools.com/cssref/css_pr_place-self.php)

A shorthand property for the _align-self_ and the _justify-self_ properties