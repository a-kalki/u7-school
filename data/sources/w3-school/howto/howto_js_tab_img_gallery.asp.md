# How TO - Tab Gallery

* * *

Learn how to create a tabbed image gallery with CSS and JavaScript.

* * *

## Tab Gallery

Click on an image to expand it:

[![Nature](img_nature.jpg)](javascript:void\(0\))

[![Snow](img_snow.jpg)](javascript:void\(0\))

[![Mountains](img_mountains.jpg)](javascript:void\(0\))

[![Lights](img_lights.jpg)](javascript:void\(0\))

  

![Nature](img_nature.jpg) ×

Nature

![Snow](img_snow.jpg) ×

Snow

![Mountains](img_mountains.jpg) ×

Mountains

![Lights](img_lights.jpg) ×

Northern Lights

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_tab_img_gallery)

* * *

## Create a Tab Gallery

##### Step 1) Add HTML:

```javascript
<!-- The grid: four columns --><div class="row">  <div class="column">    <img src="img_nature.jpg" alt="Nature" onclick="myFunction(this);">  </div>  <div class="column">    <img src="img_snow.jpg" alt="Snow" onclick="myFunction(this);">  </div>  <div class="column">    <img src="img_mountains.jpg" alt="Mountains" onclick="myFunction(this);">  </div>  <div class="column">    <img src="img_lights.jpg" alt="Lights" onclick="myFunction(this);">  </div></div><!-- The expanding image container --><div class="container">  <!-- Close the image -->  <span onclick="this.parentElement.style.display='none'" class="closebtn">&times;</span>  <!-- Expanded image -->  <img id="expandedImg" style="width:100%">  <!-- Image text -->  <div id="imgtext"></div></div>
```

Use images to expand the specific image. The image that is clicked on inside the column, is shown in a container below the columns.

* * *

##### Step 2) Add CSS:

Create four columns and style the images:

```javascript
/* The grid: Four equal columns that floats next to each other */.column {  float: left;  width: 25%;  padding: 10px;}/* Style the images inside the grid */.column img {  opacity: 0.8;  cursor: pointer;}.column img:hover {  opacity: 1;}/* Clear floats after the columns */.row:after {  content: "";  display: table;  clear: both;}/* The expanding image container (positioning is needed to position the close button and the text) */.container {  position: relative;  display: none;}/* Expanding image text */#imgtext {  position: absolute;  bottom: 15px;  left: 15px;  color: white;  font-size: 20px;}/* Closable button inside the image */.closebtn {  position: absolute;  top: 10px;  right: 15px;  color: white;  font-size: 35px;  cursor: pointer;}
```

* * *

* * *

##### Step 3) Add JavaScript:

```javascript
function myFunction(imgs) {  // Get the expanded image  var expandImg = document.getElementById("expandedImg");  // Get the image text  var imgText = document.getElementById("imgtext");  // Use the same src in the expanded image as the image being clicked on from the grid  expandImg.src = imgs.src;  // Use the value of the alt attribute of the clickable image as text inside the expanded image  imgText.innerHTML = imgs.alt;  // Show the container element (hidden with CSS)  expandImg.parentElement.style.display = "block";}
```