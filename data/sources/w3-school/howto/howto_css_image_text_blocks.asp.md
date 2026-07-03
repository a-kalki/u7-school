# How TO - Text Blocks Over Image

* * *

Learn how to place text blocks over an image.

* * *

## Image Text Blocks

![Norway](img_nature_wide.jpg)

#### Nature

What a beautiful sunrise

#### Nature

What a beautiful sunrise

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_image_text_blocks)

* * *

## How To Place Text Blocks in Image

##### Step 1) Add HTML:

```javascript
<div class="container">  <img src="nature.jpg" alt="Norway" style="width:100%;">  <div class="text-block">    <h4>Nature</h4>    <p>What a beautiful sunrise</p>  </div></div>
```

* * *

##### Step 2) Add CSS:

```javascript
/* Container holding the image and the text */.container {  position: relative;}/* Bottom right text */.text-block {  position: absolute;  bottom: 20px;  right: 20px;  background-color: black;  color: white;  padding-left: 20px;  padding-right: 20px;}
```

To learn more about how to style images, read our [CSS Images](https://www.w3schools.com/css/css3_images.asp) tutorial.

To learn more about CSS positoning, read our [CSS Position](https://www.w3schools.com/css/css_positioning.asp) tutorial.

* * *

* * *