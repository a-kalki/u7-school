# CSS Tables

* * *

 HTML tables can be greatly improved with CSS:

Company

Contact

Country

Alfreds Futterkiste

Maria Anders

Germany

Berglunds snabbköp

Christina Berglund

Sweden

Centro comercial Moctezuma

Francisco Chang

Mexico

Ernst Handel

Roland Mendel

Austria

Island Trading

Helen Bennett

UK

Königlich Essen

Philip Cramer

Germany

Laughing Bacchus Winecellars

Yoshi Tannamuri

Canada

Magazzini Alimentari Riuniti

Giovanni Rovelli

Italy

[Try it Yourself »](https://www.w3schools.com/css/tryit.asp?filename=trycss_table_fancy)

* * *

## CSS Table Borders

The CSS `[border](https://www.w3schools.com/cssref/pr_border.php)` property is used to specify the width, style, and color of table borders.

The `[border](https://www.w3schools.com/cssref/pr_border.php)` property is a shorthand property for:

*   `[border-width](https://www.w3schools.com/cssref/pr_border-width.php)` - sets the width of the border
*   `[border-style](https://www.w3schools.com/cssref/pr_border-style.php)` - sets the style of the border (required)
*   `[border-color](https://www.w3schools.com/cssref/pr_border-color.php)` - sets the color of the border

The example below specifies a 1px solid border for <table>, <th>, and <td> elements:

Firstname

Lastname

Peter

Griffin

Lois

Griffin

```javascript
table, th, td {  border: 1px solid;}
```

## CSS Table Border Color

The example below specifies a 1px solid green border for <table>, <th>, and <td> elements:

Firstname

Lastname

Peter

Griffin

Lois

Griffin

```javascript
table, th, td {  border: 1px solid green;}
```

### Why Double Borders?

Notice that the tables in the examples above have double borders. This is because both the <table>, <th>, and <td> elements have separate borders.

To remove double borders, take a look at the example below.

* * *

* * *

## CSS Collapse Table Borders

The CSS `[border-collapse](https://www.w3schools.com/cssref/pr_border-collapse.php)` property sets whether table borders should collapse into a single border or be separated as in standard HTML.

This property can have one of the following values:

*   `separate` - Default value. Borders are separated; each cell will display its own borders
*   `collapse` - Borders are collapsed into a single border when possible

The following table has collapsed borders:

Firstname

Lastname

Peter

Griffin

Lois

Griffin

```javascript
table {  border-collapse: collapse;}
```

* * *

## CSS Table Padding

To control the space between the border and the content in a table, use the `[padding](https://www.w3schools.com/cssref/pr_padding.php)` property on <td> and <th> elements:

First Name

Last Name

Savings

Peter

Griffin

$100

Lois

Griffin

$150

Joe

Swanson

$300

```javascript
th, td {  padding: 10px;}
```

* * *

## CSS Border Spacing

The CSS `[border-spacing](https://www.w3schools.com/cssref/pr_border-spacing.php)` property sets the distance between the borders of adjacent cells.

**Note:** This property works only when `[border-collapse](https://www.w3schools.com/cssref/pr_border-collapse.php)` is set to "separate".

The following table has a border-spacing of 15px:

Firstname

Lastname

Peter

Griffin

Lois

Griffin

```javascript
table {  border-collapse: separate;  border-spacing: 15px;}
```

* * *

## CSS Outside Table Borders

If you just want a border around the table (not inside), you specify the `[border](https://www.w3schools.com/cssref/pr_border.php)` property only for the <table> element:

Firstname

Lastname

Peter

Griffin

Lois

Griffin

```javascript
table {  border: 1px solid;}
```

* * *

* * *