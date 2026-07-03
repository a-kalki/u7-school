# How TO - Add Active Class to Current Element

* * *

Learn how to add an active class to the current element with JavaScript.

* * *

Highlight the active/current (pressed) button:

1 2 3 4 5

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_active_element)

* * *

## Active Element

##### Step 1) Add HTML:

```javascript
<div id="myDIV">  <button class="btn">1</button>  <button class="btn active">2</button>  <button class="btn">3</button>  <button class="btn">4</button>  <button class="btn">5</button></div>
```

* * *

##### Step 2) Add CSS:

```javascript
/* Style the buttons */.btn {  border: none;  outline: none;  padding: 10px 16px;  background-color: #f1f1f1;  cursor: pointer;}/* Style the active class (and buttons on mouse-over) */.active, .btn:hover {  background-color: #666;  color: white;}
```

* * *

* * *

##### Step 3) Add JavaScript:

```javascript
// Get the container elementvar btnContainer = document.getElementById("myDIV");// Get all buttons with class="btn" inside the containervar btns = btnContainer.getElementsByClassName("btn");// Loop through the buttons and add the active class to the current/clicked buttonfor (var i = 0; i < btns.length; i++) {  btns[i].addEventListener("click", function() {    var current = document.getElementsByClassName("active");    current[0].className = current[0].className.replace(" active", "");    this.className += " active";  });}
```

If you do not have an active class set on the button element to start with, use the following code:

```javascript
// Get the container elementvar btnContainer = document.getElementById("myDIV");// Get all buttons with class="btn" inside the containervar btns = btnContainer.getElementsByClassName("btn");// Loop through the buttons and add the active class to the current/clicked buttonfor (var i = 0; i < btns.length; i++) {  btns[i].addEventListener("click", function() {    var current = document.getElementsByClassName("active");    // If there's no active class    if (current.length > 0) {      current[0].className = current[0].className.replace(" active", "");    }    // Add the active class to the current/clicked button    this.className += " active";  });}
```