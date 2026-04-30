# How TO - Position Text Over an Image

* * *

Learn how to place text over an image.

* * *

## Image Text

![Snow](img_snow_wide.jpg)

Bottom Left

Top Left

Top Right

Bottom Right

Centered

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_image_text)

* * *

## How To Place Text in Image

##### Step 1) Add HTML:

```javascript
<div class="container">  <img src="img_snow_wide.jpg" alt="Snow" style="width:100%;">  <div class="bottom-left">Bottom Left</div>  <div class="top-left">Top Left</div>  <div class="top-right">Top Right</div>  <div class="bottom-right">Bottom Right</div>  <div class="centered">Centered</div></div>
```

* * *

##### Step 2) Add CSS:

```javascript
/* Container holding the image and the text */.container {  position: relative;  text-align: center;  color: white;}/* Bottom left text */.bottom-left {  position: absolute;  bottom: 8px;  left: 16px;}/* Top left text */.top-left {  position: absolute;  top: 8px;  left: 16px;}/* Top right text */.top-right {  position: absolute;  top: 8px;  right: 16px;}/* Bottom right text */.bottom-right {  position: absolute;  bottom: 8px;  right: 16px;}/* Centered text */.centered {  position: absolute;  top: 50%;  left: 50%;  transform: translate(-50%, -50%);}
```

To learn more about how to style images, read our [CSS Images](https://www.w3schools.com/css/css3_images.asp) tutorial.

To learn more about CSS positoning, read our [CSS Position](https://www.w3schools.com/css/css_positioning.asp) tutorial.

* * *

* * *