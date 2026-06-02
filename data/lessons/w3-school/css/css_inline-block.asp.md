# CSS display: inline-block

* * *

## The CSS display: inline-block

The `[display: inline-block](https://www.w3schools.com/cssref/pr_class_display.php)` property combines the features of both inline and block elements.

An element with `display: inline-block` will appear on the same line as other inline or inline-block elements. In addition, you can set the `[width](https://www.w3schools.com/cssref/pr_dim_width.php)`, `[height](https://www.w3schools.com/cssref/pr_dim_height.php)`, `[margin-top](https://www.w3schools.com/cssref/pr_margin-top.php)`, and `[margin-bottom](https://www.w3schools.com/cssref/pr_margin-bottom.php)` properties for the element (like block elements).

The following example shows the different behavior of `display: inline`, `display: inline-block` and `display: block`:

```javascript
span.a {  display: inline; /* the default for span */  padding: 5px;  border: 2px solid red;}span.b {  display: inline-block;  width: 100px;  height: 35px;  padding: 5px;  border: 2px solid red;}span.c {  display: block;  width: 100px;  height: 35px;  padding: 5px;  border: 2px solid red;}
```

* * *

* * *

##  Create a Horizontal Navigation Menu

A common use for `display: inline-block` is to display list items horizontally instead of vertically. The following example creates a horizontal navigation menu:

```javascript
.nav {  background-color: lightgray;  list-style-type: none;  padding: 0;  margin: 0;}.nav li {  display: inline-block;  font-size: 18px;  padding: 15px;}
```

* * *

* * *

## CSS Property

Property

Description

[display](https://www.w3schools.com/cssref/pr_class_display.php)

Specifies the display behavior (the type of rendering box) of an element