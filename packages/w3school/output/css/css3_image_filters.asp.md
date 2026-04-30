# CSS Image Filter Effects

* * *

## CSS Filters

The CSS `[filter](https://www.w3schools.com/cssref/css3_pr_filter.php)` property is used to add visual effects (like blur and saturation) to elements.

Within the filter property, you can use the following CSS functions:

*   `blur()`
*   `brightness()`
*   `contrast()`
*   `drop-shadow()`
*   `grayscale()`
*   `hue-rotate()`
*   `invert()`
*   `opacity()`
*   `saturate()`
*   `sepia()`

* * *

## The CSS blur() Function

The `[blur()](https://www.w3schools.com/cssref/func_blur.php)` filter function applies a blur effect to an element. A larger value will create more blur.

If no value is specified, 0 is used (no effect).

```javascript
#img1 {  filter: blur(2px);}#img2 {  filter: blur(6px);}
```

* * *

* * *

## The CSS brightness() Function

The `[brightness()](https://www.w3schools.com/cssref/func_brightness.php)` filter function adjusts the brightness of an element.

*   100% is default, and represents the original brightness
*   Values over 100% will provide brighter results
*   Values under 100% will provide darker results
*   0% will make the image completely black

```javascript
#img1 {  filter: brightness(150%);}#img2 {  filter: brightness(50%);}
```

* * *

## The CSS contrast() Function

The `[contrast()](https://www.w3schools.com/cssref/func_contrast.php)` filter function adjusts the contrast of an element.

*   100% is default, and represents the original contrast
*   Values over 100% increases the contrast
*   Values under 100% decreases the contrast
*   0% will make the image completely gray

```javascript
#img1 {  filter: contrast(150%);}#img2 {  filter: contrast(50%);}
```

* * *

## The CSS drop-shadow() Function

The `[drop-shadow()](https://www.w3schools.com/cssref/func_drop-shadow.php)` filter function applies a drop-shadow effect to an image.

```javascript
#img1 {  filter: drop-shadow(8px 8px 10px gray);}#img2 {  filter: drop-shadow(10px 10px 7px lightblue);}
```

* * *

## The CSS grayscale() Function

The `[grayscale()](https://www.w3schools.com/cssref/func_grayscale.php)` filter function converts an image to grayscale.

*   100% (or 1) will make the image completely grayscale
*   0% (or 0) will have no effect

```javascript
#img1 {  filter: grayscale(1);}#img2 {  filter: grayscale(60%);}#img3 {  filter: grayscale(0.4);}
```

* * *

## The CSS hue-rotate() Function

The `[hue-rotate()](https://www.w3schools.com/cssref/func_hue-rotate.php)` filter function applies a color rotation to an element.

This function applies a hue rotation on the image. The value defines the number of degrees around the color circle the image will be adjusted. A positive hue rotation increases the hue value, while a negative rotation decreases the hue value. 0deg represents the original image.

```javascript
#img1 {  filter: hue-rotate(200deg);}#img2 {  filter: hue-rotate(90deg);}#img3 {  filter: hue-rotate(-90deg);}
```

* * *

## The CSS invert() Function

The `[invert()](https://www.w3schools.com/cssref/func_invert.php)` filter function inverts the color of an image.

*   100% (or 1) will fully invert the colors
*   0% (or 0) will have no effect

```javascript
#img1 {  filter: invert(0.3);}#img2 {  filter: invert(70%);}#img3 {  filter: invert(100%);}
```

* * *

## The CSS opacity() Function

The `[opacity()](https://www.w3schools.com/cssref/func_opacity.php)` filter function applies an opacity effect to an element.

*   100% (or 1) will have no effect
*   50% (or 0.5) will make the element 50% transparent
*   0% (or 0) will make the element completely transparent

```javascript
#img1 {  filter: opacity(80%);}#img2 {  filter: opacity(50%);}#img3 {  filter: opacity(0.2);}
```

* * *

## The CSS saturate() Function

The `[saturate()](https://www.w3schools.com/cssref/func_saturate.php)` filter function adjusts the saturation (color intensity) of an element.

*   100% (or 1) will have no effect
*   0% (or 0) will make the element completely unsaturated
*   200% (or 2) will make the element super saturated

```javascript
#img1 {  filter: saturate(0);}#img2 {  filter: saturate(100%);}#img3 {  filter: saturate(200%);}
```

* * *

## The CSS sepia() Function

The `[sepia()](https://www.w3schools.com/cssref/func_sepia.php)` filter function converts an image to a sepia tone (a warmer, more brown/yellow color).

*   0% (or 0) will have no effect
*   100% (or 1) applies full sepia effect

```javascript
#img1 {  filter: sepia(1);}#img2 {  filter: sepia(60%);}#img3 {  filter: sepia(0.4);}
```

* * *

* * *

## CSS Filter Functions

The following table lists the CSS filter functions:

Function

Description

[blur()](https://www.w3schools.com/cssref/func_blur.php)

Applies a blur effect to an element

[brightness()](https://www.w3schools.com/cssref/func_brightness.php)

Adjusts the brightness of an element

[contrast()](https://www.w3schools.com/cssref/func_contrast.php)

Adjusts the contrast of an element

[drop-shadow()](https://www.w3schools.com/cssref/func_drop-shadow.php)

Applies a drop-shadow effect to an image

[grayscale()](https://www.w3schools.com/cssref/func_grayscale.php)

Converts an image to grayscale

[hue-rotate()](https://www.w3schools.com/cssref/func_hue-rotate.php)

Applies a color rotation to an element

[invert()](https://www.w3schools.com/cssref/func_invert.php)

Inverts the color of an image

[opacity()](https://www.w3schools.com/cssref/func_opacity.php)

Applies an opacity effect to an element

[saturate()](https://www.w3schools.com/cssref/func_saturate.php)

Adjusts the saturation (color intensity) of an element

[sepia()](https://www.w3schools.com/cssref/func_sepia.php)

Converts an image to sepia