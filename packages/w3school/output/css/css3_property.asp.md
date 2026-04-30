# CSS @property Rule

* * *

## The CSS @property Rule

The `[@property](https://www.w3schools.com/cssref/atrule_property.php)` rule is used to define custom CSS properties (CSS variables) directly in the stylesheet without having to run any JavaScript.

The `@property` rule has data type checking and constraining, sets a default value, and specifies the inherit behaviour.

The definition below creates a custom property named --myColor, defines it as a color property, specifies that it will inherit values from its parent elements, and its default value is lightgray.

### Syntax of @property

@property --myColor {  
  syntax: "<color>";  
  inherits: true;  
  initial-value: lightgray;  
}

### Using the Custom Property

The CSS `[var()](https://www.w3schools.com/cssref/func_var.php)` function is used to insert the custom property in CSS:

body {  
  background-color: var(--myColor);  
}

* * *

## Benefits of Using @property

The benefits of using `[@property](https://www.w3schools.com/cssref/atrule_property.php)` is:

*   **Data type checking:** You must specify the data type of the custom property, such as <number>, <color>, <length>, etc. This prevents errors and ensures that custom properties are used correctly
*   **Set default value:** You must set a default value for the custom property. This ensures that if an invalid value is assigned later, the browser uses the default value as a fallback
*   **Set inheritance behavior:** You must specify whether the custom property will inherit values from its parent elements or not. This ensures that you will have full control over inheritance

* * *

## CSS @property Example

The following example defines two custom properties: my-bg-color and my-txt-color.

The div, then uses the custom properties in the `[background-color](https://www.w3schools.com/cssref/pr_background-color.php)` and `[color](https://www.w3schools.com/cssref/pr_text_color.php)` properties:

```javascript
@property --my-bg-color {  syntax: "<color>";  inherits: true;  initial-value: lightgray;}@property --my-txt-color {  syntax: "<color>";  inherits: true;  initial-value: darkblue;}div {  width: 300px;  height: 150px;  padding: 15px;  background-color: var(--my-bg-color);  color: var(--my-txt-color);}
```

* * *

* * *

## Another @property Example

In the following example we use the default custom property on the <div> element. Then we override the custom property in class .fresh and class .nature (by setting some other colors), and it works perfectly fine:

```javascript
@property --my-bg-color {  syntax: "<color>";  inherits: true;  initial-value: lightgray;}div {  width: 300px;  height: 150px;  padding: 15px;  background-color: var(--my-bg-color);}.fresh {  --my-bg-color: #ff6347;}.nature {  --my-bg-color: rgb(120, 180, 30);}
```

* * *

## Avoid Error with Type Checking and Fallback Value

In the following example we set the custom property in class .nature to an integer. This is not valid, and the browser will use the fallback color, which is defined in the initial-value property (lightgray):

```javascript
@property --my-bg-color {  syntax: "<color>";  inherits: true;  initial-value: lightgray;}div {  width: 300px;  height: 150px;  padding: 15px;  background-color: var(--my-bg-color);}.fresh {  --my-bg-color: #ff6347;}.nature {  --my-bg-color: 2;}
```

* * *

## Use of the inherits Value

In the following example we will set the inherits value to false. This means that the custom property WILL NOT inherit values from its parent elements. Look at the result:

```javascript
@property --my-bg-color {  syntax: "<color>";  inherits: false;  initial-value: lightgray;}
```

The next example sets the inherits value to true. This means that the custom property WILL inherit values from its parent elements. Look at the result:

```javascript
@property --my-bg-color {  syntax: "<color>";  inherits: true;  initial-value: lightgray;}
```

* * *

## Create Smooth Animation with @property

A complete new opportunity you can achieve with the `[@property](https://www.w3schools.com/cssref/atrule_property.php)` rule, is to animate something that could not be animated before: Gradients. Look at the following example:

```javascript
@property --startColor {  syntax: "<color>";  initial-value: #EADEDB;  inherits: false;}@property --endColor {  syntax: "<color>";  initial-value: #BC70A4;  inherits: false;}
```

* * *

* * *

## CSS @property Rule

Property

Description

[@property](https://www.w3schools.com/cssref/css3_pr_property_rule.php)

Define custom CSS properties directly in the stylesheet without having to run any JavaScript