# How TO - Toggle Password Visibility

* * *

Toggle between password visibility with JavaScript.

* * *

Password: 

 Show Password

* * *

## Toggle Password Visibility

##### Step 1) Add HTML:

```javascript
<!-- Password field -->Password: <input type="password" value="FakePSW" id="myInput"><!-- An element to toggle between password visibility --><input type="checkbox" onclick="myFunction()">Show Password
```

* * *

##### Step 2) Add JavaScript:

```javascript
function myFunction() {  var x = document.getElementById("myInput");  if (x.type === "password") {    x.type = "text";  } else {    x.type = "password";  }}
```

* * *

* * *