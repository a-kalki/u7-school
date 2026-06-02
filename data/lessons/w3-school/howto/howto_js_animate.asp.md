# How TO - JavaScript HTML Animations

* * *

Learn how to create animations using JavaScript.

* * *

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_animate_3)

* * *

## A Basic Web Page

To demonstrate how to create HTML animations with JavaScript, we can use a simple web page.

```javascript
<!DOCTYPE html><html><body><h1>My First JavaScript Animation</h1><div id ="myContainer">    <div id ="myAnimation">My animation will go here</div></div></body><html>
```

* * *

* * *

## Styling the Elements

To make an animation possible, the animated element must be animated relative to a "parent container".

The container element should be created with style = "position: relative".

The animation element should be created with style = "position: absolute".

```javascript
#myContainer {  width: 400px;  height: 400px;  position: relative;  background: yellow;}#myAnimation {  width: 50px;  height: 50px;  position: absolute;  background: red;}
```

* * *

## The Animation Code

JavaScript animations are done by programming gradual changes in an element's style.

The changes are called by a timer. When the timer interval is small, the animation looks continuous.

The basic code is:

```javascript
var id = setInterval(frame, 5);function frame() {  if (/* test for finished */) {    clearInterval(id);  } else {    /* code to change the element style */   }}
```

* * *

## Create the Animation Using JavaScript

```javascript
var id = null;function myMove() {  var elem = document.getElementById("myAnimation");  var pos = 0;  clearInterval(id);  id = setInterval(frame, 10);  function frame() {    if (pos == 350) {      clearInterval(id);    } else {      pos++;      elem.style.top = pos + 'px';      elem.style.left = pos + 'px';    }  }}
```