# HTML Canvas Graphics

* * *

Your browser does not support the <canvas> element.

The HTML `<canvas>` element is used to draw graphics on a web page.

The graphic to the left is created with `<canvas>`. It shows four elements: a red rectangle, a gradient rectangle, a multicolor rectangle, and a multicolor text.

* * *

## What is HTML Canvas?

The HTML `<canvas>` element is used to draw graphics, on the fly, via JavaScript.

The `<canvas>` element is only a container for graphics. You must use JavaScript to actually draw the graphics.

Canvas has several methods for drawing paths, boxes, circles, text, and adding images.

Canvas is supported by all major browsers.

* * *

## Canvas Examples

A canvas is a rectangular area on an HTML page. By default, a canvas has no border and no content.

The markup looks like this:

<canvas id="myCanvas" width="200" height="100"></canvas>

**Note:** Always specify an `id` attribute (to be referred to in a script), and a `width` and `height` attribute to define the size of the canvas. To add a border, use the `style` attribute.

Here is an example of a basic, empty canvas:

Your browser does not support the canvas element.

```javascript
<canvas id="myCanvas" width="200" height="100" style="border:1px solid #000000;"></canvas>
```

* * *

* * *

## Add a JavaScript

After creating the rectangular canvas area, you must add a JavaScript to do the drawing.

Here are some examples:

### Draw a Line

Your browser does not support the canvas element

```javascript
<script>var c = document.getElementById("myCanvas");var ctx = c.getContext("2d");ctx.moveTo(0, 0);ctx.lineTo(200, 100);ctx.stroke();</script>
```

* * *

## Draw a Circle

Your browser does not support the canvas element

```javascript
<script>var c = document.getElementById("myCanvas");var ctx = c.getContext("2d");ctx.beginPath();ctx.arc(95, 50, 40, 0, 2 * Math.PI);ctx.stroke();</script>
```

* * *

## Draw a Text

Your browser does not support the canvas element

```javascript
<script>var c = document.getElementById("myCanvas");var ctx = c.getContext("2d");ctx.font = "30px Arial";ctx.fillText("Hello World", 10, 50);</script>
```

* * *

## Stroke Text

Your browser does not support the canvas element

```javascript
<script>var c = document.getElementById("myCanvas");var ctx = c.getContext("2d");ctx.font = "30px Arial";ctx.strokeText("Hello World", 10, 50);</script>
```

* * *

## Draw Linear Gradient

Your browser does not support the canvas element

```javascript
<script>var c = document.getElementById("myCanvas");var ctx = c.getContext("2d");// Create gradientvar grd = ctx.createLinearGradient(0, 0, 200, 0);grd.addColorStop(0, "red");grd.addColorStop(1, "white");// Fill with gradientctx.fillStyle = grd;ctx.fillRect(10, 10, 150, 80);</script>
```

* * *

## Draw Circular Gradient

Your browser does not support the canvas element

```javascript
<script>var c = document.getElementById("myCanvas");var ctx = c.getContext("2d");// Create gradientvar grd = ctx.createRadialGradient(75, 50, 5, 90, 60, 100);grd.addColorStop(0, "red");grd.addColorStop(1, "white");// Fill with gradientctx.fillStyle = grd;ctx.fillRect(10, 10, 150, 80);</script>
```

* * *

## Draw Image

```javascript
<script>var c = document.getElementById("myCanvas");var ctx = c.getContext("2d");var img = document.getElementById("scream");ctx.drawImage(img, 10, 10);</script>
```

* * *

## HTML Canvas Tutorial

To learn more about `<canvas>`, please read our [HTML Canvas Tutorial](https://www.w3schools.com/graphics/canvas_intro.asp).