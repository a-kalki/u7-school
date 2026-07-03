# JavaScript Errors

## Errors Will Happen!

When executing JavaScript code, different errors can occur.

Errors can be coding errors made by the programmer, errors due to wrong input, and other unforeseeable things:

*   Reference Errors
*   Type Errors
*   Range Errors
*   URI Errors
*   Syntax Errors
*   Eval Error (deprecated)
*   Silent Errors (next chapter)

* * *

## How to Handle JavaScript Errors

The `try` statement allows you to define a block of code to be tested for errors while it is being executed.

The `catch` statement allows you to define a block of code to be executed, if an error occurs in the try block.

The JavaScript statements `try` and `catch` come in pairs:

```javascript
try {  Block of code to try} catch(err) {  Block of code to handle errors}
```

* * *

## Reference Errors

A `ReferenceError` occurs if you use (reference) a variable that does not exist.

Error Type

Example

Error

ReferenceError

fname = foo;

foo is not defined

ReferenceError

let x = y;  
let y = 5;

Cannot access y before initialization

```javascript
let x = 5;try {  x = y + 1;} catch(err) {  let text = err.name;}
```

* * *

## JavaScript Type Errors

A `Type Error` occurs when a value is of the wrong type or an operation is invalid on that type.

Error

Example

Error Message

TypeError

anna(5);

anna is not a function

Type Error

let num = 1;  
num.toUpperCase();  

num.toUpperCase is not a function

```javascript
let anna = 5;try {  anna(5);} catch(err) {  let text = err.name;}
```

* * *

* * *

## JavaScript Range Errors

A `RangeError` occurs when a value is out of its valid range.

Error Type

Example

Error Message

RangeError

new Array(-1);

Invalid array length

RangeError

num.toPrecision(500);

toPrecision() argument must be between 1 and 100

```javascript
try {new Array(-1);} catch(err) {  let text = err.name;}
```

* * *

## JavaScript URI Errors

#### (Uniform Resource Identifier Errors)

An `URIError` occurs if you use illegal characters in a URI function:

Error Type

Example

Error Message

URIError

decodeURI("%%%");

URI malformed

```javascript
try {  decodeURI("%%%");   // You cannot URI decode percent signs} catch(err) {  document.getElementById("demo").innerHTML = err.name;}
```

* * *

## JavaScript Syntax Errors

A `Syntax Error` occurs when the code violates JavaScript's grammar rules.

Error

Example

Error

SyntaxError

fname = "John);

Invalid or unexpected token )

SyntaxError

Math.round(4.6;

Missing ) after argument list

```javascript
// This line cannot be parsed by JavaScriptlet fName = "John);// Execution stops here
```

The statement above will generate the error: **Invalid or unexpected token**

**Execution of the program will stop!**

## Syntax Errors are Not Catchable

*   Syntax errors are not catchable by try...catch
*   Syntax errors happen before runtime

```javascript
try {  let x = Math.round(4.6;)} catch(err) {  let text = err.name + " " + err.description;}
```

## Syntax Issue

```javascript
Math.round(4.6;)
```

The line above is syntactically invalid JavaScript. There is an extra semicolon inside the parentheses. The correct syntax should be:

```javascript
Math.round(4.6);
```

## Why

The point is how the browser handles syntax errors:

The JavaScript engine throws a SyntaxError before running the script.

Syntax errors are caught before the try...catch block executes.

This means the try block never starts. The script just fails to run (no let text = update).

The browser console (F12 → Console tab) would show something like:

Uncaught SyntaxError: missing ) after argument list.

* * *

## JavaScript Eval Error

An `EvalError` indicates an error in the eval() function.

Newer versions of JavaScript do not throw EvalError.

Use SyntaxError instead.

* * *

## See Also:

[JavaScript Silent Errors](js_errors_silent.asp.html)

[JavaScript Error Statements](js_errors.asp.html)

[JavaScript Error Object](js_error_object.asp.html)

[JavaScript Debugging](js_debugging.asp.html)

* * *

* * *