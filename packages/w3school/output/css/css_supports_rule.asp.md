# CSS @supports Rule

* * *

## The CSS @supports Rule

The `[@supports](https://www.w3schools.com/cssref/atrule_supports.php)` rule lets you check if the browser supports a specific CSS property or value, and to define fallback styles if the feature is not supported.

This is useful for applying styles only when the browser can handle them.

### Basic Syntax

@supports (property: value) {
  /\* CSS rules to apply if condition is true \*/
}

* * *

## Example: Using @supports with grid and flex

You can combine `[@supports](https://www.w3schools.com/cssref/atrule_supports.php)` with regular CSS to provide fallback styling.

Here, if the browser supports display: flex, the CSS inside the @supports rule will be applied. If not, the .container class outside the @supports rule will be applied:

```javascript
/* use this CSS if the browser does not support display: flex */.container {  float: left;  width: 100%;}/* use this CSS if the browser supports display: flex */@supports (display: flex) {  .container {    display: flex;  }}
```

Here, if the browser supports display: grid, the CSS inside the @supports rule will be applied. If not, the .container class outside the @supports rule will be applied:

```javascript
/* use this CSS if the browser does not support display: grid */.container {  display: table;  width: 90%;  background-color: #2196F3;  padding: 10px;}/* use this CSS if the browser supports display: grid */@supports (display: grid) {  .container {    display: grid;    grid: auto;    grid-gap: 10px;    background-color: #2196F3;    padding: 10px;  }}
```

* * *

* * *

## Negating with `not`

You can use `not` to apply styles only when a feature is _not_ supported:

```javascript
@supports not (display: grid) {  .warning {    background-color: pink;    padding: 10px;    border: 1px solid red;  }}
```

* * *

## Combining Conditions

You can use `and`, `or`, and `not` for multiple conditions:

```javascript
@supports (display: grid) and (gap: 10px) {  .container {    display: grid;    gap: 10px;  }}
```

**Note:** Always provide fallback styles outside of `[@supports](https://www.w3schools.com/cssref/atrule_supports.php)`, for older browsers.

* * *

## CSS Reference

At-rule

Description

[@supports](https://www.w3schools.com/cssref/atrule_supports.php)

Used to test whether a browser supports a CSS feature