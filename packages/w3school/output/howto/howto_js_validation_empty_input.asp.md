# How TO - JS Validation For Empty Fields

* * *

Learn how to add form validation for empty input fields with JavaScript.

* * *

## Form Validation For Empty Inputs

* * *

##### Step 1) Add HTML:

```javascript
<form name="myForm" action="/action_page.php" onsubmit="return validateForm()" method="post" required>  Name: <input type="text" name="fname">  <input type="submit" value="Submit"></form>
```

* * *

##### Step 2) Add JavaScript:

If an input field (fname) is empty, this function alerts a message, and returns false, to prevent the form from being submitted:

```javascript
function validateForm() {  var x = document.forms["myForm"]["fname"].value;  if (x == "") {    alert("Name must be filled out");    return false;  }}
```

* * *

* * *