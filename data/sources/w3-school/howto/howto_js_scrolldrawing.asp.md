# How TO - Scroll Drawing

* * *

Learn how to draw on scroll using JavaScript and SVG.

* * *

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_svg_scrolldrawing)

* * *

## Scroll Drawing

Using SVG and JavaScript to draw a triangle on scroll - note that it has to be a <path> element:

```javascript
<svg id="mySVG">  <path fill="none" stroke="red" stroke-width="3" id="triangle" d="M150 0 L75 200 L225 200 Z"/></svg><script>// Get the id of the <path> element and the length of <path>var triangle = document.getElementById("triangle");var length = triangle.getTotalLength();// The start position of the drawingtriangle.style.strokeDasharray = length;// Hide the triangle by offsetting dash. Remove this line to show the triangle before scroll drawtriangle.style.strokeDashoffset = length;// Find scroll percentage on scroll (using cross-browser properties), and offset dash same amount as percentage scrolledwindow.addEventListener("scroll", myFunction);function myFunction() {  var scrollpercent = (document.body.scrollTop + document.documentElement.scrollTop) / (document.documentElement.scrollHeight - document.documentElement.clientHeight);  var draw = length * scrollpercent;  // Reverse the drawing (when scrolling upwards)  triangle.style.strokeDashoffset = length - draw;}</script>
```

**Tip:** [Learn more about SVG in our SVG Tutorial](https://www.w3schools.com/graphics/svg_intro.asp).

* * *

* * *