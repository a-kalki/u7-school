# CSS Variables - var() Function

* * *

## CSS Variables

The `[var()](https://www.w3schools.com/cssref/func_var.php)` function is used to insert the value of a CSS variable.

CSS variables have access to the DOM, which means that you can create variables with local or global scope, change the variables with JavaScript, and change the variables based on media queries.

A good way to use CSS variables is when it comes to the colors of your design. Instead of copy and paste the same colors over and over again, you can place them in variables.

* * *

## CSS Declare a Variable

CSS variables can have a global or local scope.

Global variables can be accessed through the entire document, while local variables can be used only inside the selector where it is declared.

To create a global variable, declare it inside the `[:root](https://www.w3schools.com/cssref/sel_root.asp)` selector. The `:root` selector matches the document's root element.

To create a local variable, declare it inside the selector that is going to use it.

A CSS variable name must begin with two dashes (--) and is case sensitive!

### Syntax

:root {  
  --primary-bg-color: green; /\* global scope \*/  
}  
  
.note {  
  --note-bg: yellow; /\* local scope \*/  
}

* * *

## The CSS var() Function

The `[var()](https://www.w3schools.com/cssref/func_var.php)` function is used to insert the value of a declared CSS variable.

### Syntax

var(--_name, value_)

Value

Description

_name_

Required. The variable name (must start with two dashes)

_value_

Optional. The fallback value (used if the variable is not found)

Advantages of using `[var()](https://www.w3schools.com/cssref/func_var.php)` are:

*   Makes the code easier to maintain (simplifies updates)
*   Makes the code easier to read (more understandable)
*   Makes it easier to change the color values for the entire page

* * *

* * *

## CSS Variables Example

Here, we declare two global variables (--primary-bg-color and --primary-color).

Then, we use the `[var()](https://www.w3schools.com/cssref/func_var.php)` function to insert the value of the variables later in the style sheet:

```javascript
:root {  --primary-bg-color: #1e90ff;  --primary-color: #ffffff;}body {  background-color: var(--primary-bg-color);}.container {  color: var(--primary-bg-color);  background-color: var(--primary-color);  padding: 15px;}.container h2 {  border-bottom: 2px solid var(--primary-bg-color);}.container .note {  border: 1px solid var(--primary-bg-color);  padding: 10px;}
```

To change the look of the page, you just need to change the two variable values:

```javascript
:root {  --primary-bg-color: #8FBC8F;  --primary-color: #FFFAF0;}body {  background-color: var(--primary-bg-color);}.container {  color: var(--primary-bg-color);  background-color: var(--primary-color);  padding: 15px;}.container h2 {  border-bottom: 2px solid var(--primary-bg-color);}.container .note {  border: 1px solid var(--primary-bg-color);  padding: 10px;}
```

* * *

* * *

## CSS var() Function

Function

Description

[var()](https://www.w3schools.com/cssref/func_var.php)

Inserts the value of a CSS variable