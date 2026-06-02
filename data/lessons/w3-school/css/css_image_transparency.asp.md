# CSS Opacity

* * *

## CSS Image Opacity

The `[opacity](https://www.w3schools.com/cssref/css3_pr_opacity.php)` property specifies the opacity/transparency of an element.

The `opacity` property can take a value from 0.0 - 1.0:

*   0.0 - The element will be completely transparent
*   0.5 - The element will be 50% transparent
*   1.0 - Default. The element will be fully opaque

![Forest](img_forest.jpg)

opacity 0.2

![Forest](img_forest.jpg)

opacity 0.5

![Forest](img_forest.jpg)

opacity 1.0  
(default)

```javascript
img {  opacity: 0.5;}
```

* * *

## Opacity and :hover

The `[opacity](https://www.w3schools.com/cssref/css3_pr_opacity.php)` property is often used with `[:hover](https://www.w3schools.com/cssref/sel_hover.php)` to change the opacity on mouse-over:

![Northern Lights](img_lights.jpg)

![Mountains](img_mountains.jpg)

![Italy](img_5terre.jpg)

```javascript
img {  opacity: 0.5;}img:hover {  opacity: 1.0;}
```

### Reversed Hover Effect

Here is an example of reversed hover effect:

![Northern Lights](img_lights.jpg)

![Mountains](img_mountains.jpg)

![Italy](img_5terre.jpg)

```javascript
img:hover {  opacity: 0.5;}
```

* * *

* * *

## Transparent Boxes

When using the `[opacity](https://www.w3schools.com/cssref/css3_pr_opacity.php)` property to add transparency to the background of an element, all child elements inherit the same transparency. This can make the text inside a transparent element hard to read:

opacity 1

opacity 0.6

opacity 0.3

opacity 0.1

```javascript
div {  opacity: 0.3;}
```

* * *

## Transparency using background-color

To NOT apply the transparency to child elements, you can use the `[background-color](https://www.w3schools.com/cssref/pr_background-color.php)` property with an RGBA value.

RGBA color values are an extension of RGB color values with an alpha channel - which specifies the opacity for a color.

An RGBA color value is specified with: rgba(red, green, blue, alpha). Where the alpha parameter is a number between 0.0 (fully transparent) and 1.0 (fully opaque).

**Tip:** You will learn more about RGBA Colors in our [CSS Colors Chapter](css3_colors.asp.html).

The following example sets the opacity for the background color and not the text:

100% opacity

60% opacity

30% opacity

10% opacity

```javascript
div {  background: rgba(4, 170, 109, 0.3) /* Green background with 30% opacity */}
```

* * *

## Text in Transparent Box

This is some text that is placed in the transparent box.

```javascript
<html><head><style>div.background {  background: url(klematis.jpg) repeat;  border: 2px solid black;}div.transbox {  margin: 30px;  background-color: rgba(255, 255, 255, 0.6);  border: 1px solid black;}div.transbox p {  margin: 5%;  font-weight: bold;  color: #000000;}</style></head><body><div class="background">  <div class="transbox">    <p>This is some text that is placed in the transparent box.</p>  </div></div></body></html>
```

### Example explained

*   Create a <div> element (class="background") with a background image, and a border.
*   Create another <div> (class="transbox") inside the first <div>.
*   The <div class="transbox"> have a 0.6 transparent background color, and a border.
*   Inside the transparent <div>, we add some text inside a <p> element.

* * *

* * *

## CSS Property

Property

Description

[opacity](https://www.w3schools.com/cssref/css3_pr_opacity.php)

Sets the opacity level for an element