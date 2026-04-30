# JavaScript if

## The JavaScript if Statement

Use the JavaScript if statement to execute a block of code **when a condition is true**.

## Syntax

if (_condition_) {  
  //  _block of code to be executed if the condition is true_}

Note that `if` is in lowercase letters. Uppercase letters (If or IF) will generate a JavaScript error.

```javascript
if (hour < 18) {  greeting = "Good day";}
```
```javascript
let age = 18;let text = "You can Not drive";if (age >= 18) {  text = "You can drive";}
```

* * *

* * *

## Nested if

You can use an `if` statement inside another `if` statement:

```javascript
let age = 16;let country = "USA";let text = "You can Not drive!";if (country == "USA") {  if (age >= 16) {    text = "You can drive!";  }}
```

Nested if statements can make your code more complex.

A better solution is to use the logical AND operator:

```javascript
let age = 16;let country = "USA";let text = "You can Not drive!";if (country == "USA" && age >= 16) {  text = "You can drive!";}
```

* * *