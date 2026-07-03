# CSS object-fit Property

* * *

## CSS object-fit Property

The CSS `[object-fit](https://www.w3schools.com/cssref/css3_pr_object-fit.php)` property is used to specify how an <img> or <video> should be resized to fit its container.

This property can take one of the following values:

*   `fill` - This is default. Does not preserve the aspect ratio. The image is resized to fill the container (the image will be stretched or squeezed to fit).
*   `cover` - Preserves the aspect ratio, and the image fills the container. Cuts overflowing content if needed.
*   `contain` - Preserves the aspect ratio, and fits the image inside the container, without cutting - leaves empty space if needed.
*   `none` - The image is not resized.
*   `scale-down` - the image is scaled down to the smallest version of `none` or `contain.`

* * *

## Using object-fit: fill;

The `object-fit: fill;` value does not preserve the aspect ratio, and the image is resized to fill the container (the image will be stretched or squeezed to fit):

![Paris](paris.jpg)
```javascript
.image-container {  width: 200px;  height: 300px;  border: 1px solid black;  margin-bottom: 25px;}.image-container img {  width: 100%;  height: 100%;  object-fit: fill;}
```

* * *

## Using object-fit: cover;

The `object-fit: cover;` value preserves the aspect ratio, and the image fills the container. The image will be clipped to fit:

![Paris](paris.jpg)
```javascript
.image-container {  width: 200px;  height: 300px;  border: 1px solid black;  margin-bottom: 25px;}.image-container img {  width: 100%;  height: 100%;  object-fit: cover;}
```

* * *

## Using object-fit: contain;

The `object-fit: contain;` value preserves the aspect ratio, and fits the image inside the container, without cutting - will leave empty space if needed:

![Paris](paris.jpg)
```javascript
.image-container {  width: 200px;  height: 300px;  border: 1px solid black;  margin-bottom: 25px;}.image-container img {  width: 100%;  height: 100%;  object-fit: contain;}
```

* * *

* * *

## Using object-fit: none;

The `object-fit: none;` value does not resize or scale the image:

![Paris](paris.jpg)
```javascript
.image-container {  width: 200px;  height: 300px;  border: 1px solid black;  margin-bottom: 25px;}.image-container img {  width: 100%;  height: 100%;  object-fit: none;}
```

* * *

## Using object-fit: scale-down;

The `object-fit: scale-down;` value scales the image down to the smallest version of `none` or `contain`:

![Paris](paris.jpg)
```javascript
.image-container {  width: 200px;  height: 300px;  border: 1px solid black;  margin-bottom: 25px;}.image-container img {  width: 100%;  height: 100%;  object-fit: scale-down;}
```

* * *

## Another Example

Here we have two images and we want them to fill the width of 50% of the browser window and 100% of the height of the container.

In the following example we do NOT use `object-fit`, so when we resize the browser window, the aspect ratio of the images will be destroyed:

```javascript

```

In the next example, we use `object-fit: cover;`, so when we resize the browser window, the aspect ratio of the images is preserved:

```javascript

```

* * *

* * *

## CSS object-\* Properties

The following table lists the CSS object-\* properties:

Property

Description

[object-fit](https://www.w3schools.com/cssref/css3_pr_object-fit.php)

Specifies how an <img> or <video> should be resized to fit its container

[object-position](https://www.w3schools.com/cssref/css3_pr_object-position.php)

Specifies how an <img> or <video> should be positioned with x/y coordinates inside its "own content box"