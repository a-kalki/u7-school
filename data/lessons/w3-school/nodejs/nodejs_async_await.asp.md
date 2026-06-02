# Node.js Async/Await

* * *

## Introduction to Async/Await

Async/await is a modern way to handle asynchronous operations in Node.js, building on top of Promises to create even more readable code.

Introduced in Node.js 7.6 and standardized in ES2017, async/await allows you to write asynchronous code that looks and behaves more like synchronous code.

Async/await is basically Promises with a more readable syntax. This makes your code cleaner and more maintainable.

Async/await makes asynchronous code look and more feel like synchronous code. It does not block the main thread, but is easy to follow and understand.

* * *

## Syntax and Usage

The syntax consists of two keywords:

*   `async`: Used to declare an asynchronous function that returns a Promise
*   `await`: Used to pause execution until a Promise is resolved, can only be used inside async functions

```javascript
async function getData() {  console.log('Starting...');  const result = await someAsyncOperation();  console.log(`Result: ${result}`);  return result;}function someAsyncOperation() {  return new Promise(resolve => {    setTimeout(() => resolve('Operation completed'), 1000);  });}// Call the async functiongetData().then(data => console.log('Final data:', data));
```
```javascript
const fs = require('fs').promises;async function readFile() {  try {    const data = await fs.readFile('myfile.txt', 'utf8');    console.log(data);  } catch (error) {    console.error('Error reading file:', error);  }}readFile();
```

* * *

* * *

## Error Handling with Try/Catch

One of the advantages of async/await is that you can use traditional try/catch blocks for error handling, making your code more readable.

```javascript
async function fetchUserData() {  try {    const response = await fetch('https://api.example.com/users/1');    if (!response.ok) {      throw new Error(`HTTP error: ${response.status}`);    }    const user = await response.json();    console.log('User data:', user);    return user;  } catch (error) {    console.error('Error fetching user data:', error);    throw error; // Re-throw the error if needed  }}
```

You can also mix async/await with Promise `.catch()` for different scenarios:

```javascript
// Using catch with an async functionfetchUserData().catch(error => {  console.log('Caught outside of async function:', error.message);});
```

* * *

## Running Promises in Parallel

Although async/await makes code look synchronous, sometimes you need to run operations in parallel for better performance.

```javascript
// Helper function to simulate an API callfunction fetchData(id) {  return new Promise(resolve => {    setTimeout(() => resolve(`Data for ID ${id}`), 1000);  });}// Sequential operation - takes ~3 secondsasync function fetchSequential() {  console.time('sequential');  const data1 = await fetchData(1);  const data2 = await fetchData(2);  const data3 = await fetchData(3);  console.timeEnd('sequential');  return [data1, data2, data3];}// Parallel operation - takes ~1 secondasync function fetchParallel() {  console.time('parallel');  const results = await Promise.all([    fetchData(1),    fetchData(2),    fetchData(3)  ]);  console.timeEnd('parallel');  return results;}// Demoasync function runDemo() {  console.log('Running sequentially...');  const seqResults = await fetchSequential();  console.log(seqResults);    console.log('\nRunning in parallel...');  const parResults = await fetchParallel();  console.log(parResults);}runDemo();
```

* * *

## Async/Await vs Promises vs Callbacks

Let's see how the same task is handled with different asynchronous patterns:

### With Callbacks

```javascript
function getUser(userId, callback) {  setTimeout(() => {    callback(null, { id: userId, name: 'John' });  }, 1000);}function getUserPosts(user, callback) {  setTimeout(() => {    callback(null, ['Post 1', 'Post 2']);  }, 1000);}// Using callbacksgetUser(1, (error, user) => {  if (error) {    console.error(error);    return;  }  console.log('User:', user);    getUserPosts(user, (error, posts) => {    if (error) {      console.error(error);      return;    }    console.log('Posts:', posts);  });});
```

### With Promises

```javascript
function getUserPromise(userId) {  return new Promise(resolve => {    setTimeout(() => {      resolve({ id: userId, name: 'John' });    }, 1000);  });}function getUserPostsPromise(user) {  return new Promise(resolve => {    setTimeout(() => {      resolve(['Post 1', 'Post 2']);    }, 1000);  });}// Using promisesgetUserPromise(1)  .then(user => {    console.log('User:', user);    return getUserPostsPromise(user);  })  .then(posts => {    console.log('Posts:', posts);  })  .catch(error => {    console.error(error);  });
```

### With Async/Await

```javascript
// Using async/awaitasync function getUserAndPosts() {  try {    const user = await getUserPromise(1);    console.log('User:', user);        const posts = await getUserPostsPromise(user);    console.log('Posts:', posts);  } catch (error) {    console.error(error);  }}getUserAndPosts();
```

Pattern

Pros

Cons

Callbacks

\- Simple to understand  
\- Widely supported

\- Callback hell  
\- Error handling is complex  
\- Hard to reason about

Promises

\- Chaining with .then()  
\- Better error handling  
\- Composable

\- Still requires nesting for complex flows  
\- Not as readable as async/await

Async/Await

\- Clean, synchronous-like code  
\- Easy error handling with try/catch  
\- Easier debugging

\- Requires understanding of Promises  
\- Easy to accidentally block execution

* * *

## Best Practices

When working with async/await in Node.js, follow these best practices:

1.  **Remember that async functions always return Promises**
    ```javascript
    async function myFunction() {  return 'Hello';}// This returns a Promise that resolves to 'Hello', not the string 'Hello' directlyconst result = myFunction();console.log(result); // Promise { 'Hello' }// You need to await it or use .then()myFunction().then(message => console.log(message)); // Hello
    ```
    
2.  **Use Promise.all for concurrent operations**
    
    When operations can run in parallel, use `Promise.all` to improve performance.
    
3.  **Always handle errors**
    
    Use try/catch blocks or chain a `.catch()` to the async function call.
    
4.  **Avoid mixing async/await with callbacks**
    
    Convert callback-based functions to Promises using util.promisify or custom wrappers.
    
    ```javascript
    const util = require('util');const fs = require('fs');// Convert callback-based function to Promise-basedconst readFile = util.promisify(fs.readFile);async function readFileContents() {  const data = await readFile('file.txt', 'utf8');  return data;}
    ```
    
5.  **Create clean async functions**
    
    Keep async functions focused on a single responsibility.
    

**Best Practice:** Be aware of the "top-level await" feature available in ECMAScript modules (ESM) in Node.js 14.8.0 and above, which allows using await outside of async functions at the module level.

* * *

* * *