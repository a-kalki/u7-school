# How TO - Display Text when Checkbox is Checked

* * *

Check whether a checkbox is checked with JavaScript.

* * *

Display some text when the checkbox is checked:

Checkbox: 

Checkbox is CHECKED!

* * *

## Check Whether a Checkbox is Checked

##### Step 1) Add HTML:

```javascript
Checkbox: <input type="checkbox" id="myCheck" onclick="myFunction()"><p id="text" style="display:none">Checkbox is CHECKED!</p>
```

* * *

##### Step 2) Add JavaScript:

```javascript
function myFunction() {  // Get the checkbox  var checkBox = document.getElementById("myCheck");  // Get the output text  var text = document.getElementById("text");  // If the checkbox is checked, display the output text  if (checkBox.checked == true){    text.style.display = "block";  } else {    text.style.display = "none";  }}
```

* * *

* * *