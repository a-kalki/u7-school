# CSS Centering Images

* * *

## Centering Images

With CSS, you can center images with several methods.

An image can be centered horizontally, vertically, or both.

* * *

## Center an Image Horizontally

To display a horizontally centered image, we can use `[margin: auto;](https://www.w3schools.com/cssref/pr_margin.php)` or `[display: flex;](https://www.w3schools.com/cssref/pr_class_display.php)`.

### 1\. Using margin: auto

One way to center an image horizontally on a page is to use `margin: auto`.

Since the <img> element is an inline element by default (and `margin: auto` does not have any effect on inline elements) we must convert the image to a block element, with `display: block`.

In addition, we have to define a `width`. The width of the image must be smaller than the width of the page.

Here is a horizontally centered image using `margin: auto`:

![Paris](paris.jpg)
```javascript
img {  display: block;  margin: auto;  width: 50%;}
```

### 2\. Using display: flex

Another way to center an image horizontally on a page is to use `display: flex`.

Here, we put the <img> element inside a <div> container.

We add the following CSS to the div container:

*   `display: flex`
*   `justify-content: center` (centers the image horizontally in the div container)

Then, we set a `width` for the image. The width of the image must be smaller than the width of the page.

Here is a horizontally centered image using `display: flex`:

![Paris](paris.jpg)

```javascript
div {  display: flex;  justify-content: center;}img {  width: 50%;}
```

* * *

* * *

## Vertical and Horizontal Centering

To display an image that is both vertically and horizontally centered (true centering), we can use `display: flex;` or `display: grid;`.

### 1\. Using display: flex

To display an image that is both vertically and horizontally centered with [flexbox](css3_flexbox.asp.html), we use a combination of: 

*   `display: flex;`
*   `justify-content: center;` (centers the image horizontally in the container)
*   `align-items: center;` (centers the image vertically in the container)
*   `height: 600px;` (the height of the container)

Here, we also put the <img> element inside a <div> container.

Then, we set a `width` for the image (must be smaller than the width of the container).

Here is a vertically and horizontally centered image with flexbox:

![Paris](paris.jpg)

```javascript
div {  display: flex;  justify-content: center;  align-items: center;  height: 600px;  border: 1px solid black;}img {  width: 50%;}
```

### 2\. Using display: grid

To display an image that is both vertically and horizontally centered with [grid](css_grid.asp.html), we use a combination of: 

*   `display: grid;`
*   `place-items: center;` (centers the image horizontally and vertically in the container)
*   `height: 600px;` (the height of the container)

Here, we also put the <img> element inside a <div> container.

Then, we set a `width` for the image (must be smaller than the width of the container).

Here is a vertically and horizontally centered image with grid:

![Paris](paris.jpg)

```javascript
div { display: grid;  place-items: center;  height: 600px;  border: 1px solid black;}img {  width: 50%;}
```

* * *

* * *