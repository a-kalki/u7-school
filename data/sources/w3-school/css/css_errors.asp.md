# CSS Errors

* * *

## CSS Errors

Errors in CSS can lead to unexpected behavior or styles not being applied correctly.

This page shows common CSS mistakes, and how to avoid them.

* * *

## Missing Semicolons

Forgetting a semicolon at the end of a property declaration can break the style rule.

```javascript
.bad {  color: red  background-color: yellow;}
```

* * *

## Invalid Property Names

Using a property name that does not exist will simply be ignored by the browser.

```javascript
.bad {  colr: blue;  font-size: 16px;}
```

* * *

* * *

## Invalid Values

Correct properties but invalid values will also be ignored.

```javascript
.bad {  width: -100px;  color: green;}
```

* * *

## Unclosed Braces

If you forget to close a brace `}`, the entire rule may be ignored.

```javascript
.bad {  padding: 20px;  margin: 10px;
```

* * *

## Extra Colons or Braces

Typos like extra colons or misplaced braces can cause rules to break.

```javascript
.bad {  color:: blue;}
```

* * *

## Tips to Avoid CSS Errors

*   Use a code editor with syntax highlighting.
*   Validate your CSS with a CSS linter or validator.
*   Write CSS in small sections and test frequently.

  

* * *