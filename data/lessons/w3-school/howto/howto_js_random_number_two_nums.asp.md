# How TO - Random Number Between Two Numbers

* * *

Learn how to get a random number between two numbers in JavaScript.

* * *

## Random Numbers

This JavaScript function always returns a random number between a minimum (included) and maximum number (excluded):

```javascript
function getRndInteger(min, max) {  return Math.floor(Math.random() * (max - min) ) + min;}
```

This JavaScript function always returns a random number between min and max (both included):

```javascript
function getRndInteger(min, max) {  return Math.floor(Math.random() * (max - min + 1) ) + min;}
```

Read more about Random Numbers in our [JavaScript Random Tutorial](https://www.w3schools.com/js/js_random.asp).

* * *

* * *