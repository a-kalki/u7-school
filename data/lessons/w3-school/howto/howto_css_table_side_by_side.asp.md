# How TO - Side-by-side Tables

* * *

Learn how to create side-by-side tables with CSS.

* * *

Firstname

Lastname

Age

Jill

Smith

50

Eve

Jackson

94

John

Doe

80

Firstname

Lastname

Age

Jill

Smith

50

Eve

Jackson

94

John

Doe

80

* * *

## How To Place Tables Side by Side

How to create side-by-side tables with the CSS `float` property:

```javascript
* {  box-sizing: border-box;}/* Create a two-column layout */.column {  float: left;  width: 50%;  padding: 5px;}/* Clearfix (clear floats) */.row::after {  content: "";  clear: both;  display: table;}
```

How to create side-by-side tables with the CSS `flex` property:

```javascript
* {  box-sizing: border-box;}.row {  display: flex;}.column {  flex: 50%;  padding: 5px;}
```

**Note:** Flexbox is not supported in Internet Explorer 10 and earlier versions. It is up to you if you want to use floats or flex. However, if you need support for IE10 and down, you should use float.

**Tip:** To learn more about the Flexible Box Layout Module, [read our CSS Flexbox chapter](https://www.w3schools.com/css/css3_flexbox.asp).

* * *

* * *

## Add Responsiveness

The example above will not look good on a mobile device, as two columns will take up too much space of the page. To create a responsive table, that should go from a two-column layout to a full-width layout on mobile devices, add the following media queries:

```javascript
/* Responsive layout - makes the two columns stack on top of each other instead of next to each other on screens that are smaller than 600 px */@media screen and (max-width: 600px) {  .column {    width: 100%;  }}
```

**Tip:** Go to our [CSS Tables Tutorial](https://www.w3schools.com/css/css_table.asp) to learn more about how to style tables.

**Tip:** Go to our [CSS Float Tutorial](https://www.w3schools.com/css/css_float.asp) to learn more about the float property.

**Tip:** Go to our [CSS Flexbox Tutorial](https://www.w3schools.com/css/css3_flexbox.asp) to learn more about the flex property.