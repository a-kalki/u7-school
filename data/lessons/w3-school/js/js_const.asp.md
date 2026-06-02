# JavaScript Const

The `const` keyword was introduced in [ES6 (2015)](js_es6.asp.html)

Variables defined with `const` cannot be **Redeclared**

Variables defined with `const` cannot be **Reassigned**

Variables defined with `const` have **Block Scope**

## Cannot be Reassigned

A variable defined with the `const` keyword cannot be reassigned:

```javascript
const PI = 3.141592653589793;PI = 3.14;      // This will give an errorPI = PI + 10;   // This will also give an error
```

* * *

## Must be Assigned

JavaScript `const` variables must be assigned a value when they are declared:

```javascript
const PI = 3.14159265359;
```
```javascript
const PI;PI = 3.14159265359;
```

## When to use JavaScript const?

**Always declare a variable with `const` when you know that the value should not be changed.**

Use `const` when you declare:

*   A new Array
*   A new Object
*   A new Function
*   A new RegExp

* * *

## Constant Objects and Arrays

The keyword `const` is a little misleading.

It does not define a constant value. It defines a constant reference to a value.

Because of this you can NOT:

*   Reassign a constant value
*   Reassign a constant array
*   Reassign a constant object

But you CAN:

*   Change the elements of constant array
*   Change the properties of constant object

* * *

## Constant Arrays

You can change the elements of a constant array:

```javascript
// You can create a constant array:const cars = ["Saab", "Volvo", "BMW"];// You can change an element:cars[0] = "Toyota";// You can add an element:cars.push("Audi");
```

But you can NOT reassign the array:

```javascript
const cars = ["Saab", "Volvo", "BMW"];cars = ["Toyota", "Volvo", "Audi"];    // ERROR
```

* * *

## Constant Objects

You can change the properties of a constant object:

```javascript
// You can create a const object:const car = {type:"Fiat", model:"500", color:"white"};// You can change a property:car.color = "red";// You can add a property:car.owner = "Johnson";
```

But you can NOT reassign the object:

```javascript
const car = {type:"Fiat", model:"500", color:"white"};car = {type:"Volvo", model:"EX60", color:"red"}    // ERROR
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

## Block Scope

Declaring a variable with `const` is similar to `let` when it comes to **Block Scope**.

The x declared in the block, in this example, is not the same as the x declared outside the block:

```javascript
const x = 10;// Here x is 10{const x = 2;// Here x is 2}// Here x is 10
```

You can learn more about block scope in the chapter [JavaScript Scope](js_scope.asp.html).

* * *

## Redeclaring

Redeclaring a JavaScript `var` variable is allowed anywhere in a program:

```javascript
var x = 2;     // Allowedvar x = 3;     // Allowedx = 4;         // Allowed
```

Redeclaring an existing `var` or `let` variable to `const`, in the same scope, is not allowed:

```javascript
var x = 2;     // Allowedconst x = 2;   // Not allowed{let x = 2;     // Allowedconst x = 2;   // Not allowed}{const x = 2;   // Allowedconst x = 2;   // Not allowed}
```

Reassigning an existing `const` variable, in the same scope, is not allowed:

```javascript
const x = 2;     // Allowedx = 2;           // Not allowedvar x = 2;       // Not allowedlet x = 2;       // Not allowedconst x = 2;     // Not allowed{  const x = 2;   // Allowed  x = 2;         // Not allowed  var x = 2;     // Not allowed  let x = 2;     // Not allowed  const x = 2;   // Not allowed}
```

Redeclaring a variable with `const`, in another scope, or in another block, is allowed:

```javascript
const x = 2;       // Allowed{  const x = 3;   // Allowed}{  const x = 4;   // Allowed}
```

* * *

## Hoisting

Variables defined with `var` are **hoisted** to the top and can be initialized at any time.

Meaning: You can use the variable before it is declared:

```javascript
carName = "Volvo";var carName;
```

If you want to learn more about hoisting, study the chapter [JavaScript Hoisting](js_hoisting.asp.html).

Variables defined with `const` are also hoisted to the top, but not initialized.

Meaning: Using a `const` variable before it is declared will result in a `ReferenceError`:

```javascript
alert (carName);const carName = "Volvo";
```

* * *

* * *