# CSS Multiple Backgrounds

* * *

## CSS Multiple Backgrounds

CSS allows you to add multiple background images for an element, through the `[background-image](https://www.w3schools.com/cssref/pr_background-image.php)` property.

The different background images are separated by commas, and the images are stacked on top of each other, where the first image is closest to the viewer.

The following example has two background images, the first image is a flower (aligned to the right-bottom) and the second image is a paper-like background (aligned to the top-left corner):

### Lorem Ipsum Dolor

Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.

Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat.

```javascript
#example1 {  background-image: url(img_flwr.gif), url(paper.gif);  background-position: right bottom, left top;  background-repeat: no-repeat, repeat;}
```

Multiple background images can be specified using either the individual background properties (as above) or with the `[background](https://www.w3schools.com/cssref/css3_pr_background.php)` shorthand property.

The following example uses the `background` shorthand property (same result as example above):

```javascript
#example1 {  background: url(img_flwr.gif) right bottom no-repeat, url(paper.gif) left top repeat;}
```

* * *

## CSS Advanced Background Properties

Property

Description

[background](https://www.w3schools.com/cssref/css3_pr_background.php)

A shorthand property for setting all the background properties in one declaration

[background-clip](https://www.w3schools.com/cssref/css3_pr_background-clip.php)

Specifies the painting area of the background

[background-image](https://www.w3schools.com/cssref/pr_background-image.php)

Specifies one or more background images for an element

[background-origin](https://www.w3schools.com/cssref/css3_pr_background-origin.php)

Specifies where the background image(s) is/are positioned

[background-size](https://www.w3schools.com/cssref/css3_pr_background-size.php)

Specifies the size of the background image(s)

* * *

* * *