# CSS Image Shapes

* * *

With CSS it is easy to shape (clip) images to circles, ellipses and polygons.

* * *

## CSS clip-path Property and the circle() Function

The `[clip-path](https://www.w3schools.com/cssref/css3_pr_clip-path.php)` property lets you clip an element to a basic shape.

The `[circle()](https://www.w3schools.com/cssref/func_circle.php)` function defines a circle with a radius and a position.

Here we clip an image to a circle with 50% radius:

![Pineapple](pineapple.jpg)
```javascript
img {  clip-path: circle(50%);}
```

We can also specify the center of the circle. This can be a length or percentage value. It can also be a value such as left, right, top, or bottom. The default value is center.

Here we clip an image to a circle with 50% radius and position the center of the circle to the right:

![Pineapple](pineapple.jpg)
```javascript
img {  clip-path: circle(50% at right);}
```

* * *

## CSS shape-outside and circle()

The `[shape-outside](https://www.w3schools.com/cssref/css_pr_shape-outside.php)` property lets you define a shape for the wrapping of the inline content.

The `[circle()](https://www.w3schools.com/cssref/func_circle.php)` function defines a circle with a radius and a position.

Here we clip an image to a circle with 40% radius, and set the shape-outside to a circle with 45% radius (to shape the text):

![Pineapple](pineapple.jpg)

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla ac laoreet quam, id aliquet nisl. Etiam id eros ligula. Aenean euismod, enim sed mollis feugiat, magna massa cursus leo, ut maximus metus eros non ante. Praesent eget tincidunt mauris, ut euismod ipsum. In hac habitasse platea dictumst. In dapibus tortor magna, elementum elementum neque sagittis id. Integer vestibulum semper dui, quis finibus libero elementum nec. Fusce ultricies lectus a eros interdum, efficitur iaculis nibh varius. Praesent sed ex bibendum, fermentum tortor nec, tincidunt augue. Maecenas in lobortis ligula, at viverra velit. Donec facilisis blandit purus sed efficitur. Duis est augue, bibendum quis bibendum sed, feugiat vel eros. Quisque ut nisi sed erat malesuada euismod. Aliquam feugiat erat eget sodales imperdiet. Ut vel tortor auctor, rutrum lectus a, tempor nunc. Vivamus nec elit ornare, dictum urna sollicitudin, ornare diam. Nullam dictum arcu vitae odio ultrices iaculis.

```javascript
img {  float: left;  clip-path: circle(40%);  shape-outside: circle(45%);}
```

* * *

* * *

## CSS clip-path and ellipse()

The `[clip-path](https://www.w3schools.com/cssref/css3_pr_clip-path.php)` property lets you clip an element to a basic shape.

The `[ellipse()](https://www.w3schools.com/cssref/func_ellipse.php)` function defines an ellipse with two radii x and y.

Here we clip an image to an ellipse with 50% radius x and 35% radius y:

![Pineapple](pineapple.jpg)
```javascript
img {  clip-path: ellipse(50% 35%);}
```

We can also specify the center of the ellipse. This can be a length or percentage value. It can also be a value such as left, right, top, or bottom. The default value is center.

Here we clip an image to an ellipse with 50% radius x and 35% radius y, and position the center of the ellipse to the right:

![Pineapple](pineapple.jpg)
```javascript
img {  clip-path: ellipse(50% 35% at right);}
```

* * *

## CSS shape-outside and ellipse()

Here we clip an image to an ellipse with 40% radius x and 50% radius y, and set the shape-outside to an ellipse with 45% radius x and 50% radius y (to shape the text):

![Pineapple](pineapple.jpg)

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla ac laoreet quam, id aliquet nisl. Etiam id eros ligula. Aenean euismod, enim sed mollis feugiat, magna massa cursus leo, ut maximus metus eros non ante. Praesent eget tincidunt mauris, ut euismod ipsum. In hac habitasse platea dictumst. In dapibus tortor magna, elementum elementum neque sagittis id. Integer vestibulum semper dui, quis finibus libero elementum nec. Fusce ultricies lectus a eros interdum, efficitur iaculis nibh varius. Praesent sed ex bibendum, fermentum tortor nec, tincidunt augue. Maecenas in lobortis ligula, at viverra velit. Donec facilisis blandit purus sed efficitur. Duis est augue, bibendum quis bibendum sed, feugiat vel eros. Quisque ut nisi sed erat malesuada euismod. Aliquam feugiat erat eget sodales imperdiet. Ut vel tortor auctor, rutrum lectus a, tempor nunc. Vivamus nec elit ornare, dictum urna sollicitudin, ornare diam. Nullam dictum arcu vitae odio ultrices iaculis.

```javascript
img {  float: left;  clip-path: ellipse(40% 50%);  shape-outside: ellipse(45% 50%);}
```

* * *

## CSS polygon() Function

The `[polygon()](https://www.w3schools.com/cssref/func_polygon.php)` function defines a polygon.

This function contains points that define the polygon. This can be a length or percentage value. Each point is a pair of x and y coordinates. 0 0 defines the left top corner and 100% 100% defines the right bottom corner.

The `polygon()` function is used within the `[clip-path](https://www.w3schools.com/cssref/css3_pr_clip-path.php)` property and the `[shape-outside](https://www.w3schools.com/cssref/css_pr_shape-outside.php)` property.

Here we clip an image to a polygon: 

![Pineapple](pineapple.jpg)
```javascript
img {  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);}
```

* * *

* * *

## CSS Properties and Functions

The following table lists the CSS properties and functions used in this chapter:

Property/Function

Description

[clip-path](https://www.w3schools.com/cssref/css3_pr_clip-path.php)

Lets you clip an element to a basic shape or to an SVG source

[shape-outside](https://www.w3schools.com/cssref/css_pr_shape-outside.php)

Lets you define a shape for the wrapping of the inline content

[circle()](https://www.w3schools.com/cssref/func_circle.php)

Defines a circle with a radius and a position

[ellipse()](https://www.w3schools.com/cssref/func_ellipse.php)

Defines an ellipse with two radii x and y

[polygon()](https://www.w3schools.com/cssref/func_polygon.php)

Defines a polygon