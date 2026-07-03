# JavaScript Loops

JavaScript loops **repeat executing a block of code** a number of times.

Loops are fundamental for tasks involving:

*   Iteration over values
*   Iteration over data structures
*   Performing an action multiple times

Loop Type

Description

for

Iterates over values and expressions

while

Iterates over a condition

do...while

Iterates over a condition

for...in

Iterates over the properties of an Object

for...of

Iterates over array like objects

forEach()

Iterates over each element in an Array

## The for Loop

The `for` loop is used when the number of iterations is known.

It consists of an initialization (exp1), a condition (exp2), and an increment expression (exp3).

```javascript
for (exp1; exp2; exp3) {  // code block to be executed}
```

**exp1** is executed **one time before** the execution of the code block.

**exp2** defines **the condition** for executing the code block.

**exp3** is executed **every time** a code block has been executed.

```javascript
for (let i = 0; i < 5; i++) {  text += "The number is " + i + "<br>";}
```

* * *

## The while Loop

The `while` loop executes a block of code as long as a specified condition evaluates to true.

```javascript
while (condition) {  // code block to be executed}
```

In the following example, the code in the loop will run, over and over again, as long as a variable (i) is less than 10:

```javascript
while (i < 10) {  text += "The number is " + i;  i++;}
```

* * *

* * *

If you forget to increase the variable used in the condition, the loop will never end. This will crash your browser.

* * *

## The do...while Loop

The `do...while` loop is similar to the while loop, but guarantees that the code block will be executed at least once, before the condition is checked.

```javascript
do {  // code block to be executed}while (condition);
```

The example below uses a `do...while` loop. The loop will always be executed at least once, even if the condition is false, because the code block is executed before the condition is tested:

```javascript
do {  text += "The number is " + i;  i++;}while (i < 10);
```

Do not forget to increase the variable used in the condition, otherwise the loop will never end!

* * *

## The for...in Loop

The `for...in` loop iterates over the enumerable properties of an object.

It is typically used for iterating over object keys.

```javascript
for (key in object) {  // code block to be executed}
```

A JavaScript `for...in` statement loops through the properties of a person object:

```javascript
const person = {fname:"John", lname:"Doe", age:25};let text = "";for (let x in person) {  text += person[x];}
```

* * *

## The for...of Loop

The `for...of` loop iterates over the values of iterable objects such as arrays, strings, Maps, Sets, and NodeLists.

```javascript
for (variable of iterable) {  // code block to be executed}
```

*   **variable**  
    For every iteration the value of the next property is assigned to the variable. _Variable_ can be declared with `const`, `let`, or `var`.
*   **iterable**  
    An object that has iterable properties.

* * *

## Other Methods

Array methods like forEach(), map(), filter(), and reduce() provide alternative ways to iterate and manipulate array elements, often offering a more functional and concise approach compared to traditional loops for array-specific operations.