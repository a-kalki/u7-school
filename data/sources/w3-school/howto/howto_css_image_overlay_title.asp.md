# How TO - Image Overlay Title

* * *

Learn how to create an image overlay title on hover.

* * *

## Image Overlay Title

Hover over the image to see the overlay effect.

![Avatar](img_avatar.png)

My Name is John

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_image_overlay_title)

* * *

## How To Create an Overlay Image Title

##### Step 1) Add HTML:

```javascript
<div class="container">  <img src="img_avatar.png" alt="Avatar" class="image">  <div class="overlay">My Name is John</div></div>
```

* * *

* * *

##### Step 2) Add CSS:

```javascript
* {box-sizing: border-box}/* Container needed to position the overlay. Adjust the width as needed */.container {  position: relative;  width: 50%;  max-width: 300px;}/* Make the image to responsive */.image {  display: block;  width: 100%;  height: auto;}/* The overlay effect - lays on top of the container and over the image */.overlay {  position: absolute;  bottom: 0;  background: rgb(0, 0, 0);  background: rgba(0, 0, 0, 0.5); /* Black see-through */  color: #f1f1f1;  width: 100%;  transition: .5s ease;  opacity:0;  color: white;  font-size: 20px;  padding: 20px;  text-align: center;}/* When you mouse over the container, fade in the overlay title */.container:hover .overlay {  opacity: 1;}
```

**Tip:** Also see other image overlay effects (fade, slide, etc) in our [How To - Image Hover Overlay](howto_css_image_overlay.asp.html).

Go to our [CSS Images Tutorial](https://www.w3schools.com/css/css3_images.asp) to learn more about how to style images.