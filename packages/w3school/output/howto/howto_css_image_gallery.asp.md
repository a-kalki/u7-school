# How TO - Responsive Image Gallery

* * *

Learn how to create a responsive image gallery with CSS.

* * *

## Image Gallery

Resize the browser window to see the responsive effect:

[![Cinque Terre](img_5terre.jpg)](img_5terre.jpg)

Add a description of the image here

[![Forest](img_forest.jpg)](img_forest.jpg)

Add a description of the image here

[![Northern Lights](img_lights.jpg)](img_lights.jpg)

Add a description of the image here

[![Mountains](img_mountains.jpg)](img_mountains.jpg)

Add a description of the image here

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_image_gallery)

* * *

## Create a Image Gallery

##### Step 1) Add HTML:

```javascript
<div class="responsive">  <div class="gallery">    <a target="_blank" href="img_5terre.jpg">      <img src="img_5terre.jpg" alt="Cinque Terre">    </a>    <div class="desc">Add a description of the image here</div>  </div></div><div class="responsive">  <div class="gallery">    <a target="_blank" href="img_forest.jpg">      <img src="img_forest.jpg" alt="Forest">    </a>    <div class="desc">Add a description of the image here</div>  </div></div><div class="responsive">  <div class="gallery">    <a target="_blank" href="img_lights.jpg">      <img src="img_lights.jpg" alt="Northern Lights">    </a>    <div class="desc">Add a description of the image here</div>  </div></div><div class="responsive">  <div class="gallery">    <a target="_blank" href="img_mountains.jpg">      <img src="img_mountains.jpg" alt="Mountains">    </a>    <div class="desc">Add a description of the image here</div>  </div></div><div class="clearfix"></div>
```

* * *

* * *

##### Step 2) Add CSS:

This example use media queries to re-arrange the images on different screen sizes: for screens larger than 700px wide, it will show four images side by side, for screens smaller than 700px, it will show two images side by side. For screens smaller than 500px, the images will stack vertically (100%):

```javascript
div.gallery {  border: 1px solid #ccc;}div.gallery:hover {  border: 1px solid #777;}div.gallery img {  width: 100%;  height: auto;}div.desc {  padding: 15px;  text-align: center;}* {  box-sizing: border-box;}.responsive {  padding: 0 6px;  float: left;  width: 24.99999%;}@media only screen and (max-width: 700px) {  .responsive {    width: 49.99999%;    margin: 6px 0;  }}@media only screen and (max-width: 500px) {  .responsive {    width: 100%;  }}.clearfix:after {  content: "";  display: table;  clear: both;}
```

**Tip:** Go to our [HTML Images Tutorial](https://www.w3schools.com/html/html_images.asp) to learn more about images.

**Tip:** Go to our [CSS Style Images Tutorial](https://www.w3schools.com/css/css3_images.asp) to learn more about how to style images.

* * *