# CSS Border Images

* * *

## CSS Border Images

With the CSS `[border-image](https://www.w3schools.com/cssref/css3_pr_border-image.php)` property, you can define an image to be used as the border around an element.

* * *

## CSS border-image Property

The `[border-image](https://www.w3schools.com/cssref/css3_pr_border-image.php)` property allows you to define an image to be used as the border around an element, instead of the normal border.

This property takes an image and slices it into nine sections, like a tic-tac-toe board. It then places the corners at the corners, and the middle sections are repeated or stretched as you specify.

The `border-image` property is a shorthand property for the following properties:

*   `[border-image-source](https://www.w3schools.com/cssref/css3_pr_border-image-source.php)` - defines the path to the image
*   `[border-image-slice](https://www.w3schools.com/cssref/css3_pr_border-image-slice.php)` - defines how to slice the image
*   `[border-image-width](https://www.w3schools.com/cssref/css3_pr_border-image-width.php)` - defines the width of the image
*   `[border-image-outset](https://www.w3schools.com/cssref/css3_pr_border-image-outset.php)` defines the amount by which the border image area extends beyond the border box
*   `[border-image-repeat](https://www.w3schools.com/cssref/css3_pr_border-image-repeat.php)` - defines how to repeat the image

**Note:** For `border-image` to work, the element also needs the `[border](https://www.w3schools.com/cssref/pr_border.php)` property set!

* * *

## CSS border-image Examples

We will use the following image (named "border.png"):

![Border](border.png)

In the following example, the url(border.png) specifies the source image, the number 30 slices the image 30 pixels from each edge, and the `round` value specifies that the middle section of the image is tiled (repeated) to fill the area (and rescaled to fit, if needed):

An image as the border!

Here is the code:

```javascript
#borderimg {  border: 10px solid transparent; /* Required for border-image */  padding: 15px;  border-image: url(border.png) 30 round;}
```

Here, the `stretch` value specifies that the middle section of the image is stretched to fill the area:

An image as the border!

Here is the code:

```javascript
#borderimg {  border: 10px solid transparent;  /* Required for border-image */  padding: 15px;  border-image: url(border.png) 30 stretch;}
```

* * *

* * *

## CSS border-image - Different Slice Values

Different slice values completely changes the look of the border image:

Example 1:

border-image: url(border.png) 50 round;

Example 2:

border-image: url(border.png) 20% round;

Example 3:

border-image: url(border.png) 30% round;

Here is the code:

```javascript
#borderimg1 {  border: 10px solid transparent;  padding: 15px;  border-image: url(border.png) 50 round;}#borderimg2 {  border: 10px solid transparent;  padding: 15px;  border-image: url(border.png) 20% round;}#borderimg3 {  border: 10px solid transparent;  padding: 15px;  border-image: url(border.png) 30% round;}
```

* * *

* * *

## CSS Border Image Properties

Property

Description

[border-image](https://www.w3schools.com/cssref/css3_pr_border-image.php)

A shorthand property for setting all the border-image-\* properties

[border-image-source](https://www.w3schools.com/cssref/css3_pr_border-image-source.php)

Specifies the path to the image to be used as a border

[border-image-slice](https://www.w3schools.com/cssref/css3_pr_border-image-slice.php)

Specifies how to slice the border image

[border-image-width](https://www.w3schools.com/cssref/css3_pr_border-image-width.php)

Specifies the widths of the border image

[border-image-outset](https://www.w3schools.com/cssref/css3_pr_border-image-outset.php)

Specifies the amount by which the border image area extends beyond the border box

[border-image-repeat](https://www.w3schools.com/cssref/css3_pr_border-image-repeat.php)

Specifies whether the border image should be repeated, rounded or stretched