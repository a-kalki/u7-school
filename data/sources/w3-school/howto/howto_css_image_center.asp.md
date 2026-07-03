# How TO - Center Images

* * *

Learn how to center an image with CSS.

* * *

Centered image:

![Paris](img_paris.jpg)

* * *

## How To Center Images

##### Step 1) Add HTML:

```javascript
<img src="paris.jpg" alt="Paris" class="center">
```

* * *

##### Step 2) Add CSS:

To center an image, set left and right margin to `auto` and make it into a `block` element:

```javascript
.center {  display: block;  margin-left: auto;  margin-right: auto;  width: 50%;}
```

Note that it cannot be centered if the width is set to 100% (full-width).

**Tip:** Go to our [CSS Images Tutorial](https://www.w3schools.com/css/css3_images.asp) to learn more about how to style images.

* * *

* * *