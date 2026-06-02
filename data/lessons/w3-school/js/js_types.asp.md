# JavaScript Datatypes

* * *

## JavaScript has 8 Datatypes

A JavaScript variable can hold 8 types of data:

Type

Description

String

A text of characters enclosed in quotes

Number

A number representing a mathematical value

Bigint

A number representing a large integer

Boolean

A data type representing true or false

Object

A collection of key-value pairs of data

Undefined

A primitive variable with no assigned value

Null

A primitive value representing object absence

Symbol

A unique and primitive identifier

```javascript
// Stringlet color = "Yellow";let lastName = "Johnson";// Numberlet length = 16;let weight = 7.5;// BigIntlet x = 1234567890123456789012345n;let y = BigInt(1234567890123456789012345)// Booleanlet x = true;let y = false;// Objectconst person = {firstName:"John", lastName:"Doe"};// Array objectconst cars = ["Saab", "Volvo", "BMW"];// Date objectconst date = new Date("2022-03-25");// Undefinedlet x;let y;// Nulllet x = null;let y = null;// Symbolconst x = Symbol();const y = Symbol();
```

* * *

## The typeof Operator

You can use the JavaScript `typeof` operator to find the type of a JavaScript variable.

The `typeof` operator returns the type of a variable or an expression:

```javascript
typeof ""             // Returns "string"typeof "John"         // Returns "string"typeof "John Doe"     // Returns "string"
```
```javascript
typeof 0              // Returns "number"typeof 314            // Returns "number"typeof 3.14           // Returns "number"typeof (3)            // Returns "number"typeof (3 + 4)        // Returns "number"
```

* * *

## JavaScript Strings

A string (a text string) is a series of characters like "John Doe".

Strings are written with quotes. You can use single or double quotes:  

```javascript
// Using double quotes:let carName1 = "Volvo XC60";// Using single quotes:let carName2 = 'Volvo XC60';
```

You can use quotes inside a string, as long as they don't match the quotes surrounding the string:

```javascript
// Single quote inside double quotes:let answer1 = "It's alright";// Single quotes inside double quotes:let answer2 = "He is called 'Johnny'";// Double quotes inside single quotes:let answer3 = 'He is called "Johnny"';
```

You will learn a lot more about **[JavaScript Strings](js_strings.asp.html)** later in this tutorial.

* * *

## JavaScript Numbers

All JavaScript numbers are stored as decimal numbers (floating point).

Numbers can be written with, or without decimals:

```javascript
// With decimals:let x1 = 34.00;// Without decimals:let x2 = 34;
```

* * *

## Exponential Notation

Extra large or extra small numbers can be written with scientific (exponential) notation:

```javascript
let y = 123e5;    // 12300000let z = 123e-5;   // 0.00123
```

* * *

* * *

## JavaScript Booleans

JavaScript booleans can only have one of two values: **true** or **false**

The boolean value of an expression is the basis for JavaScript comparisons.

Given that **x = 5**, the table below explains comparison:

Description

Expression

Returns

Equal to

(x == 8)

**false**

Not equal to

(x != 8)

**true**

Greater than

(x > 8)

**false**

Less than

(x < 8)

**true**

```javascript
let x = 5;(x == 8); // equals false(x != 8); // equals true
```

All JavaScript comparison operators (like ==, !=, <, >) return **true** or **false** from the comparison.

* * *

## Datatype undefined

In computer programs, variables are often declared without a value. The value can be something that has to be calculated, or something that will be provided later, like user input.

A variable without a value has the datatype `undefined`.

A variable without a value also has the value `undefined`.

```javascript
let carName;
```

* * *

## Empty Values

An empty value has nothing to do with `undefined`.

An empty string has both a legal value and a type.

```javascript
let car = "";    // The value is "", the typeof is "string"
```

You will learn a lot more about [**Data Types**](js_datatypes.asp.html) later in this tutorial.

* * *

* * *