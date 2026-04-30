# How TO - Set Default Parameters

* * *

Learn how to set default parameter values for JavaScript functions.

* * *

## Default Parameters

If a function in JavaScript is called with **missing arguments** (less than declared), the missing values are set to `undefined`.

Sometimes this is acceptable, but sometimes it is better to assign a default value to the parameter:

```javascript
function myFunction(x, y) {  if (y === undefined) {    y = 2;  }}
```

[ECMAScript 2015](https://www.w3schools.com/js/js_es6.asp) allows default parameter values in the function declaration:

```javascript
function myFunction (x, y = 2) {  // function code}
```

Read more about functions in our [JavaScript Function Tutorial](https://www.w3schools.com/js/js_function_definition.asp).

* * *

* * *