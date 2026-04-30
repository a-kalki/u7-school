# JavaScript Scope

## Scope = Visibility

**Scope** determines the **accessibility** (visibility) of variables.

JavaScript variables have 3 types of scope:

*   Global scope
*   Function scope
*   Block scope

## Global Scope

Variables declared **Globally** (outside any block or function) have **Global Scope**.

**Global** variables can be accessed from anywhere in a JavaScript program.

Variables declared with `var`, `let` and `const` are quite similar when declared outside a block.

They all have **Global Scope**:

```javascript
var x = 1;    // Global scopelet y = 2;    // Global scopeconst z = 3;  // Global scope
```
```javascript
let carName = "Volvo";// code here can use carNamefunction myFunction() {// code here can also use carName}
```

**Global variables** has **Global Scope**:

All scripts and functions in the same web page can access a variable with global scope.

* * *

## Function Scope

Each JavaScript function have their own scope.

Variables defined inside a function are not accessible (visible) from outside the function.

Variables declared with `var`, `let` and `const` are quite similar when declared inside a function.

They all have **Function Scope**:

```javascript
function myFunction1() {  var carName = "Volvo";  // Function Scope}function myFunction2() {  let carName = "Volvo";  // Function Scope}function myFunction3() {  const carName = "Volvo";  // Function Scope}
```
```javascript
// code here can NOT use carNamefunction myFunction() {  let carName = "Volvo";  // code here CAN use carName}// code here can NOT use carName
```

### Local Variables has Function Scope

*   They can only be accessed from within the function
*   No scripts or functions outside the function can access them
*   Variables with the same name can be used outside the function
*   Variables with the same name can be used in different functions
*   Local variables are created when a function starts
*   Local variables are deleted when the function is completed
*   Arguments (parameters) work as local variables inside functions

* * *

## Block Scope

Before [ES6](js_es6.asp.html), JavaScript variables could only have **Global Scope** or **Function Scope**.

ES6 introduced two important new JavaScript keywords: `let` and `const`.

These two keywords provide **Block Scope** in JavaScript.

Variables declared with `let` and `const` inside a code block are "block-scoped," meaning they are only accessible within that block.

This helps prevent unintended variable overwrites and promotes better code organization:

```javascript
{  let x = 2;}// x can NOT be used here
```

Variables declared with the `var` keyword can NOT have block scope.

Variables declared with the `var` keyword, inside a { } block; can be accessed from outside the block.

```javascript
{  var x = 2;}// x CAN be used here
```

* * *

* * *

## Automatically Global

If you assign a value to a variable that has **not been declared**, it will become a **GLOBAL** variable.

This code example will declare a global variable `carName`, even if the value is assigned inside a function.

```javascript
myFunction();// code here can use carNamefunction myFunction() {  carName = "Volvo";}
```

* * *

## Strict Mode

All modern browsers support running JavaScript in "Strict Mode".

In "Strict Mode", undeclared variables are not automatically global.

* * *

## Global Variables in HTML

With JavaScript, the global scope is the JavaScript environment.

In HTML, the global scope is the window object.

Global variables defined with the `var` keyword belong to the window object:

```javascript
var carName = "Volvo";// code here can use window.carName
```

Global variables defined with the `let` keyword do not belong to the window object:

```javascript
let carName = "Volvo";// code here can NOT use window.carName
```

* * *

## Warning

Do NOT create global variables unless you intend to.

Your global variables (or functions) can overwrite window variables (or functions).  
Any function, including the window object, can overwrite your global variables and functions.

* * *

## The Lifetime of JavaScript Variables

The lifetime of a JavaScript variable starts when it is declared.

Function (local) variables are deleted when the function is completed.

In a web browser, global variables are deleted when you close the browser window (or tab).

* * *

* * *