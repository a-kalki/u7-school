# How TO - Image Overlay Zoom

* * *

Learn how to create an image overlay zoom effect on hover.

* * *

## Image Hover Fullscreen Zoom

Hover over the image to see the zoom effect.

![Avatar](img_avatar.png)

Hello World

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_image_overlay_zoom)

* * *

## How To Create an Overlay Zoom Effect

##### Step 1) Add HTML:

```javascript
<div class="container">  <img src="img_avatar.png" alt="Avatar" class="image">  <div class="overlay">    <div class="text">Hello World</div>  </div></div>
```

* * *

* * *

##### Step 2) Add CSS:

```javascript
/* Container needed to position the overlay. Adjust the width as needed */.container {  position: relative;  width: 50%;}/* Make the image to responsive */.image {  width: 100%;  height: auto;}/* The overlay effect (full height and width) - lays on top of the container and over the image */.overlay {  position: absolute;  bottom: 0;  left: 0;  right: 0;  background-color: #008CBA;  overflow: hidden;  width: 100%;  height: 100%;  transform: scale(0);  transition: .3s ease;}/* When you mouse over the container, the overlay text will "zoom" in display */.container:hover .overlay {  transform: scale(1);}/* Some text inside the overlay, which is positioned in the middle vertically and horizontally */.text {  color: white;  font-size: 20px;  position: absolute;  top: 50%;  left: 50%;  transform: translate(-50%, -50%);  text-align: center;}
```

**Tip:** Also see other image overlay effects (fade, slide, etc) in our [How To - Image Hover Overlay](howto_css_image_overlay.asp.html).

Go to our [CSS Images Tutorial](https://www.w3schools.com/css/css3_images.asp) to learn more about how to style images.