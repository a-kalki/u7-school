# CSS  Colors

* * *

CSS supports [140+ color names, HEX values, RGB values](css_colors.asp.html), RGBA values, HSL values, HSLA values, and opacity.

* * *

## RGBA Colors

RGBA color values are an extension of [RGB colors](css_colors_rgb.asp.html) with an alpha channel - which specifies the opacity for a color.

An RGBA color value is specified with:

rgba(_red,_ _green_, _blue, alpha_)

 The alpha parameter is a number between 0.0 (fully transparent) and 1.0 (fully opaque).

rgba(255, 0, 0, 0.2);

rgba(255, 0, 0, 0.4);

rgba(255, 0, 0, 0.6);

rgba(255, 0, 0, 0.8);

The following example defines different RGBA colors:

```javascript
#p1 {background-color: rgba(255, 0, 0, 0.3);}  /* red with opacity */#p2 {background-color: rgba(0, 255, 0, 0.3);}  /* green with opacity */#p3 {background-color: rgba(0, 0, 255, 0.3);}  /* blue with opacity */
```

* * *

* * *

## HSLA Colors

HSLA color values are an extension of [HSL colors](css_colors_hsl.asp.html) with an alpha channel - which specifies the opacity for a color.

An HSLA color value is specified with:

hsla(_hue,_ _saturation_, _lightness, alpha_)

The alpha parameter is a number between 0.0 (fully transparent) and 1.0 (fully opaque):

hsla(0, 100%, 30%, 0.3);

hsla(0, 100%, 50%, 0.3);

hsla(0, 100%, 70%, 0.3);

hsla(0, 100%, 90%, 0.3);

The following example defines different HSLA colors:

```javascript
#p1 {background-color: hsla(120, 100%, 50%, 0.3);}  /* green with opacity */#p2 {background-color: hsla(120, 100%, 75%, 0.3);}  /* light green with opacity */#p3 {background-color: hsla(120, 100%, 25%, 0.3);}  /* dark green with opacity */#p4 {background-color: hsla(120, 60%, 70%, 0.3);}   /* pastel green with opacity */
```

* * *

## CSS opacity Property

The `[opacity](https://www.w3schools.com/cssref/css3_pr_opacity.php)` property sets the opacity for the whole element (both background color and text will be opaque/transparent).

The `opacity` property value must be a number between 0.0 (fully transparent) and 1.0 (fully opaque).

rgb(255, 0, 0);opacity:0.2;

rgb(255, 0, 0);opacity:0.4;

rgb(255, 0, 0);opacity:0.6;

rgb(255, 0, 0);opacity:0.8;

**Notice** that the text inside the element will also be transparent/opaque!

The following example shows different elements with opacity:

```javascript
#p1 {background-color:rgb(255,0,0);opacity:0.6;}  /* red with opacity */#p2 {background-color:rgb(0,255,0);opacity:0.6;}  /* green with opacity */#p3 {background-color:rgb(0,0,255);opacity:0.6;}  /* blue with opacity */
```

* * *

* * *