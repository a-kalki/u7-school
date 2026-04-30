# Responsive Web Design - Images

* * *

![](img_chania.jpg)

Resize the browser window to see how the image scales to fit the page.

* * *

## Using The width Property

If the `[width](https://www.w3schools.com/cssref/pr_dim_width.php)` property is set to a percentage and the `[height](https://www.w3schools.com/cssref/pr_dim_height.php)` property is set to "auto", the image will be responsive and scale up and down:

```javascript
img {  width: 100%;  height: auto;}
```

Notice that in the example above, the image can be scaled up to be larger than its original size. A better solution, in many cases, will be to use the `[max-width](https://www.w3schools.com/cssref/pr_dim_max-width.php)` property instead.

* * *

## Using The max-width Property

If the `[max-width](https://www.w3schools.com/cssref/pr_dim_max-width.php)` property is set to 100%, the image will scale down if it has to, but never scale up to be larger than its original size:

```javascript
img {  max-width: 100%;  height: auto;}
```

* * *

## Add an Image to The Example Web Page

```javascript
img {  width: 100%;  height: auto;}
```

* * *

* * *

## Background Images

Background images can also respond to resizing and scaling.

Here we will show three different methods:

1\. Using `background-size: contain;`: The background image will scale up and down, and tries to fit the content area. However, the image will keep its aspect ratio (the proportional relationship between the image's width and height):

```javascript
div {  width: 100%;  height: 400px;  background-image: url('img_flowers.jpg');  background-repeat: no-repeat;  background-size: contain;  border: 1px solid black;}
```

2\. Using `background-size: 100% 100%;`: The background image will stretch to cover the entire content area:

```javascript
div {  width: 100%;  height: 400px;  background-image: url('img_flowers.jpg');  background-size: 100% 100%;  border: 1px solid black;}
```

3\. Using `background-size: cover;`: The background image will scale to cover the entire content area. Notice that the "cover" value keeps the aspect ratio, and some part of the background image may be clipped:

```javascript
div {  width: 100%;  height: 400px;  background-image: url('img_flowers.jpg');  background-size: cover;  border: 1px solid black;}
```

* * *

## Different Images for Different Devices

A large image can be perfect on a big computer screen, but useless on a small device. Why load a large image when you have to scale it down anyway? To reduce the load, or for any other reasons, you can use media queries to display different images on different devices.

```javascript
/* For width smaller than 400px: */body {  background-image: url('img_smallflower.jpg');}/* For width 400px and larger: */@media only screen and (min-width: 400px) {  body {    background-image: url('img_flowers.jpg');  }}
```

* * *

## The HTML <picture> Element

The HTML `<picture>` element gives web developers more flexibility in specifying image resources.

The most common use of the `<picture>` element will be for images used in responsive designs. Instead of having one image that is scaled up or down based on the viewport width, multiple images can be designed to more nicely fill the browser viewport.

The `<picture>` element works similar to the `<video>` and `<audio>` elements. You set up different sources, and the first source that fits the preferences is the one being used:

```javascript
<picture>  <source srcset="img_smallflower.jpg" media="(max-width: 400px)">  <source srcset="img_flowers.jpg">  <img src="img_flowers.jpg" alt="Flowers"></picture>
```

The `srcset` attribute is required, and defines the source of the image.

The `media` attribute is optional, and accepts the media queries you find in [CSS @media rule](https://www.w3schools.com/cssref/atrule_media.php).

You should also define an `<img>` element for browsers that do not support the `<picture>` element.

* * *

## Responsive Image Gallery

Here, we use media queries together with flexbox to create a responsive image gallery:

```javascript

```

* * *

* * *