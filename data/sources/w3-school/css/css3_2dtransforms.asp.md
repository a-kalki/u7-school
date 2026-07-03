# CSS 2D Transforms

* * *

## CSS 2D Transforms

The CSS `[transform](https://www.w3schools.com/cssref/css3_pr_transform.php)` property applies a 2D or 3D transformation to an element. This property allows you to rotate, scale, move, and skew elements.

Mouse over the element below to see a 2D transformation:

2D rotate

* * *

## CSS 2D Transforms Functions

With the CSS `[transform](https://www.w3schools.com/cssref/css3_pr_transform.php)` property you can use the following 2D transformation functions:

*   `[translate()](https://www.w3schools.com/cssref/func_translate.php)`
*   `[rotate()](https://www.w3schools.com/cssref/func_rotate.php)`
*   `[scaleX()](https://www.w3schools.com/cssref/func_scalex.php)`
*   `[scaleY()](https://www.w3schools.com/cssref/func_scaley.php)`
*   `[scale()](https://www.w3schools.com/cssref/func_scale.php)`
*   `[skewX()](https://www.w3schools.com/cssref/func_skewx.php)`
*   `[skewY()](https://www.w3schools.com/cssref/func_skewy.php)`
*   `[skew()](https://www.w3schools.com/cssref/func_skew.php)`
*   `[matrix()](https://www.w3schools.com/cssref/func_matrix.php)`

* * *

## The CSS translate() Function

The `[translate()](https://www.w3schools.com/cssref/func_translate.php)` function moves an element from its current position (according to the parameters given for the X-axis and the Y-axis).

The following example moves the <div> element 50 pixels to the right, and 100 pixels down from its current position:

![Translate](transform_translate.gif)

```javascript
div {  transform: translate(50px, 100px);}
```

* * *

## The CSS rotate() Function

The `[rotate()](https://www.w3schools.com/cssref/func_rotate.php)` function rotates an element clockwise or counter-clockwise according to a given degree.

The following example rotates the <div> element clockwise with 20 degrees:

![Rotate](transform_rotate.gif)
```javascript
div {  transform: rotate(20deg);}
```

Using negative values will rotate the element counter-clockwise.

The following example rotates the <div> element counter-clockwise with 20 degrees:

```javascript
div {  transform: rotate(-20deg);}
```

* * *

* * *

* * *

## CSS Transform Properties

The following table lists all the 2D transform properties:

Property

Description

[transform](https://www.w3schools.com/cssref/css3_pr_transform.php)

Applies a 2D or 3D transformation to an element

[transform-origin](https://www.w3schools.com/cssref/css3_pr_transform-origin.php)

Allows you to change the position on transformed elements

## CSS 2D Transform Functions

Function

Description

[matrix()](https://www.w3schools.com/cssref/func_matrix.php)

Defines a 2D transformation, using a matrix of six values

[translate()](https://www.w3schools.com/cssref/func_translate.php)

Defines a 2D translation, moving the element along the X- and the Y-axis

[translateX()](https://www.w3schools.com/cssref/func_translatex.php)

Defines a 2D translation, moving the element along the X-axis

[translateY()](https://www.w3schools.com/cssref/func_translatey.php)

Defines a 2D translation, moving the element along the Y-axis

[scale()](https://www.w3schools.com/cssref/func_scale.php)

Defines a 2D scale transformation, scaling the elements width and height

[scaleX()](https://www.w3schools.com/cssref/func_scalex.php)

Defines a 2D scale transformation, scaling the element's width

[scaleY()](https://www.w3schools.com/cssref/func_scaley.php)

Defines a 2D scale transformation, scaling the element's height

[rotate()](https://www.w3schools.com/cssref/func_rotate.php)

Defines a 2D rotation, the angle is specified in the parameter

[skew()](https://www.w3schools.com/cssref/func_skew.php)

Defines a 2D skew transformation along the X- and the Y-axis

[skewX()](https://www.w3schools.com/cssref/func_skewx.php)

Defines a 2D skew transformation along the X-axis

[skewY()](https://www.w3schools.com/cssref/func_skewy.php)

Defines a 2D skew transformation along the Y-axis