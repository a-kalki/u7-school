# JavaScript Numbers

* * *

## Number Types

JavaScript has only one type of number.

Numbers can be written with or without decimals.

```javascript
let x = 3.14;    // A number with decimalslet y = 3;       // A number without decimals
```

Extra large or extra small numbers can be written with scientific (exponent) notation:

```javascript
let x = 123e5;    // 12300000let y = 123e-5;   // 0.00123
```

* * *

## JavaScript Numbers are Always 64-bit Floating Point

Unlike many other programming languages, JavaScript does not define different types of numbers, like integers, short, long, floating-point etc.

JavaScript numbers are always stored as double precision floating point numbers, following the international IEEE 754 standard.  
  
This format stores numbers in 64 bits, where the number (the fraction) is stored in bits 0 to 51, the exponent in bits 52 to 62, and the sign in bit 63:

Value (aka Fraction/Mantissa)

Exponent

Sign

52 bits (0 - 51) 

11 bits (52 - 62)

1 bit (63)

Most programming languages have many number types:

Whole numbers (integers):  
byte (8-bit), short (16-bit), int (32-bit), long (64-bit)

Real numbers (floating-point):  
float (32-bit), double (64-bit).

**Javascript numbers are always double (64-bit floating point).**

* * *

## Integer Precision

Integers (numbers without a period or exponent notation) are accurate up to 15 digits.

```javascript
let x = 999999999999999;   // x will be 999999999999999let y = 9999999999999999;  // y will be 10000000000000000
```

The maximum number of decimals is 17.

## Floating Precision

```javascript
let x = 0.2 + 0.1;
```
```javascript
let x = (0.2 * 10 + 0.1 * 10) / 10;
```

* * *

* * *

## Adding Numbers and Strings

WARNING !!

JavaScript uses the + operator for both addition and concatenation.

Numbers are added. Strings are concatenated.

If you add two numbers, the result will be a number:

```javascript
let x = 10;let y = 20;let z = x + y;
```

If you add two strings, the result will be a string concatenation:

```javascript
let x = "10";let y = "20";let z = x + y;
```

If you add a number and a string, the result will be a string concatenation:

```javascript
let x = 10;let y = "20";let z = x + y;
```

If you add a string and a number, the result will be a string concatenation:

```javascript
let x = "10";let y = 20;let z = x + y;
```

A common mistake is to expect this result to be 30:

```javascript
let x = 10;let y = 20;let z = "The result is: " + x + y;
```

A common mistake is to expect this result to be 102030:

```javascript
let x = 10;let y = 20;let z = "30";let result = x + y + z;
```

The JavaScript interpreter works from left to right.

First 10 + 20 is added because x and y are both numbers.

Then 30 + "30" is concatenated because z is a string.

* * *

## Numeric Strings

JavaScript strings can have numeric content:

```javascript
let x = 100;         // x is a numberlet y = "100";       // y is a string
```

JavaScript will try to convert strings to numbers in all numeric operations:

This will work:

```javascript
let x = "100";let y = "10";let z = x / y;
```

This will also work:

```javascript
let x = "100";let y = "10";let z = x * y;
```

And this will work:

```javascript
let x = "100";let y = "10";let z = x - y;
```

But this will not work:

```javascript
let x = "100";let y = "10";let z = x + y;
```

In the last example JavaScript uses the + operator to concatenate the strings.

* * *

## NaN - Not a Number

`NaN` is a JavaScript reserved word indicating that a number is not a legal number.

Trying to do arithmetic with a non-numeric string will result in `NaN` (Not a Number):

```javascript
let x = 100 / "Apple";
```

However, if the string is numeric, the result will be a number:

```javascript
let x = 100 / "10";
```

You can use the global JavaScript function `isNaN()` to find out if a value is a not a number:

```javascript
let x = 100 / "Apple";isNaN(x);
```

Watch out for `NaN`. If you use `NaN` in a mathematical operation, the result will also be `NaN`:

```javascript
let x = NaN;let y = 5;let z = x + y;
```

Or the result might be a concatenation like NaN5:

```javascript
let x = NaN;let y = "5";let z = x + y;
```

`NaN` is a number: `typeof NaN` returns `number`:

```javascript
typeof NaN;
```

* * *

## Infinity

`Infinity` (or `-Infinity`) is the value JavaScript will return if you calculate a number outside the largest possible number.

```javascript
let myNumber = 2;// Execute until Infinitywhile (myNumber != Infinity) {  myNumber = myNumber * myNumber;}
```

Division by 0 (zero) also generates `Infinity`:

```javascript
let x =  2 / 0;let y = -2 / 0;
```

`Infinity` is a number: `typeof Infinity` returns `number`.

```javascript
typeof Infinity;
```

* * *

## Hexadecimal

JavaScript interprets numeric constants as hexadecimal if they are preceded by 0x.

```javascript
let x = 0xFF;
```

Never write a number with a leading zero (like 07).  
Some JavaScript versions interpret numbers as octal if they are written with a leading zero.

By default, JavaScript displays numbers as **base 10** decimals.

But you can use the `toString()` method to output numbers from **base 2** to **base 36**.

Hexadecimal is **base 16**. Decimal is **base 10**. Octal is **base 8**. Binary is **base 2**.

```javascript
let myNumber = 32;myNumber.toString(32);myNumber.toString(16);myNumber.toString(12);myNumber.toString(10);myNumber.toString(8);myNumber.toString(2);
```

* * *

## JavaScript Numbers as Objects

Normally JavaScript numbers are primitive values created from literals:

```javascript
let x = 123;
```

But numbers can also be defined as objects with the keyword `new`:

```javascript
let y = new Number(123);
```
```javascript
let x = 123;let y = new Number(123);
```

Do not create Number objects.

The `new` keyword complicates the code and slows down execution speed.

Number Objects can produce unexpected results:

```javascript
let x = 500;let y = new Number(500);
```
```javascript
let x = 500;let y = new Number(500);
```

Note the difference between `(x==y)` and `(x===y)`.

```javascript
let x = new Number(500);let y = new Number(500);
```
```javascript
let x = new Number(500);let y = new Number(500);
```

Comparing two JavaScript objects **always** returns **false**.

* * *

## Learn More:

[JavaScript Number Methods](js_number_methods.asp.html)

[JavaScript Number Properties](js_number_properties.asp.html)

[JavaScript Number Reference](js_number_reference.asp.html)

* * *

* * *