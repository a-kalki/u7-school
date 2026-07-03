# JavaScript Let

The `let` keyword was introduced in [ES6 (2015)](js_es6.asp.html)

Variables declared with `let` have **Block Scope**

Variables declared with `let` must be **Declared** before use

Variables declared with `let` cannot be **Redeclared** in the same scope

## Block Scope

Before ES6 (2015), JavaScript did not have **Block Scope**.

JavaScript had **Global Scope** and **Function Scope**.

ES6 introduced the two new JavaScript keywords: `let` and `const`.

These two keywords provided **Block Scope** in JavaScript:

```javascript
{  let x = 2;}// x can NOT be used here
```

* * *

## Function Scope

Inside a function all variables declared with `var`, `let` or `const` have **Function Scope**:

```javascript
function myfunction() {  var x = 1;  let y = 2;  const z = 3;}//x can NOT be used here//y can NOT be used here//z can NOT be used here
```

* * *

## Global Scope

Variables declared with the `var` always have **Global Scope**.

Variables declared with the `var` keyword can NOT have block scope:

```javascript
{  var x = 2;}// x CAN be used here
```

* * *

## Cannot be Redeclared

Variables defined with `let` **can not** be redeclared.

You can not accidentally redeclare a variable declared with `let`.

```javascript
let x = "John Doe";let x = 0;
```

Variables defined with `var` **can** be redeclared.

```javascript
var x = "John Doe";var x = 0;
```

* * *

## Redeclaring Variables

Redeclaring a variable using the `var` keyword can impose problems.

Redeclaring a variable inside a block will also redeclare the variable outside the block:

```javascript
var x = 10;// Here x is 10{var x = 2;// Here x is 2}// Here x is 2
```

Redeclaring a variable using the `let` keyword can solve this problem.

Redeclaring a variable inside a block will not redeclare the variable outside the block:

```javascript
let x = 10;// Here x is 10{let x = 2;// Here x is 2}// Here x is 10
```

* * *

## Difference Between var, let and const

Scope

Redeclare

Reassign

Hoisted

Binds this

var

No

Yes

Yes

Yes

Yes

let

Yes

No

Yes

No

No

const

Yes

No

No

No

No

## What is Good?

`let` and `const` have **block scope**.

`let` and `const` can not be **redeclared**.

`let` and `const` must be **declared** before use.

`let` and `const` does **not bind** to `this`.

`let` and `const` are **not hoisted**.

## What is Not Good?

`var` does not have to be declared.

`var` is hoisted.

`var` binds to this.

* * *

## Browser Support

The `let` and `const` keywords are not supported in Internet Explorer 11 or earlier.

The following table defines the first browser versions with full support:

Chrome 49

Edge 12

Firefox 36

Safari 11

Opera 36

Mar, 2016

Jul, 2015

Jan, 2015

Sep, 2017

Mar, 2016

* * *

* * *

## Redeclaring

Redeclaring a JavaScript variable with `var` is allowed anywhere in a program:

```javascript
var x = 2;// Now x is 2var x = 3;// Now x is 3
```

With `let`, redeclaring a variable in the same block is NOT allowed:

```javascript
var x = 2;   // Allowedlet x = 3;   // Not allowed{let x = 2;   // Allowedlet x = 3;   // Not allowed}{let x = 2;   // Allowedvar x = 3;   // Not allowed}
```

Redeclaring a variable with `let`, in another block, IS allowed:

```javascript
let x = 2;   // Allowed{let x = 3;   // Allowed}{let x = 4;    // Allowed}
```

* * *

## Let Hoisting

Variables defined with `var` are **hoisted** to the top and can be initialized at any time.

Meaning: You can use the variable before it is declared:

```javascript
carName = "Volvo";var carName;
```

If you want to learn more about hoisting, study the chapter [JavaScript Hoisting](js_hoisting.asp.html).

Variables defined with `let` are also hoisted to the top of the block, but not initialized.

Meaning: Using a `let` variable before it is declared will result in a `ReferenceError`:

```javascript
carName = "Saab";let carName = "Volvo";
```

* * *

* * *

## Video: JavaScript let

  [![Tutorial on YouTube](images/yt_logo_rgb_dark.png)

 ![Tutorial on YouTube](images/img_javascript_let.png)](https://youtu.be/-rpU6z9O88o&list=PLP9IO4UYNF0WWmZpE3W33vVPRl2GvjEqz)

* * *