# How TO - Image Grid

* * *

Learn how to create an Image Grid.

* * *

## Image Grid

Learn how to create an image gallery that varies between four, two or full-width images with a click of a button:

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_image_grid)

* * *

## Creating an Image Grid

##### Step 1) Add HTML:

```javascript
<div class="row">  <div class="column">    <img src="wedding.jpg">    <img src="rocks.jpg">    <img src="falls2.jpg">    <img src="paris.jpg">    <img src="nature.jpg">    <img src="mist.jpg">    <img src="paris.jpg">  </div>  <div class="column">    <img src="underwater.jpg">    <img src="ocean.jpg">    <img src="wedding.jpg">    <img src="mountainskies.jpg">    <img src="rocks.jpg">    <img src="underwater.jpg">  </div>  <div class="column">    <img src="wedding.jpg">    <img src="rocks.jpg">    <img src="falls2.jpg">    <img src="paris.jpg">    <img src="nature.jpg">    <img src="mist.jpg">    <img src="paris.jpg">  </div>  <div class="column">    <img src="underwater.jpg">    <img src="ocean.jpg">    <img src="wedding.jpg">    <img src="mountainskies.jpg">    <img src="rocks.jpg">    <img src="underwater.jpg">  </div></div>
```

* * *

##### Step 2) Add CSS:

Use CSS Flexbox to create the layout:

```javascript
.row {  display: flex;  flex-wrap: wrap;  padding: 0 4px;}/* Create two equal columns that sits next to each other */.column {  flex: 50%;  padding: 0 4px;}.column img {  margin-top: 8px;  vertical-align: middle;}
```

* * *

* * *

##### Step 3) Add JavaScript:

Create a Controllable Grid View Using JavaScript:

```javascript
<button onclick="one()">1</button><button onclick="two()">2</button><button onclick="four()">4</button><script>// Get the elements with class="column"var elements = document.getElementsByClassName("column");// Declare a "loop" variablevar i;// Full-width imagesfunction one() {  for (i = 0; i < elements.length; i++) {    elements[i].style.flex = "100%";  }}// Two images side by sidefunction two() {  for (i = 0; i < elements.length; i++) {    elements[i].style.flex = "50%";  }}// Four images side by sidefunction four() {  for (i = 0; i < elements.length; i++) {    elements[i].style.flex = "25%";  }}</script>
```

**Tip:** Go to our [Responsive Image Grid Tutorial](howto_css_image_grid_responsive.asp.html) to learn how to create a responsive image grid, that varies between columns, depending on screen size.

**Tip:** Go to our [CSS Flexbox Tutorial](https://www.w3schools.com/css/css3_flexbox.asp) to learn more about the flexible box layout module.