# How TO - Mixed Column Layout

* * *

Learn how to create a mixed column layout grid with CSS.

* * *

Learn how to create a responsive column layout that varies between 4 columns, 2 columns and full-width columns depending on screen width.

**Resize** the browser window to see the responsive effect:

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_mixed_columns)

* * *

## How To Create a Mixed Column Layout

##### Step 1) Add HTML:

```javascript
<div class="row">  <div class="column"></div>  <div class="column"></div>  <div class="column"></div>  <div class="column"></div></div>
```

* * *

* * *

##### Step 2) Add CSS:

In this example, we will create a four column layout that will transform to two columns on screens that are less than 900px wide. However, on screens that are less than 600px wide, the columns will stack on top of each other instead of floating next to each other.

```javascript
/* Create four equal columns that floats next to each other */.column {  float: left;  width: 25%;}/* Clear floats */.row:after {  content: "";  display: table;   clear: both;}/* Responsive layout - makes a two column-layout instead of four columns */@media screen and (max-width: 900px) {  .column {    width: 50%;  }}/* Responsive layout - makes the two columns stack on top of each other instead of next to each other */@media screen and (max-width: 600px) {  .column {    width: 100%;  }}
```

**Tip:** Go to our [CSS Website Layout](https://www.w3schools.com/css/css_website_layout.asp) Tutorial to learn more about website layouts.

**Tip:** Go to our [CSS Responsive Web Design](https://www.w3schools.com/css/css_rwd_intro.asp) Tutorial to learn more about responsive web design and grids.