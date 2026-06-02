# JavaScript RegExp

## Regular Expressions

A **Regular Expression** is a sequence of characters that forms a **search pattern**.

**Regex** is a common shorthand for a regular expression.

JavaScript **RegExp** is an **Object** for handling Regular Expressions.

RegExp are be used for:

*   Text searching
*   Text replacing
*   Text validation

```javascript
let text = "Visit W3Schools";let n = text.search(/w3schools/i);
```

Example explained:

**/w3schools/i**  is a regular expression.

**w3schools**  is a pattern (to be used in a search).

**i**  is a modifier (modifies the search to be case-insensitive).

## Regular Expression Syntax

/_pattern_/_modifier flags_;

* * *

## Using String Methods

Regular expressions are often used with the **string methods**:

Method

Description

match(_regex_)

Returns an Array of results

replace(_regex_)

Returns a new String

search(_regex_)

Returns the index of the first match

* * *

## Using String match()

```javascript
let text = "Visit W3Schools";let n = text.match(/W3schools/);
```

## Using String replace()

```javascript
let text = "Visit Microsoft!";let result = text.replace(/Microsoft/i, "W3Schools");
```

## Using String search()

```javascript
let text = "Visit W3Schools";let n = text.search(/W3Schools/);
```

* * *

## RexExp Alternation (OR)

In a regular expression an **alternation** is denoted with a vertical line character **|**.

An alternation matches any of the alternatives separated with **|**.

```javascript
let text = "Black, white, red, green, blue, yellow.";let result = text.match(/red|green|blue/g);
```

* * *

## JavaScript Regex Flags

```javascript
/pattern/flags
```

Regular expression flags are parameters that can modify how a pattern is used, such as making it case-insensitive or global.

These are the most common:

Flag

Description

/g

Performs a global match (find all)

/i

Performs case-insensitive matching

/u

Enables Unicode support (new 2015)

* * *

## The /g Flag (Global)

The **/g** flag matches all occurrences of the pattern, rather than just the first one.

```javascript
let text = "Is this all there is?";const pattern = /is/g;let result = text.match(pattern);
```

* * *

## The /i Flag (Insensitive)

The **/i** flag makes a match case-insensitive: /abc/i matches "abc", "AbC", "ABC".

```javascript
let text = "Visit W3Schools";const pattern = /w3schools/i;let result = text.match(pattern);
```

## Learn More:

[JavaScript RegExp Flags](js_regexp_flags.asp.html)

* * *

## RexExp Metacharacters

```javascript
// Match wordsconst pattern = /\w/;
```

**Metacharacters** are characters with a special meaning.

They can be used to match digits, words, spaces, and more.

These are the most common:

Meta

Description

\\d

Matches Digits

\\w

Matches Words

\\s

Matches Spaces

* * *

## RegExp \\d (digits) Metacharacter

The \\d metacharacter matches digits.

```javascript
let text = "Give 100%!";const pattern = /\d/g;let result = text.match(pattern);
```

* * *

## RegExp \\w (word) Metacharacter

The \\w metacharacter matches word characters.

A word character is a character a-z, A-Z, 0-9, including \_ (underscore).

```javascript
let text = "Give 100%!";const pattern = /\w/g;let result = text.match(pattern);
```

## Learn More:

[JavaScript RegExp Metacharacters](js_regexp_meta_characters.asp.html)

* * *

## JavaScript RegExp Quantifiers

```javascript
// Match at least one zeroconst pattern = /0+/;
```

**Quantifiers** define the numbers of characters or expressions to match.

These are the most common:

Code

Description

x\*

Matches zero or more occurrences of x

x?

Matches zero or one occurrences of x

x{n}

Matches n occurences of x

* * *

## The ? Quantifier

**_x_?** matches zero or one occurrences of x.

```javascript
let text = "1, 100 or 1000?";const pattern = /10?/g;let result = text.match(pattern);
```

## Learn More:

[JavaScript RegExp Quantifiers](js_regexp_quantifiers.asp.html)

* * *

* * *

## Regular Expression Assertions

```javascript
// Match beginning of stringconst pattern = /^W3Schools/;// Match end of stringconst pattern = /W3Schools$/;
```

**Assertions** matches **Boundaries** and **Lookarounds**:

String Boundaries and Word Boundaries.

Lookarounds: Lookaheads and Lookbehinds.

These are the most common:

Syntax

Name

Description

^

String boundary

Matches the beginning of a string

$

String boundary

Matches the end of a string

\\b

Word boundary

Matches the beginning or end of a word

(?=...)

Lookahead

Matches the subsequent string

(?<=...)

Lookbehind

Matches the previous string

* * *

## RegExp ^ Metacharacter

The ^ metacharacter matches the beginning of a string.

```javascript
const pattern = /^W3Schools/;let text = "W3Schools Tutorial";let result = pattern.test(text); // true
```

* * *

## RegExp $ Metacharacter

The $ metacharacter matches the end of a string.

```javascript
const pattern = /W3Schools$/;let text = "Hello W3Schools";let result = pattern.test(text); // true
```

## Learn More:

[JavaScript RegExp Assertions](js_regexp_assertions.asp.html)

* * *

## JavaScript RegExp Character Classes

```javascript
// Match Digitsconst pattern = /[0-9]/;
```

**Character Classes** are characters enclosed in square brackets **\[\]**.

A character class matches any character from a set within brackets.

These are the most common:

Class

Description

\[a\]

Matches the character between the brackets

\[abc\]

Matches all characters between the brackets

\[a-z\]

Matches all characters in the range from a to z

\[0-9\]

Matches all characters in the range from 0 to 9

```javascript
let text = "More than 1000 times";const pattern = /[0-9]/g;let result = text.match(pattern);
```

## Learn More:

[JavaScript RegExp Flags](js_regexp_flags.asp.html)

[JavaScript RegExp Character Classes](js_regexp_characters.asp.html)

[JavaScript RegExp Meta Characters](js_regexp_meta_characters.asp.html)

[JavaScript RegExp Assertions](js_regexp_assertions.asp.html)

[JavaScript RegExp Quantifiers](js_regexp_quantifiers.asp.html)

[JavaScript RegExp Patterns](js_regexp_patterns.asp.html)

[JavaScript RegExp Objects](js_regexp_objects.asp.html)

[JavaScript RegExp Methods](js_regexp_methods.asp.html)

* * *