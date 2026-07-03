# How TO - Resize Header on Scroll

* * *

Learn how to shrink a header on scroll with CSS and JavaScript.

* * *

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_shrink_header_scroll)

* * *

## How To Shrink a Header on Scroll

##### Step 1) Add HTML:

Create a header:

```javascript
<div id="header">Header</div>
```

* * *

##### Step 2) Add CSS:

Style the header:

```javascript
#header {  background-color: #f1f1f1; /* Grey background */  padding: 50px 10px; /* Some padding */  color: black;  text-align: center; /* Centered text */  font-size: 90px; /* Big font size */  font-weight: bold;  position: fixed; /* Fixed position - sit on top of the page */  top: 0;  width: 100%; /* Full width */  transition: 0.4s; /* Add a transition effect (when scrolling - and font size is decreased) */}
```

* * *

* * *

##### Step 3) Add JavaScript:

```javascript
// When the user scrolls down 50px from the top of the document, resize the header's font sizewindow.onscroll = function() {scrollFunction()};function scrollFunction() {  if (document.body.scrollTop > 50 || document.documentElement.scrollTop > 50) {    document.getElementById("header").style.fontSize = "30px";  } else {    document.getElementById("header").style.fontSize = "90px";  }}
```