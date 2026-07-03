# How TO - Responsive Images

* * *

Learn how to create an responsive image with CSS.

* * *

Responsive images will automatically adjust to fit the size of the screen.

Resize the browser window to see the responsive effect:

![Lights](img_nature_wide.jpg)

* * *

## How To Create Responsive Images

##### Step 1) Add HTML:

```javascript
<img src="nature.jpg" alt="Nature" class="responsive">
```

* * *

##### Step 2) Add CSS:

If you want the image to scale both up and down on responsiveness, set the CSS `width` property to 100% and `height` to auto:

```javascript
.responsive {  width: 100%;  height: auto;}
```

If you want an image to scale down if it has to, but never scale up to be larger than its original size, use `max-width: 100%`:

```javascript
.responsive {  max-width: 100%;  height: auto;}
```

If you want to restrict a responsive image to a maximum size, use the `max-width` property, with a pixel value of your choice:

```javascript
.responsive {  width: 100%;  max-width: 400px;  height: auto;}
```

Go to our [CSS Images Tutorial](https://www.w3schools.com/css/css3_images.asp) to learn more about how to style images.

Go to our [CSS RWD Tutorial](https://www.w3schools.com/css/css_rwd_intro.asp) to learn more about responsive web design.

* * *

* * *