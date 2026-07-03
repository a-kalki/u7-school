# JavaScript Math Object

## The Math Object

The JavaScript Math object allows you to perform mathematical tasks.

The Math object is static.

All methods and properties can be used without creating a Math object first.

Math.PI;

[Try it Yourself »](tryit.asp%3Ffilename=tryjs_math_pi.html)

* * *

## Math Properties (Constants)

The syntax for any Math property is : `Math._property_`.

JavaScript provides 8 mathematical constants that can be accessed as Math properties:

```javascript
Math.E        // returns Euler's numberMath.PI       // returns PIMath.SQRT2    // returns the square root of 2Math.SQRT1_2  // returns the square root of 1/2Math.LN2      // returns the natural logarithm of 2Math.LN10     // returns the natural logarithm of 10Math.LOG2E    // returns base 2 logarithm of EMath.LOG10E   // returns base 10 logarithm of E
```

* * *

## Math Methods

The syntax for Math any methods is : `Math._method_(_number_)`

* * *

## Number to Integer

There are 4 common methods to round a number to an integer:

Math.round(x)

Returns x rounded to its nearest integer

Math.ceil(x)

Returns x rounded up to its nearest integer

Math.floor(x)

Returns x rounded down to its nearest integer

Math.trunc(x)

Returns the integer part of x ([new in ES6](js_es6.asp.html))

* * *

## Math.round()

`Math.round(x)` returns the nearest integer:

```javascript
Math.round(4.6);
```

* * *

## Math.ceil()

`Math.ceil(x)` returns the value of x rounded **up** to its nearest integer:

```javascript
Math.ceil(4.9);Math.ceil(4.7);Math.ceil(4.4);Math.ceil(4.2);Math.ceil(-4.2);
```

* * *

## Math.floor()

`Math.floor(x)` returns the value of x rounded **down** to its nearest integer:

```javascript
Math.floor(4.9);Math.floor(4.7);Math.floor(4.4);Math.floor(4.2);Math.floor(-4.2);
```

* * *

## Math.trunc()

`Math.trunc(x)` returns the integer part of x:

```javascript
Math.trunc(4.9);Math.trunc(4.7);Math.trunc(4.4);Math.trunc(4.2);Math.trunc(-4.2);
```

* * *

## Math.sign()

`Math.sign(x)` returns if x is negative, null or positive.

*   If x is positive it returns 1
*   If x is negative it returns -1
*   If x is zero, it returns 0

```javascript
Math.sign(-4);Math.sign(0);Math.sign(4);
```

Math.trunc() and Math.sign() were added to [JavaScript 2015 - ES6](js_es6.asp.html).

* * *

* * *

## Math.pow()

`Math.pow(x, y)` returns the value of x to the power of y:

```javascript
Math.pow(8, 2);
```

* * *

## Math.sqrt()

`Math.sqrt(x)` returns the square root of x:

```javascript
Math.sqrt(64);
```

* * *

## Math.abs()

`Math.abs(x)` returns the absolute (positive) value of x:

```javascript
Math.abs(-4.7);
```

* * *

## Math.sin()

`Math.sin(x)` returns the sine (a value between -1 and 1) of the angle x (given in radians).

If you want to use degrees instead of radians, you have to convert degrees to radians:

Angle in radians = Angle in degrees x PI / 180.

```javascript
Math.sin(90 * Math.PI / 180);     // returns 1 (the sine of 90 degrees)
```

* * *

## Math.cos()

`Math.cos(x)` returns the cosine (a value between -1 and 1) of the angle x (given in radians).

If you want to use degrees instead of radians, you have to convert degrees to radians:

Angle in radians = Angle in degrees x PI / 180.

```javascript
Math.cos(0 * Math.PI / 180);     // returns 1 (the cos of 0 degrees)
```

* * *

## Math.min() and Math.max()

`Math.min()` and `Math.max()` can be used to find the lowest or highest value in a list of arguments:

```javascript
Math.min(0, 150, 30, 20, -8, -200);
```
```javascript
Math.max(0, 150, 30, 20, -8, -200);
```

* * *

## Math.random()

`Math.random()` returns a random number between 0 (inclusive), and 1 (exclusive):

```javascript
Math.random();
```

You will learn more about `Math.random()` in the next chapter of this tutorial.

* * *

## The Math.log() Method

`Math.log(x)` returns the natural logarithm of x.

The natural logarithm returns the time needed to reach a certain level of growth:

```javascript
Math.log(1);
```

Math.E and Math.log() are twins.

```javascript
Math.log(10);
```

* * *

## The Math.log2() Method

`Math.log2(x)` returns the base 2 logarithm of x.

```javascript
Math.log2(8);
```

* * *

## The Math.log10() Method

`Math.log10(x)` returns the base 10 logarithm of x.

```javascript
Math.log10(1000);
```

* * *

## Learn More:

[Full Math Reference](js_math_reference.asp.html)

* * *

* * *