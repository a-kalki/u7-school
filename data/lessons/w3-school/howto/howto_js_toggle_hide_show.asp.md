# How TO - Toggle Hide and Show

* * *

Toggle between hiding and showing an element with JavaScript.

* * *

Toggle Hide and Show

Click the button!

* * *

## Toggle (Hide/Show) an Element

##### Step 1) Add HTML:

```javascript
<button onclick="myFunction()">Click Me</button><div id="myDIV">  This is my DIV element.</div>
```

* * *

##### Step 2) Add JavaScript:

```javascript
function myFunction() {  var x = document.getElementById("myDIV");  if (x.style.display === "none") {    x.style.display = "block";  } else {    x.style.display = "none";  }}
```

**Tip:** For more information about Display and Visibility, read our [CSS Display Tutorial](https://www.w3schools.com/css/css_display_visibility.asp).