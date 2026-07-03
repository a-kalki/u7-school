# HTML  SVG Graphics

* * *

## SVG (Scalable Vector Graphics)

[SVG defines vector-based graphics in XML](https://www.w3schools.com/graphics/svg_intro.asp), which can be directly embedded in HTML pages.

SVG graphics are scalable, and do not lose any quality if they are zoomed or resized:

SVG Sorry, your browser does not support inline SVG.

SVG is supported by all major browsers.

* * *

## What is SVG?

*   SVG stands for Scalable Vector Graphics
*   SVG is used to define vector-based graphics for the Web
*   SVG defines graphics in XML format
*   Each element and attribute in SVG files can be animated
*   SVG is a W3C recommendation
*   SVG integrates with other standards, such as CSS, DOM, XSL and JavaScript

* * *

## The <svg> Element

The HTML `<svg>` element is a container for SVG graphics.

SVG has several methods for drawing paths, rectangles, circles, polygons, text, and much more.

* * *

## SVG Circle

Sorry, your browser does not support inline SVG.
```javascript
<!DOCTYPE html><html><body><svg width="100" height="100">  <circle cx="50" cy="50" r="40" stroke="green" stroke-width="4" fill="yellow" /></svg></body></html>
```

* * *

* * *

## SVG Rectangle

Sorry, your browser does not support inline SVG.
```javascript
<svg width="400" height="120">  <rect x="10" y="10" width="200" height="100" stroke="red" stroke-width="6" fill="blue" /></svg>
```

* * *

## SVG Rectangle with Opacity and Rounded Corners

Sorry, your browser does not support inline SVG.
```javascript
<svg width="400" height="180">  <rect x="50" y="20" rx="20" ry="20" width="150" height="150"  style="fill:red;stroke:black;stroke-width:5;opacity:0.5" /></svg>
```

* * *

## SVG Star

Sorry, your browser does not support inline SVG.
```javascript
<svg width="300" height="200">  <polygon points="100,10 40,198 190,78 10,78 160,198"  style="fill:lime;stroke:purple;stroke-width:5;fill-rule:evenodd;" /></svg>
```

* * *

## SVG Gradient Ellipse and Text

SVG Sorry, your browser does not support inline SVG.
```javascript
<svg height="130" width="500">  <defs>    <linearGradient id="grad1">      <stop offset="0%" stop-color="yellow" />      <stop offset="100%" stop-color="red" />    </linearGradient>  </defs>  <ellipse cx="100" cy="70" rx="85" ry="55" fill="url(#grad1)" />  <text fill="#ffffff" font-size="45" font-family="Verdana" x="50" y="86">SVG</text>  Sorry, your browser does not support inline SVG.</svg>
```

* * *

## Differences Between SVG and Canvas

SVG is a language for describing 2D graphics in XML, while Canvas draws 2D graphics, on the fly (with JavaScript).

SVG is XML based, which means that every element is available within the SVG DOM. You can attach JavaScript event handlers to SVG graphics.

In SVG, each drawn shape is remembered as an object. If attributes of an SVG object are changed, the browser can automatically re-render the shape.

Canvas is rendered pixel by pixel. In canvas, once the graphic is drawn, it is forgotten by the browser. If its position should be changed, the entire scene needs to be redrawn, including any objects that might have been covered by the graphic.

* * *

## Comparison of SVG and Canvas

The table below shows some important differences between Canvas and SVG:

SVG

Canvas

*   Resolution independent
*   Support for event handlers
*   Good text rendering capabilities
*   Slow rendering if complex
*   Not suited for game applications

*   Resolution dependent
*   No support for event handlers
*   Poor text rendering capabilities
*   You can save the resulting image as .png or .jpg
*   Well suited for graphic-intensive games

* * *

## SVG Tutorial

To learn more about SVG, please read our [SVG Tutorial](https://www.w3schools.com/graphics/svg_intro.asp).