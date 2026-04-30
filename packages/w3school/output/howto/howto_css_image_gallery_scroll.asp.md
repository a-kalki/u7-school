# How TO - Horizontal Scrollable Image Gallery

* * *

Learn how to create an image gallery with a horizontal scrollbar with CSS.

* * *

## Image Gallery With Horizontal Scroll

Use the horizontal scrollbar to see the other images:

![Cinque Terre](img_5terre.jpg) ![Forest](img_forest.jpg) ![Northern Lights](img_lights.jpg) ![Mountains](img_mountains.jpg) ![Cinque Terre](img_5terre.jpg)

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_image_gallery_scroll)

* * *

## Create an Image Gallery with Horizontal Scroll

##### Step 1) Add HTML:

```javascript
<div class="scroll-container">  <img src="img_5terre.jpg" alt="Cinque Terre">  <img src="img_forest.jpg" alt="Forest">  <img src="img_lights.jpg" alt="Northern Lights">  <img src="img_mountains.jpg" alt="Mountains"></div>
```

* * *

##### Step 2) Add CSS:

```javascript
div.scroll-container {  background-color: #333;  overflow: auto;  white-space: nowrap;  padding: 10px;}div.scroll-container img {  padding: 10px;}
```

**Tip:** Go to our [HTML Images Tutorial](https://www.w3schools.com/html/html_images.asp) to learn more about images.

**Tip:** Go to our [CSS Style Images Tutorial](https://www.w3schools.com/css/css3_images.asp) to learn more about how to style images.

* * *

* * *