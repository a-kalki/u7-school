# How TO - Menu Icon

* * *

Learn how to create a menu icon with CSS.

* * *

## How To Create a Menu Icon

If you are not using an icon library, you can create a basic menu icon with CSS:

Menu Icon:

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_menu_icon)

Animated Menu Icon (click on it):

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_menu_icon_js)

* * *

##### Step 1) Add HTML:

```javascript
<div></div><div></div><div></div>
```

##### Step 2) Add CSS:

```javascript
div {  width: 35px;  height: 5px;  background-color: black;  margin: 6px 0;}
```

### Example Explained

The `width` and the `height` property specifies the width and height of each bar.

We have added a black `background-color`, and the top and bottom `margin` is used to create some distance between each bar.

* * *

* * *

## Animated Icon

Use CSS and JavaScript to change the menu icon to a "cancel/remove" icon when it is clicked on:

##### Step 1) Add HTML:

```javascript
<div class="container" onclick="myFunction(this)">  <div class="bar1"></div>  <div class="bar2"></div>  <div class="bar3"></div></div>
```

##### Step 2) Add CSS:

```javascript
.container {  display: inline-block;  cursor: pointer;}.bar1, .bar2, .bar3 {  width: 35px;  height: 5px;  background-color: #333;  margin: 6px 0;  transition: 0.4s;}/* Rotate first bar */.change .bar1 {  transform: translate(0, 11px) rotate(-45deg);}/* Fade out the second bar */.change .bar2 {opacity: 0;}/* Rotate last bar */.change .bar3 {  transform: translate(0, -11px) rotate(45deg);}
```

##### Step 3) Add JavaScript:

```javascript
function myFunction(x) {  x.classList.toggle("change");}
```

### Example Explained

HTML & CSS: We use the same styles as before, only this time, we wrap a container element around each <div> element and we specify a class name for each.

The container element is used to show a pointer symbol when the user moves the mouse over the divs (bars). When it is clicked on, it will execute a JavaScript function that adds a new class name to it, which will change the styles of each horizontal bar: the first and the last bar is transformed and rotated to the letter "x". The bar in the middle fades out and becomes invisible.