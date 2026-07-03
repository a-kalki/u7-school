# How TO - The Spread Operator (...)

* * *

Learn how to use the three dots operator (...) a.k.a the spread operator in JavaScript.

* * *

## The Spread Operator

The JavaScript spread operator (`...`) expands an iterable (like an array) into more elements.

This allows us to quickly copy all or parts of an existing array into another array:

```javascript
const numbersOne = [1, 2, 3];const numbersTwo = [4, 5, 6];const numbersCombined = [...numbersOne, ...numbersTwo];
```

The spread operator is often used to extract only what's needed from an array:

```javascript
const numbers = [1, 2, 3, 4, 5, 6];const [one, two, ...rest] = numbers;
```

We can use the spread operator with objects too:

```javascript
const myVehicle = {  brand: 'Ford',  model: 'Mustang',  color: 'red'}const updateMyVehicle = {  type: 'car',  year: 2021,  color: 'yellow'}const myUpdatedVehicle = {...myVehicle, ...updateMyVehicle}
```

Notice the properties that did not match were combined, but the property that did match, `color`, was overwritten by the last object that was passed, `updateMyVehicle`. The resulting color is now yellow.

**See also**: [JavaScript ES6 Tutorial](https://www.w3schools.com/js/js_es6.asp).

* * *

* * *