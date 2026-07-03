# CSS Math Functions

* * *

## CSS Math Functions

CSS math functions allow mathematical expressions to be used as property values.

In this chapter, we will explain the following math functions:

*   `calc()`
*   `max()`
*   `min()`
*   `clamp()`

* * *

## The CSS calc() Function

The `[calc()](https://www.w3schools.com/cssref/func_calc.php)` function performs a mathematical calculation that will be used as the property value.

The `calc()` function supports addition (+), subtraction (-), multiplication (\*), and division (/), and can combine different units, like pixels and percentages.

### CSS Syntax

calc(_expression_)

Value

Description

_expression_

Required. A mathematical expression. The result will be used as the value

Let us look at an example:

```javascript
#div1 {  margin: auto;  width: calc(100% - 100px);  height: calc(30vh + 50px);  border: 1px solid black;  padding: 10px;}
```

* * *

* * *

## The CSS max() Function

The `[max()](https://www.w3schools.com/cssref/func_max.php)` function takes a comma-separated list of values, and uses the largest value from the list as the property value.

### CSS Syntax

max(_value1_, _value2_, ...)

Value

Description

_value1_, _value2_, ...

Required. A list of comma-separated values

Let us look at an example:

```javascript
#div1 {  height: 100px;  width: max(50%, 300px);  border: 1px solid black;  padding: 10px;}
```

* * *

## The CSS min() Function

The `[min()](https://www.w3schools.com/cssref/func_min.php)` function takes a comma-separated list of values, and uses the smallest value from the list as the property value.

### CSS Syntax

min(_value1_, _value2_, ...)

Value

Description

_value1_, _value2_, ...

Required. A list of comma-separated values

Let us look at an example:

```javascript
#div1 {  height: 100px;  width: min(50%, 300px);  border: 1px solid black;  padding: 10px;}
```

* * *

## The CSS clamp() Function

The `[clamp()](https://www.w3schools.com/cssref/func_clamp.php)` function is used to set a value that will adjust responsively between a minimum value, a preffered value, and a maximum value depending on the size of the viewport.

The `clamp()` function has three parameters: a minimum value, a preferred value, and a maximum value:

*   If the preferred value is between the min and max value, the preferred value is used
*   If the preferred value is smaller than the min value, the min value is used
*   If the preferred value is larger than the max value, the max value is used

### CSS Syntax

clamp(_min_, _preferred_, _max_)

Value

Description

_min_

Optional. The smallest allowed value

_preferred_

Required. The preferred value

_max_

Optional. The largest allowed value

Let us look at an example:

```javascript
h2 {  font-size: clamp(1.5rem, 5vw, 3rem);}div {  border: 1px solid green;  padding: 10px;  font-size: clamp(1rem, 2.5vw, 2rem);  width: clamp(200px, 50%, 600px);}
```

* * *

* * *

## CSS Functions Reference

For a complete list of all CSS functions, visit our [CSS Functions Reference](https://www.w3schools.com/cssref/css_functions.php).