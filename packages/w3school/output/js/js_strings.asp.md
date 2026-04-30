# JavaScript Strings

Strings are for **storing text**

Strings are written **with quotes**

## Using Quotes

A JavaScript string is zero or more characters written inside quotes.

```javascript
let text = "John Doe";
```

You can use single or double quotes:

```javascript
let carName1 = "Volvo XC60";  // Double quoteslet carName2 = 'Volvo XC60';  // Single quotes
```

Strings created with single or double quotes work the same.

There is no difference between the two.

## Quotes Inside Quotes

You can use quotes inside a string, as long as they don't match the quotes surrounding the string:

```javascript
let answer1 = "It's alright";let answer2 = "He is called 'Johnny'";let answer3 = 'He is called "Johnny"';
```

* * *

## Template Strings

Templates were introduced with ES6 (JavaScript 2016).

Templates are strings enclosed in backticks (\`This is a template string\`).

Templates allow single and double quotes inside a string:

```javascript
let text = `He's often called "Johnny"`;
```

* * *

## String Length

To find the length of a string, use the built-in `length` property:

```javascript
let text = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";let length = text.length;
```

* * *

## Escape Characters

Because strings must be written within quotes, JavaScript will misunderstand this string:

```javascript
let text = "We are the so-called "Vikings" from the north.";
```

The string will be chopped to "We are the so-called ".

To solve this problem, you can use an **backslash escape character**.

The backslash escape character (`\`) turns special characters into string characters:

Code

Result

Description

\\'

'

Single quote

\\"

"

Double quote

\\\\

\\

Backslash

```javascript
let text = "We are the so-called \"Vikings\" from the north.";
```

Six other escape sequences are valid in JavaScript:

Code

Result

\\b

Backspace

\\f

Form Feed

\\n

New Line

\\r

Carriage Return

\\t

Horizontal Tabulator

\\v

Vertical Tabulator

The 6 escape characters above were originally designed to control typewriters, teletypes, and fax machines. They do not make any sense in HTML.

* * *

* * *

## Breaking Long Lines

For readability, programmers often like to avoid long code lines.

A safe way to break up a **statement** is after an operator:

```javascript
document.getElementById("demo").innerHTML ="Hello Dolly!";
```

A safe way to break up a **string** is by using string addition:

```javascript
document.getElementById("demo").innerHTML = "Hello " +"Dolly!";
```

* * *

## Template Strings

Templates were introduced with ES6 (JavaScript 2016).

Templates are strings enclosed in backticks (\`This is a template string\`).

Templates allow multiline strings:

```javascript
let text =`The quickbrown foxjumps overthe lazy dog`;
```

* * *

## JavaScript Strings as Objects

Normally, JavaScript strings are primitive values, created from literals:

```javascript
let x = "John";
```

But strings can also be defined as objects with the keyword `new`:

```javascript
let y = new String("John");
```
```javascript
let x = "John";let y = new String("John");
```

Do not create String objects.

The `new` keyword complicates the code and slows down execution speed.

String objects can produce unexpected results:

```javascript
let x = "John";let y = new String("John");
```
```javascript
let x = "John";let y = new String("John");
```

Note the difference between `(x==y)` and `(x===y)`.

```javascript
let x = new String("John");let y = new String("John");
```
```javascript
let x = new String("John");let y = new String("John");
```

Comparing two JavaScript objects **always** returns **false**.

* * *

## Learn More:

[JavaScript String Methods](js_string_methods.asp.html)

[JavaScript String Search](js_string_search.asp.html)

[JavaScript String Reference](js_string_reference.asp.html)

* * *

* * *