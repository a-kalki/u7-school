# CSS Masking

* * *

## The CSS mask-image Property

CSS masking allows you to create a mask layer to place over an element to partially or fully hide portions of the element.

The CSS `[mask-image](https://www.w3schools.com/cssref/css3_pr_mask-image.php)` property specifies a mask layer image.

The mask layer image can be a PNG image, an SVG image, a [CSS gradient](css3_gradients.asp.html), or an [SVG <mask> element](https://www.w3schools.com/graphics/svg_intro.asp).

* * *

## Use a PNG Image as the Mask Layer

To use a PNG image as the mask layer, use a url() value to pass in the mask layer image.

The mask image needs to have a transparent or semi-transparent area. Black indicates fully transparent.

Here is the mask image ("w3logo.png") we will use:

![W3Schools.com](w3logo.png)

Here is an image from Cinque Terre, in Italy:

![Cinque Terre](img_5terre.jpg)

Now, we apply the mask image as the mask layer for the image from Cinque Terre, Italy:

![Cinque Terre](img_5terre.jpg)
```javascript
.mask1 {  -webkit-mask-image: url(w3logo.png);  mask-image: url(w3logo.png);  mask-repeat: no-repeat;}
```

The `[mask-image](https://www.w3schools.com/cssref/css3_pr_mask-image.php)` property specifies the image to be used as a mask layer for an element.

The `[mask-repeat](https://www.w3schools.com/cssref/css3_pr_mask-repeat.php)` property specifies if or how a mask image will be repeated. The `no-repeat` value indicates that the mask image will not be repeated (the mask image will only be shown once).

* * *

* * *

## Repeat the Mask Layer Image

If we omit the `[mask-repeat](https://www.w3schools.com/cssref/css3_pr_mask-repeat.php)` property, the mask image will be repeated all over the image from Cinque Terre, Italy:

![Cinque Terre](img_5terre.jpg)
```javascript
.mask1 {  -webkit-mask-image: url(w3logo.png);  mask-image: url(w3logo.png);}
```

* * *

## Position the Mask Layer Image

The `[mask-position](https://www.w3schools.com/cssref/css3_pr_mask-position.php)` property sets the starting position of a mask image (relative to the mask position area). By default, a mask image is placed at the top-left corner of an element, and repeated both vertically and horizontally.

Here, we position the mask image in center:

![Cinque Terre](img_5terre.jpg)
```javascript
.mask1 {  -webkit-mask-image: url(w3logo.png);  mask-image: url(w3logo.png);  mask-repeat: no-repeat;  mask-position: center;}
```

* * *

## CSS All Masking Properties

The following table lists all the CSS masking properties:

Property

Description

[mask-clip](https://www.w3schools.com/cssref/css3_pr_mask-clip.php)

Specifies which area is affected by a mask image

[mask-composite](https://www.w3schools.com/cssref/css3_pr_mask-composite.php)

Specifies a compositing operation used on the current mask layer with the mask layers below it

[mask-image](https://www.w3schools.com/cssref/css3_pr_mask-image.php)

Specifies an image to be used as a mask layer for an element

[mask-mode](https://www.w3schools.com/cssref/css3_pr_mask-mode.php)

Specifies whether the mask layer image is treated as a luminance mask or as an alpha mask

[mask-origin](https://www.w3schools.com/cssref/css3_pr_mask-origin.php)

Specifies the origin position (the mask position area) of a mask layer image

[mask-position](https://www.w3schools.com/cssref/css3_pr_mask-position.php)

Sets the starting position of a mask layer image (relative to the mask position area)

[mask-repeat](https://www.w3schools.com/cssref/css3_pr_mask-repeat.php)

Specifies how the mask layer image is repeated

[mask-size](https://www.w3schools.com/cssref/css3_pr_mask-size.php)

Specifies the size of a mask layer image

[mask-type](https://www.w3schools.com/cssref/css3_pr_mask-type.php)

Specifies whether an SVG <mask> element is treated as a luminance mask or as an alpha mask