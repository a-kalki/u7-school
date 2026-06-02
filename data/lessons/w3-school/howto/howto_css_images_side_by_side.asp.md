# How TO - Align Images Side By Side

* * *

Learn how to align images side by side with CSS.

* * *

## Side-by-Side Image Gallery

![Snow](img_snow.jpg)

![Forest](img_forest.jpg)

![Mountains](img_mountains.jpg)

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_images_side_by_side)

* * *

## How To Place Images Side by Side

##### Step 1) Add HTML:

```javascript
<div class="row">  <div class="column">    <img src="img_snow.jpg" alt="Snow" style="width:100%">  </div>  <div class="column">    <img src="img_forest.jpg" alt="Forest" style="width:100%">  </div>  <div class="column">    <img src="img_mountains.jpg" alt="Mountains" style="width:100%">  </div></div>
```

* * *

##### Step 2) Add CSS:

How to create side-by-side images with the CSS `float` property:

```javascript
/* Three image containers (use 25% for four, and 50% for two, etc) */.column {  float: left;  width: 33.33%;  padding: 5px;}/* Clear floats after image containers */.row::after {  content: "";  clear: both;  display: table;}
```

How to create side-by-side images with the CSS `flex` property:

```javascript
.row {  display: flex;}.column {  flex: 33.33%;  padding: 5px;}
```

**Note:** Flexbox is not supported in Internet Explorer 10 and earlier versions. It is up to you if you want to use floats or flex to create a three-column layout. However, if you need support for IE10 and down, you should use float.

**Tip:** To learn more about the Flexible Box Layout Module, [read our CSS Flexbox chapter](https://www.w3schools.com/css/css3_flexbox.asp).

* * *

* * *

## Add Responsiveness

Optionally, you could add media queries to make the images stack on top of each other instead of floating next to each other, on a specific screen width.

The following example will stack the images vertically on screens that are 500px wide or less:

```javascript
/* Responsive layout - makes the three columns stack on top of each other instead of next to each other */@media screen and (max-width: 500px) {  .column {    width: 100%;  }}
```

To learn more about media queries, read our [CSS Media Queries Tutorial](https://www.w3schools.com/css/css3_mediaqueries.asp).

* * *

## Related Pages

To learn more about how to style images, read our [CSS Images Tutorial](https://www.w3schools.com/css/css3_images.asp).

To learn more about CSS Float, read our [CSS Float Tutorial](https://www.w3schools.com/css/css_float.asp).

To learn how to create an image gallery with CSS, read our [CSS Image Gallery Tutorial](https://www.w3schools.com/css/css_image_gallery.asp).