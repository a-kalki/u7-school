# Node.js JavaScript Requirements

* * *

## Quick Start

If you're new to JavaScript, don't worry!

Here are the key concepts you need to know before diving into Node.js.

We'll cover the essentials with simple examples.

### Try It Yourself

You can run these examples directly in your browser's console or in a `.js` file using Node.js.

* * *

## JavaScript Fundamentals

Before starting with Node.js, you should be familiar with these JavaScript concepts:

*   Variables
*   Functions
*   Objects
*   Arrays
*   Asynchronous programming (callbacks, promises, async/await)
*   ES6+ features

This page will give short examples of essential JavaScript concepts needed for Node.js development.

For a greater understanding for JavaScipt, visit our [JavaScript Tutorial](https://www.w3schools.com/js/default.asp).

```javascript
// Variables (let, const, var)let name = 'Node.js';const version = 20;// Function declarationfunction greet(user) {  return `Hello, ${user}!`; // Template literal (ES6)}// Arrow function (ES6+)const add = (a, b) => a + b;console.log(greet('Developer')); // Hello, Developer!console.log(add(5, 3)); // 8
```
```javascript
// Objectconst user = {  name: 'Alice',  age: 25,  greet() {    console.log(`Hi, I'm ${this.name}`);  }};// Arrayconst colors = ['red', 'green', 'blue'];// Array methods (ES6+)colors.forEach(color => console.log(color));const lengths = colors.map(color => color.length);
```
```javascript
// 1. Callbacks (traditional)function fetchData(callback) {  setTimeout(() => {    callback('Data received!');  }, 1000);}// 2. Promises (ES6+)const fetchDataPromise = () => {  return new Promise((resolve) => {    setTimeout(() => resolve('Promise resolved!'), 1000);  });};// 3. Async/Await (ES8+)async function getData() {  const result = await fetchDataPromise();  console.log(result);}getData(); // Call the async function
```
```javascript
const { name } = user;console.log(`Hello, ${name}!`);
```

### Key JavaScript Concepts

*   **Variables:** `let` (mutable), `const` (immutable), `var` (legacy)
*   **Functions:** Regular, arrow functions, and methods
*   **Objects & Arrays:** Data structures for organizing data
*   **Modules:** `require()` (CommonJS) and `import/export` (ES6)
*   **Error Handling:** `try/catch` blocks

* * *

* * *

## Quick Reference Table

Feature

Node.js Support

let / const

Yes (since Node 6+)

Arrow Functions

Yes (since Node 4+)

Destructuring

Yes (since Node 6+)

Template Literals

Yes (since Node 4+)

Promises

Yes (since Node 0.12+)

Async/Await

Yes (since Node 7.6+)

* * *

* * *