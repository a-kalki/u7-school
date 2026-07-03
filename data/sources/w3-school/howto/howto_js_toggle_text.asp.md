# How TO - Toggle/Swap Text

* * *

Learn how to toggle text with JavaScript.

* * *

Toggle Text

Hello

* * *

## Toggle Text of an Element

##### Step 1) Add HTML:

```javascript
<button onclick="myFunction()">Click Me</button><div id="myDIV">Hello</div>
```

* * *

##### Step 2) Add JavaScript:

```javascript
function myFunction() {  var x = document.getElementById("myDIV");  if (x.innerHTML === "Hello") {    x.innerHTML = "Swapped text!";  } else {    x.innerHTML = "Hello";  }}
```

* * *

* * *