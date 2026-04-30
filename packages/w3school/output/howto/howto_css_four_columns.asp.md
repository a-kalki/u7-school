# How TO - Four Column Layout

* * *

Learn how to create a 4-column layout grid with CSS.

* * *

## Column 1

Some text..

## Column 2

Some text..

## Column 3

Some text..

## Column 4

Some text..

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_four_columns)

* * *

## How To Create a Four Column Layout

##### Step 1) Add HTML:

```javascript
<div class="row">  <div class="column"></div>  <div class="column"></div>  <div class="column"></div>  <div class="column"></div></div>
```

* * *

* * *

##### Step 2) Add CSS:

In this example, we will create four column layout:

```javascript
.column {  float: left;  width: 25%;}/* Clear floats after the columns */.row:after {  content: "";  display: table;  clear: both;}
```

In this example, we will create a **responsive** four column layout:

```javascript
/* Responsive layout - when the screen is less than 600px wide, make the three columns stack on top of each other instead of next to each other */@media screen and (max-width: 600px) {  .column {    width: 100%;  }}
```

**Tip:** Go to our [CSS Website Layout](https://www.w3schools.com/css/css_website_layout.asp) Tutorial to learn more about website layouts.

**Tip:** Go to our [CSS Responsive Web Design](https://www.w3schools.com/css/css_rwd_intro.asp) Tutorial to learn more about responsive web design and grids.