# CSS Outline

* * *

## CSS Outline

An outline is a line that is drawn around elements, OUTSIDE the borders, to make the element "stand out".

This element has a black border and a green outline with a width of 5px.

  
[Try it Yourself »](https://www.w3schools.com/css/tryit.asp?filename=trycss_outline_intro)

**Note:** Outline differs from [borders](css_border.asp.html)! The outline is drawn outside the element's border, and may overlap other content. Also, the outline is NOT a part of the element's dimensions; the element's total width and height is not affected by the width of the outline.

CSS has the following outline properties:

*   `[outline-style](https://www.w3schools.com/cssref/pr_outline-style.php)` - Specifies the style of the outline
*   `[outline-color](https://www.w3schools.com/cssref/pr_outline-color.php)` - Specifies the color of the outline
*   `[outline-width](https://www.w3schools.com/cssref/pr_outline-width.php)` - Specifies the width of the outline
*   `[outline-offset](https://www.w3schools.com/cssref/pr_outline-offset.php)` - Adds space between the outline and the edge/border of an element
*   `[outline](https://www.w3schools.com/cssref/pr_outline.php)` - A shorthand property

* * *

* * *

## CSS The outline-style Property

The `[outline-style](https://www.w3schools.com/cssref/pr_outline-style.php)` property specifies the style of the outline, and can have one of the following values:

*   `dotted` - Defines a dotted outline
*   `dashed` - Defines a dashed outline
*   `solid` - Defines a solid outline
*   `double` - Defines a double outline
*   `groove` - Defines a 3D grooved outline
*   `ridge` - Defines a 3D ridged outline
*   `inset` - Defines a 3D inset outline
*   `outset` - Defines a 3D outset outline
*   `none` - Defines no outline
*   `hidden` - Defines a hidden outline

The following example shows the different `[outline-style](https://www.w3schools.com/cssref/pr_outline-style.php)` values:

```javascript
p.dotted {outline-style: dotted;}p.dashed {outline-style: dashed;}p.solid {outline-style: solid;}p.double {outline-style: double;}p.groove {outline-style: groove;}p.ridge {outline-style: ridge;}p.inset {outline-style: inset;}p.outset {outline-style: outset;}
```

**Note:** None of the other outline properties (which you will learn more about in the next chapters) will have ANY effect unless the `[outline-style](https://www.w3schools.com/cssref/pr_outline-style.php)` property is set!

* * *

* * *