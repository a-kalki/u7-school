# JavaScript Operators

### Operators are for Mathematical and Logical Computations

The **Assignment Operator** **\=** assigns values

The **Addition Operator** **+** adds values

The **Multiplication Operator** **\*** multiplies values

The **Comparison Operator** **\>** compares values

* * *

## JavaScript Assignment

The **Assignment Operator** (`=`) assigns a value to a variable:

```javascript
let x = 10;
```

* * *

## JavaScript Addition

The **Addition Operator** (`+`) adds numbers:

```javascript
let x = 5;let y = 2;let z = x + y;
```

## JavaScript Multiplication

The **Multiplication Operator** (`*`) multiplies numbers:

```javascript
let x = 5;let y = 2;let z = x * y;
```

* * *

## Types of JavaScript Operators

There are different types of JavaScript operators:

*   Arithmetic Operators
*   Assignment Operators
*   Comparison Operators
*   Logical Operators
*   And more ...

* * *

## JavaScript Arithmetic Operators

**Arithmetic Operators** are used to perform arithmetic on numbers:

```javascript
let a = 3;let x = (100 + 50) * a;
```

Operator

Description

+

Addition

\-

Subtraction

\*

Multiplication

\*\*

Exponentiation

/

Division

%

Modulus (Division Remainder)

++

Increment

\--

Decrement

Arithmetic operators are fully described in the **[JS Arithmetic](js_arithmetic.asp.html)** chapter.

## JavaScript String Addition

The `+` can also be used to add (concatenate) strings:

```javascript
let text1 = "John";let text2 = "Doe";let text3 = text1 + " " + text2;
```

The `+=` assignment operator can also be used to add (concatenate) strings:

```javascript
let text1 = "What a very ";text1 += "nice day";
```

When used on strings, the + operator is called the concatenation operator.

* * *

## Adding Strings and Numbers

Adding two numbers, will return the sum as a number like 5 + 5 = 10.

Adding a number and a string, will return the sum as a concatenated string like 5 + "5" = "55".

```javascript
let x = 5 + 5;let y = "5" + 5;let z = "Hello" + 5;
```

If you add a number and a string, the result will be a string!

* * *

* * *

## JavaScript Assignment Operators

Assignment operators assign values to JavaScript variables.

The **Addition Assignment Operator** (`+=`) adds a value to a variable.

```javascript
let x = 10;x += 5;
```

Operator

Example

Same As

\=

x = y

x = y

+=

x += y

x = x + y

\-=

x -= y

x = x - y

\*=

x \*= y

x = x \* y

/=

x /= y

x = x / y

%=

x %= y

x = x % y

\*\*=

x \*\*= y

x = x \*\* y

Assignment operators are fully described in the **[JS Assignment](js_assignment.asp.html)** chapter.

* * *

## JavaScript Comparison Operators

Comparison operators are used to **compare two values**.

Comparison operators always return `true` or `false`.

```javascript
let x = 5;let result = x > 8;
```

Operator

Description

Example

\==

equal to

x == 5

\===

equal value and equal type

x === 5

!=

not equal

x != 5

!==

not equal value or not equal type

x !== 5

\>

greater than

x > 5

<

less than

x < 5

\>=

greater than or equal to

x >= 5

<=

less than or equal to

x <= 5

All the comparison operators above can also be used on strings:

```javascript
let text1 = "A";let text2 = "B";let result = text1 < text2;
```

Note that strings are compared alphabetically.

Comparison operators are fully described in the **[JS Comparisons](js_comparisons.asp.html)** chapter.

* * *

## JavaScript Logical Operators

Operator

Description

&&

logical and

||

logical or

!

logical not

Logical operators are fully described in the **[JS Logical](js_logical.asp.html)** chapter.

* * *

* * *