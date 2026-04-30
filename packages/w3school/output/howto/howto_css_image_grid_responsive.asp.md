# How TO - Responsive Image Grid

* * *

Learn how to create a Responsive Image Grid.

* * *

## Responsive Image Grid

Learn how to create an image gallery that varies between four, two or full-width images, depending on screen size:

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_image_grid_responsive)

* * *

## Creating an Image Grid

##### Step 1) Add HTML:

```javascript
<div class="row">  <div class="column">    <img src="wedding.jpg">    <img src="rocks.jpg">    <img src="falls2.jpg">    <img src="paris.jpg">    <img src="nature.jpg">    <img src="mist.jpg">    <img src="paris.jpg">  </div>  <div class="column">    <img src="underwater.jpg">    <img src="ocean.jpg">    <img src="wedding.jpg">    <img src="mountainskies.jpg">    <img src="rocks.jpg">    <img src="underwater.jpg">  </div>  <div class="column">    <img src="wedding.jpg">    <img src="rocks.jpg">    <img src="falls2.jpg">    <img src="paris.jpg">    <img src="nature.jpg">    <img src="mist.jpg">    <img src="paris.jpg">  </div>  <div class="column">    <img src="underwater.jpg">    <img src="ocean.jpg">    <img src="wedding.jpg">    <img src="mountainskies.jpg">    <img src="rocks.jpg">    <img src="underwater.jpg">  </div></div>
```

##### Step 2) Add CSS:

Use CSS Flexbox to create a responsive layout:

```javascript
.row {  display: flex;  flex-wrap: wrap;  padding: 0 4px;}/* Create four equal columns that sits next to each other */.column {  flex: 25%;  max-width: 25%;  padding: 0 4px;}.column img {  margin-top: 8px;  vertical-align: middle;  width: 100%;}/* Responsive layout - makes a two column-layout instead of four columns */@media screen and (max-width: 800px) {  .column {    flex: 50%;    max-width: 50%;  }}/* Responsive layout - makes the two columns stack on top of each other instead of next to each other */@media screen and (max-width: 600px) {  .column {    flex: 100%;    max-width: 100%;  }}
```

**Tip:** Go to our [Image Grid Tutorial](howto_js_image_grid.asp.html) to learn how to create a clickable grid that varies between columns.

**Tip:** Go to our [CSS Flexbox Tutorial](https://www.w3schools.com/css/css3_flexbox.asp) to learn more about the flexible box layout module.

* * *

* * *