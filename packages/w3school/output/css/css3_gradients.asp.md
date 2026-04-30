# CSS Gradients

* * *

## CSS Gradients

The CSS gradient functions let you display smooth transitions between two or more colors within an element.

CSS defines three types of gradients:

*   **Linear Gradients** - The color transition goes down, up, left, right, or diagonally
*   **Radial Gradients** - The color transition goes out from a central point
*   **Conic Gradients** - The color transition is rotated around a center point

The CSS gradient functions are used within the `[background-image](https://www.w3schools.com/cssref/pr_background-image.php)` property.

A Linear Gradient Background

* * *

## CSS linear-gradient() Function

The CSS `[linear-gradient()](https://www.w3schools.com/cssref/func_linear-gradient.php)` function creates a linear gradient.

A linear gradient defines a color transition that goes in a straight line, it can go down, up, to left, to right, or diagonally.

A linear gradient requires at least two color stops. Color stops are the colors you want to render smooth transitions among. You can also set a starting point and a direction (or an angle) along with the gradient effect.

### Syntax

background-image: linear-gradient(_direction_, _color-stop1_, _color-stop2, ..._);

### Direction - Top to Bottom (this is default)

The following example shows a linear gradient that goes from top to bottom. It starts red, transitioning to yellow:

top to bottom (default)

```javascript
#grad {  background-image: linear-gradient(to bottom, red, yellow);}
```

### Direction - Bottom to Top

The following example shows a linear gradient that goes from bottom to top. It starts red, transitioning to yellow:

bottom to top

```javascript
#grad {  background-image: linear-gradient(to top, red, yellow);}
```

### Direction - Left to Right

The following example shows a linear gradient that goes from left to right. It starts red, transitioning to yellow:

left to right

```javascript
#grad {  background-image: linear-gradient(to right, red , yellow);}
```

### Direction - Diagonal

The following example shows a linear gradient that goes from top-left to bottom-right. It starts red, transitioning to yellow:

top left to bottom right

```javascript
#grad {  background-image: linear-gradient(to bottom right, red, yellow);}
```

* * *

* * *

## Linear Gradient - Using Angles

If you want more control over the direction of the gradient, you can define an `angle` parameter, instead of the predefined directions (to bottom, to top, to right, to left, to bottom right, etc.).

*   A value of 0deg is equivalent to "to top".
*   A value of 90deg is equivalent to "to right".
*   A value of 180deg is equivalent to "to bottom".
*   A value of 270deg equivalent to "to left"

### Syntax

background-image: linear-gradient(_angle_, _color-stop1_, _color-stop2_);

The following example shows how to use angles on linear gradients:

180deg

```javascript
#grad {  background-image: linear-gradient(180deg, red, yellow);}
```

* * *

## Linear Gradient - Multiple Color Stops

The following example shows a linear gradient (from top to bottom) with multiple color stops:

```javascript
#grad {  background-image: linear-gradient(red, yellow, green);}
```

The following example shows a linear gradient (from left to right) with the color of the rainbow and some text:

Rainbow Background

```javascript
#grad {  background-image: linear-gradient(to right, red,orange,yellow,green,blue,indigo,violet);}
```

* * *

## Linear Gradient - Transparency 

CSS gradients also support transparency, which can be used to create fading effects.

To add transparency, we use the rgba() function to define the color stops. The last parameter in the rgba() function can be a value from 0 to 1, and it defines the transparency of the color: 0 indicates full transparency, 1 indicates full color (no transparency).

The following example shows a linear gradient that goes from left to right. It starts fully transparent, transitioning to full color red:

```javascript
#grad {  background-image: linear-gradient(to right, rgba(255,0,0,0), rgba(255,0,0,1));}
```

* * *

## CSS repeating-linear-gradient() Function

The CSS `[repeating-linear-gradient()](https://www.w3schools.com/cssref/func_repeating-linear-gradient.php)` function is used to repeat linear gradients:

```javascript
#grad {  background-image: repeating-linear-gradient(red, yellow 10%, green 20%);}
```

* * *

* * *