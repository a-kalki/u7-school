# JavaScript Variables

## Variables = Data Containers

**JavaScript variables** are containers for data.

JavaScript variables can be **declared** in 4 ways:

### Modern JavaScript

*   Using `let`
*   Using `const`

### Older JavaScript

*   Using `var` (Not Recommended)
*   Automatically (Not Recommended)

```javascript
let x = 5;let y = 6;let z = x + y;
```
```javascript
const x = 5;const y = 6;const z = x + y;
```

From the examples you can guess:

*   x contains (or stores) the value 5
*   y contains (or stores) the value 6
*   z contains (or stores) the value 11

Variables are **labels** for data values.

Variables are **containers** for storing data.

* * *

## JavaScript Identifiers

Variables are identified with **unique names** called **identifiers**.

Names can be short like x, y, z.

Names can be descriptive age, sum, carName.

The rules for constructing names (identifiers) are:

*   Names can **contain** letters, digits, underscores, and dollar signs.
*   Names must **begin** with a letter, a $ sign or an underscore (\_).
*   Names are **case sensitive** (X is different from x).
*   **Reserved words** (JavaScript keywords) cannot be used as names.

Numbers are not allowed as the first character in names.

This way JavaScript can easily distinguish identifiers from numbers.

* * *

## JavaScript Underscore (\_)

JavaScript treats underscore as a letter.

Identifiers containing \_ are valid variable names:

```javascript
let _lastName = "Johnson";let _x = 2;let _100 = 5;
```

A convention among professional programmers is to start a name with underscore for "private" variables.

* * *

## JavaScript Dollar Sign $

JavaScript also treats a dollar sign as a letter.

Identifiers containing $ are valid variable names:

```javascript
let $ = "Hello World";let $$$ = 2;let $myMoney = 5;
```

Using the $ is not very common in JavaScript, but professional programmers often use it as an alias for the main function in JavaScript libraries.

* * *

## Declaring JavaScript Variables

**Creating a variable** in JavaScript is called **declaring** a variable.

You declare a JavaScript variable with the `let` keyword or the `const` keyword.

* * *

## Declaring a Variable Using **let**

```javascript
let carName;
```

After the declaration, the variable has no value (technically it is `undefined`).

To **assign** a value to the variable, use the equal sign:

```javascript
carName = "Volvo";
```

Most often you will assign a value to the variable when you declare it:

```javascript
let carName = "Volvo";
```

* * *

## Declaring a Variable Using **const**

Always use `const` if the value should not be changed

```javascript
const carName = "Volvo";
```
```javascript
const price1 = 5;const price2 = 6;let total = price1 + price2;
```

The two variables **price1** and **price2** are declared with the `const` keyword.

The values of price1 and price2 cannot be changed.

The variable **total** is declared with the `let` keyword.

The value of total can be changed.

* * *

## Declaring a Variable Automatically

Undeclared variables are **automatically declared** when first used:

```javascript
x = 5;y = 6;z = x + y;
```

It's a good programming practice to declare all variables at the beginning of a script.

* * *

## Declaring a Variable Using **var**

The `var` keyword was used in all JavaScript code before 2015.

The `let` and `const` keywords were new to JavaScript in 2015.

```javascript
var x = 5;var y = 6;var z = x + y;
```

* * *

## When to Use var, let, or const?

1\. Always declare variables

2\. Always use `const` if the value should not be changed

3\. Always use `const` if the type should not be changed (Arrays and Objects)

4\. Only use `let` if you cannot use `const`

5\. Never use `var` if you can use let or const.

* * *

## JavaScript Data Types

JavaScript variables can hold **8 datatypes**, but for now, just think of **numbers** and **strings**.

**Strings** are text written **inside quotes**.

**Numbers** are written **without quotes**.

If you put a number in quotes, it will be treated as a text string.

```javascript
const pi = 3.14;let person = "John Doe";let answer = 'Yes I am!';
```

* * *

* * *

## One Statement, Many Variables

You can declare many variables in one statement.

Start the statement with `let` or `const`and separate the variables by **comma**:

```javascript
let person = "John Doe", carName = "Volvo", price = 200;
```

A declaration can span multiple lines:

```javascript
let person = "John Doe",carName = "Volvo",price = 200;
```

* * *

## The Assignment Operator

In JavaScript, the equal sign (`=`) is an **assignment** operator, not an **equal to** operator.

This is different from algebra. The following does not make sense in algebra:

```javascript
x = x + 5
```

In JavaScript, however, it makes perfect sense: it assigns the value of x + 5 to x.

(It calculates the value of x + 5 and puts the result into x. The value of x is incremented by 5.)

The **equal to** operator is written like `**==**` in JavaScript.

* * *

## JavaScript Arithmetic

As with algebra, you can do arithmetic with JavaScript variables, using operators like `=` and `+`:

```javascript
let x = 5 + 2 + 3;
```

You can also add strings, but strings will be concatenated:

```javascript
let x = "John" + " " + "Doe";
```

If you put a number in quotes, the rest of the numbers will be treated as strings, and concatenated.

```javascript
let x = "5" + 2 + 3;
```

* * *

* * *

## Video: JavaScript Variables

  [![Tutorial on YouTube](images/yt_logo_rgb_dark.png)

 ![Tutorial on YouTube](images/img_javascript_variables.png)](https://youtu.be/7xStNKTM3bE&list=PLP9IO4UYNF0WWmZpE3W33vVPRl2GvjEqz)

* * *