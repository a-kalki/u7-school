# How TO - Scroll Indicator

* * *

Learn how to create a scroll indicator with CSS and JavaScript.

* * *

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_scroll_indicator)

* * *

## How To Create a Scroll Indicator

##### Step 1) Add HTML:

```javascript
<div class="header">  <h2>Scroll Indicator</h2>  <div class="progress-container">    <div class="progress-bar" id="myBar"></div>  </div></div><div>content...</div>
```

* * *

##### Step 2) Add CSS:

```javascript
/* Style the header: fixed position (always stay at the top) */.header {  position: fixed;  top: 0;  z-index: 1;  width: 100%;  background-color: #f1f1f1;}/* The progress container (grey background) */.progress-container {  width: 100%;  height: 8px;  background: #ccc;}/* The progress bar (scroll indicator) */.progress-bar {  height: 8px;  background: #04AA6D;  width: 0%;}
```

* * *

* * *

##### Step 3) Add JavaScript:

```javascript
// When the user scrolls the page, execute myFunctionwindow.onscroll = function() {myFunction()};function myFunction() {  var winScroll = document.body.scrollTop || document.documentElement.scrollTop;  var height = document.documentElement.scrollHeight - document.documentElement.clientHeight;  var scrolled = (winScroll / height) * 100;  document.getElementById("myBar").style.width = scrolled + "%";}
```