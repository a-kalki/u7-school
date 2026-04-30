# CSS 3D Transforms

* * *

## CSS 3D Transforms

The CSS `[transform](https://www.w3schools.com/cssref/css3_pr_transform.php)` property applies a 2D or 3D transformation to an element. This property allows you to rotate, scale, move, and skew elements.

Mouse over the elements below to see the difference between a 2D and a 3D transformation:

2D rotate

3D rotate

* * *

## CSS 3D Transforms Functions

With the CSS `[transform](https://www.w3schools.com/cssref/css3_pr_transform.php)` property you can use the following 3D transformation functions:

*   `[rotateX()](https://www.w3schools.com/cssref/func_rotatex.php)`
*   `[rotateY()](https://www.w3schools.com/cssref/func_rotatey.php)`
*   `[rotateZ()](https://www.w3schools.com/cssref/func_rotatez.php)`

* * *

## The CSS rotateX() Function

The `[rotateX()](https://www.w3schools.com/cssref/func_rotatex.php)` function rotates an element around its X-axis at a given degree:

![Rotate X](transform_rotatex.gif)

```javascript
#myDiv {  transform: rotateX(150deg);}
```

* * *

* * *

## The CSS rotateY() Function

The `[rotateY()](https://www.w3schools.com/cssref/func_rotatey.php)` function rotates an element around its Y-axis at a given degree:

![Rotate Y](transform_rotatey.gif)

```javascript
#myDiv {  transform: rotateY(150deg);}
```

* * *

## The CSS rotateZ() Function

The `[rotateZ()](https://www.w3schools.com/cssref/func_rotatez.php)` function rotates an element around its Z-axis at a given degree:

```javascript
#myDiv {  transform: rotateZ(90deg);}
```

* * *

* * *

## CSS Transform Properties

The following table lists all the 3D transform properties:

Property

Description

[transform](https://www.w3schools.com/cssref/css3_pr_transform.php)

Applies a 2D or 3D transformation to an element

[transform-origin](https://www.w3schools.com/cssref/css3_pr_transform-origin.php)

Allows you to change the position on transformed elements

[transform-style](https://www.w3schools.com/cssref/css3_pr_transform-style.php)

Specifies how nested elements are rendered in 3D space

[perspective](https://www.w3schools.com/cssref/css3_pr_perspective.php)

Specifies the perspective on how 3D elements are viewed

[perspective-origin](https://www.w3schools.com/cssref/css3_pr_perspective-origin.php)

Specifies the bottom position of 3D elements

[backface-visibility](https://www.w3schools.com/cssref/css3_pr_backface-visibility.php)

Defines whether or not an element should be visible when not facing the screen

## CSS 3D Transform Functions

Function

Description

[matrix3d()](https://www.w3schools.com/cssref/func_matrix3d.php)

Defines a 3D transformation, using a 4x4 matrix of 16 values

translate3d()

Defines a 3D translation

translateZ()

Defines a 3D translation, using only the value for the Z-axis

[scale3d()](https://www.w3schools.com/cssref/func_scale3d.php)

Defines a 3D scale transformation

scaleZ()

Defines a 3D scale transformation by giving a value for the Z-axis

[rotate3d()](https://www.w3schools.com/cssref/func_rotate3d.php)

Defines a 3D rotation

[rotateX()](https://www.w3schools.com/cssref/func_rotatex.php)

Defines a 3D rotation along the X-axis

[rotateY()](https://www.w3schools.com/cssref/func_rotatey.php)

Defines a 3D rotation along the Y-axis

[rotateZ()](https://www.w3schools.com/cssref/func_rotatez.php)

Defines a 3D rotation along the Z-axis

[perspective()](https://www.w3schools.com/cssref/func_perspective.php)

Defines a perspective view for a 3D transformed element