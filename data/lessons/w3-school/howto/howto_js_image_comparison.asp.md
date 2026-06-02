# How TO - Image Comparison Slider

* * *

Learn how to create a slider that compares two images.

* * *

## Image Comparison Slider

Move the blue slider to compare images:

![](img_snow.jpg)

![](img_forest.jpg)

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_image_compare)

* * *

## Create an Image Comparison Slider

##### Step 1) Add HTML:

```javascript
<div class="img-comp-container">  <div class="img-comp-img">    <img src="img_snow.jpg" width="300" height="200">  </div>  <div class="img-comp-img img-comp-overlay">    <img src="img_forest.jpg" width="300" height="200">  </div></div>
```

* * *

##### Step 2) Add CSS:

The container must have a "relative" positioning.

```javascript
* {box-sizing: border-box;}.img-comp-container {  position: relative;  height: 200px; /*should be the same height as the images*/}.img-comp-img {  position: absolute;  width: auto;  height: auto;  overflow: hidden;}.img-comp-img img {  display: block;  vertical-align: middle;}.img-comp-slider {  position: absolute;  z-index: 9;  cursor: ew-resize;  /*set the appearance of the slider:*/  width: 40px;  height: 40px;  background-color: #2196F3;  opacity: 0.7;  border-radius: 50%;}
```

* * *

* * *

##### Step 3) Add JavaScript:

```javascript
function initComparisons() {  var x, i;  /* Find all elements with an "overlay" class: */  x = document.getElementsByClassName("img-comp-overlay");  for (i = 0; i < x.length; i++) {    /* Once for each "overlay" element:    pass the "overlay" element as a parameter when executing the compareImages function: */    compareImages(x[i]);  }  function compareImages(img) {    var slider, img, clicked = 0, w, h;    /* Get the width and height of the img element */    w = img.offsetWidth;    h = img.offsetHeight;    /* Set the width of the img element to 50%: */    img.style.width = (w / 2) + "px";    /* Create slider: */    slider = document.createElement("DIV");    slider.setAttribute("class", "img-comp-slider");    /* Insert slider */    img.parentElement.insertBefore(slider, img);    /* Position the slider in the middle: */    slider.style.top = (h / 2) - (slider.offsetHeight / 2) + "px";    slider.style.left = (w / 2) - (slider.offsetWidth / 2) + "px";    /* Execute a function when the mouse button is pressed: */    slider.addEventListener("mousedown", slideReady);    /* And another function when the mouse button is released: */    window.addEventListener("mouseup", slideFinish);    /* Or touched (for touch screens: */    slider.addEventListener("touchstart", slideReady);     /* And released (for touch screens: */    window.addEventListener("touchend", slideFinish);    function slideReady(e) {      /* Prevent any other actions that may occur when moving over the image: */      e.preventDefault();      /* The slider is now clicked and ready to move: */      clicked = 1;      /* Execute a function when the slider is moved: */      window.addEventListener("mousemove", slideMove);      window.addEventListener("touchmove", slideMove);    }    function slideFinish() {      /* The slider is no longer clicked: */      clicked = 0;    }    function slideMove(e) {      var pos;      /* If the slider is no longer clicked, exit this function: */      if (clicked == 0) return false;      /* Get the cursor's x position: */      pos = getCursorPos(e)      /* Prevent the slider from being positioned outside the image: */      if (pos < 0) pos = 0;      if (pos > w) pos = w;      /* Execute a function that will resize the overlay image according to the cursor: */      slide(pos);    }    function getCursorPos(e) {      var a, x = 0;      e = (e.changedTouches) ? e.changedTouches[0] : e;      /* Get the x positions of the image: */      a = img.getBoundingClientRect();      /* Calculate the cursor's x coordinate, relative to the image: */      x = e.pageX - a.left;      /* Consider any page scrolling: */      x = x - window.pageXOffset;      return x;    }    function slide(x) {      /* Resize the image: */      img.style.width = x + "px";      /* Position the slider: */      slider.style.left = img.offsetWidth - (slider.offsetWidth / 2) + "px";    }  }}
```

* * *

##### Step 4) Execute Script:

```javascript
<script>initComparisons();</script>
```

* * *