# How TO - Image Overlay Icon

* * *

Learn how to create an image overlay icon effect on hover.

* * *

## Image Overlay Icon

Hover over the image to see the overlay effect.

![Avatar](img_avatar.png)

[](javascript:void\(0\) "User Profile")

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_image_overlay_icon)

* * *

## How To Create an Overlay Image Icon

##### Step 1) Add HTML:

```javascript
<!-- Add icon library --><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"><div class="container">  <img src="img_avatar.png" alt="Avatar" class="image">  <div class="overlay">    <a href="#" class="icon" title="User Profile">      <i class="fa fa-user"></i>    </a>  </div></div>
```

* * *

* * *

##### Step 2) Add CSS:

```javascript
/* Container needed to position the overlay. Adjust the width as needed */.container {  position: relative;  width: 100%;  max-width: 400px;}/* Make the image to responsive */.image {  width: 100%;  height: auto;}/* The overlay effect (full height and width) - lays on top of the container and over the image */.overlay {  position: absolute;  top: 0;  bottom: 0;  left: 0;  right: 0;  height: 100%;  width: 100%;  opacity: 0;  transition: .3s ease;  background-color: red;}/* When you mouse over the container, fade in the overlay icon*/.container:hover .overlay {  opacity: 1;}/* The icon inside the overlay is positioned in the middle vertically and horizontally */.icon {  color: white;  font-size: 100px;  position: absolute;  top: 50%;  left: 50%;  transform: translate(-50%, -50%);  -ms-transform: translate(-50%, -50%);  text-align: center;}/* When you move the mouse over the icon, change color */.fa-user:hover {  color: #eee;}
```

**Tip:** Also see other image overlay effects (fade, slide, etc) in our [How To - Image Hover Overlay](howto_css_image_overlay.asp.html).

Go to our [CSS Images Tutorial](https://www.w3schools.com/css/css3_images.asp) to learn more about how to style images.