# How TO - Equal Height

* * *

Learn how to create equal height columns with CSS.

* * *

## How To Create Equal Height Columns

When you have columns that should appear side by side, you'll often want them to be of equal height (matching the height of the tallest).

### The Problem:

### The Desire:

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_equal_height)

* * *

##### Step 1) Add HTML:

```javascript
<div class="col-container">  <div class="col">    <h2>Column 1</h2>    <p>Hello World</p>  </div>  <div class="col">    <h2>Column 2</h2>    <p>Hello World!</p>    <p>Hello World!</p>    <p>Hello World!</p>    <p>Hello World!</p>  </div>  <div class="col">    <h2>Column 3</h2>    <p>Some other text..</p>    <p>Some other text..</p>  </div></div>
```

##### Step 2) Add CSS:

```javascript
.col-container {  display: table; /* Make the container element behave like a table */  width: 100%; /* Set full-width to expand the whole page */}.col {  display: table-cell; /* Make elements inside the container behave like table cells */}
```

* * *

* * *

## Responsive Equal Height

The columns we made in the previous example are responsive (if you resize the browser window in the try it example, you will see that they automatically adjust to the necessary width and height). However, for small screens (like smartphones), you might want them to stack vertically instead of horizontally:

On medium and large screens:

Hello World.

Hello World.

Hello World.

Hello World.

Hello World.

On small screens:

Hello World.

Hello World.

Hello World.

Hello World.

Hello World.

To achieve this, add a media query and specify a breakpoint pixel value for when this should happen:

```javascript
/* If the browser window is smaller than 600px, make the columns stack on top of each other */@media only screen and (max-width: 600px) {  .col {    display: block;    width: 100%;  }}
```

* * *

## Equal Height and Width using Flexbox

You can also use Flexbox to create equal height boxes:

```javascript
.col-container {  display: flex;  width: 100%;}.col {  flex: 1;  padding: 16px;}
```

**Note:** Flexbox is not supported in Internet Explorer 10 and earlier versions.

**Tip:** Read more about flexible boxes in our [CSS Flexbox Tutorial](https://www.w3schools.com/css/css3_flexbox.asp).