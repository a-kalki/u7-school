# How TO - Two Column Layout

* * *

Learn how to create a 2-column layout grid with CSS.

* * *

## Column 1

Some text..

## Column 2

Some text..

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_two_columns)

* * *

## How To Create a Two Column Layout

##### Step 1) Add HTML:

```javascript
<div class="row">  <div class="column"></div>  <div class="column"></div></div>
```

* * *

* * *

##### Step 2) Add CSS:

In this example, we will create two **equal** columns:

```javascript
.column {  float: left;  width: 50%;}/* Clear floats after the columns */.row:after {  content: "";  display: table;  clear: both;}
```

A modern way of creating two columns, is to use [CSS Flexbox](https://www.w3schools.com/css/css3_flexbox.asp). However, it is not supported in Internet Explorer 10 and earlier versions.

```javascript
.row {  display: flex;}.column {  flex: 50%;}
```

It is up to you if you want to use floats or flex to create a two-column layout. However, if you need support for IE10 and down, you should use float.

**Tip:** To learn more about the Flexible Box Layout Module, [read our CSS Flexbox chapter](https://www.w3schools.com/css/css3_flexbox.asp).

* * *

In this example, we will create two **unequal** columns:

```javascript
.column {  float: left;}.left {  width: 25%;}.right {  width: 75%;}
```

In this example, we will create a **responsive** two column layout:

```javascript
/* Responsive layout - when the screen is less than 600px wide, make the two columns stack on top of each other instead of next to each other */@media screen and (max-width: 600px) {  .column {    width: 100%;  }}
```

**Tip:** Go to our [CSS Website Layout](https://www.w3schools.com/css/css_website_layout.asp) Tutorial to learn more about website layouts.

**Tip:** Go to our [CSS Responsive Web Design](https://www.w3schools.com/css/css_rwd_intro.asp) Tutorial to learn more about responsive web design and grids.