# Node.js Promises

* * *

## Introduction to Promises

Promises in Node.js provide a cleaner way to handle asynchronous operations compared to traditional callbacks.

Promises represent the completion (or failure) of an asynchronous operation and its result.

### Promise States

*   **Pending**: Initial state, operation not completed
*   **Fulfilled**: Operation completed successfully
*   **Rejected**: Operation failed

Once a promise is settled (either fulfilled or rejected), its state cannot change.

* * *

## Benefits of Using Promises

```javascript
getUser(id, (err, user) => {  if (err) return handleError(err);  getOrders(user.id, (err, orders) => {    if (err) return handleError(err);    // Process orders...  });});
```
```javascript
getUser(id)  .then(user => getOrders(user.id))  .then(orders => processOrders(orders))  .catch(handleError);
```

#### Key Advantages:

*   Flatter code structure (avoids callback hell)
*   Better error handling with single `.catch()`
*   Easier to compose and chain operations
*   Built-in support for parallel operations

```javascript
fs.readFile('file1.txt', (err, data1) => {  if (err) throw err;  fs.readFile('file2.txt', (err, data2) => {    if (err) throw err;    fs.readFile('file3.txt', (err, data3) => {      if (err) throw err;      // Use data1, data2, and data3    });  });});
```

* * *

## Creating and Using Promises

Promises can be created using the `Promise` constructor, which accepts an executor function with two parameters: `resolve` and `reject`.

```javascript
// Create a new Promiseconst myPromise = new Promise((resolve, reject) => {  // Simulate an async operation (e.g., API call, file read)  setTimeout(() => {    const success = Math.random() > 0.5;        if (success) {      resolve('Operation completed successfully');    } else {      reject(new Error('Operation failed'));    }  }, 1000); // Simulate delay});// Using the PromisemyPromise  .then(result => console.log('Success:', result))  .catch(error => console.error('Error:', error.message));
```
```javascript
const fs = require('fs').promises;const promise1 = Promise.resolve('First result');const promise2 = new Promise((resolve) => setTimeout(() => resolve('Second result'), 1000));const promise3 = fs.readFile('myfile.txt', 'utf8'); // Read local file instead of fetchPromise.all([promise1, promise2, promise3])  .then(results => {    console.log('Results:', results);    // results[0] is from promise1    // results[1] is from promise2    // results[2] is the content of myfile.txt  })  .catch(error => {    console.error('Error in one of the promises:', error);  });
```

* * *

* * *

## Promise Chaining

Promises can be chained to execute asynchronous operations in sequence, with each `.then()` receiving the result of the previous operation.

```javascript
function getUser(userId) {  return new Promise((resolve, reject) => {    // Simulating database call    setTimeout(() => {      resolve({ id: userId, name: 'John' });    }, 1000);  });}function getUserPosts(user) {  return new Promise((resolve, reject) => {    // Simulating API call    setTimeout(() => {      resolve(['Post 1', 'Post 2', 'Post 3']);    }, 1000);  });}// Chain the promisesgetUser(123)  .then(user => {    console.log('User:', user);    return getUserPosts(user);  })  .then(posts => {    console.log('Posts:', posts);  })  .catch(error => {    console.error('Error:', error);  });
```

* * *

## Promise Methods

#### Instance Methods

*   `then(onFulfilled, onRejected)`  
    Handles fulfillment or rejection
*   `catch(onRejected)`  
    Handles rejections
*   `finally(onFinally)`  
    Runs after promise settles

#### Static Methods

*   `Promise.all(iterable)`  
    Waits for all promises to resolve
*   `Promise.race(iterable)`  
    Waits for first promise to settle
*   `Promise.allSettled(iterable)`  
    Waits for all to settle

#### Utility Methods

*   `Promise.resolve(value)`  
    Creates a resolved promise
*   `Promise.reject(reason)`  
    Creates a rejected promise

* * *

## Promise.then()

The `then()` method takes up to two arguments. The arguments are callback functions for the success and failure cases for the Promise.

```javascript
myPromise  .then(    result => console.log(result),    error => console.error(error)  );
```

* * *

## Promise.catch()

The `catch()` method handles rejected promises and is equivalent to `.then(null, errorHandler)`.

```javascript
myPromise  .then(result => console.log(result))  .catch(error => console.error(error));
```

* * *

## Promise.finally()

The `finally()` method executes code regardless of whether the promise is fulfilled or rejected.

```javascript
myPromise  .then(result => console.log(result))  .catch(error => console.error(error))  .finally(() => console.log('Operation completed'));
```

* * *

## Promise.all() for Parallel Execution

`Promise.all()` is used to run multiple promises in parallel, and wait for ALL of them to complete. It fails fast if any promise rejects.

```javascript
const fs = require('fs').promises;const promise1 = Promise.resolve('First result');const promise2 = new Promise((resolve) => setTimeout(() => resolve('Second result'), 1000));const promise3 = fs.readFile('data.txt', 'utf8'); // Read local file instead of fetchPromise.all([promise1, promise2, promise3])  .then(results => {    console.log('Results:', results);    // results[0] is from promise1    // results[1] is from promise2    // results[2] is the content of data.txt  })  .catch(error => {    console.error('Error in one of the promises:', error);  });
```

* * *

## Promise.race() for First Result

`Promise.race()` is useful when you need the result of the first settled promise, whether it's fulfilled or rejected.

```javascript
const promise1 = new Promise(resolve => setTimeout(() => resolve('First result'), 1000));const promise2 = new Promise(resolve => setTimeout(() => resolve('Second result'), 500));Promise.race([promise1, promise2])  .then(result => {    console.log('Fastest result:', result);    // Will log 'Second result' because promise2 is faster  });
```

* * *

## Error Handling in Promises

Proper error handling is important.

Promises provide several ways to handle errors:

```javascript
function fetchData() {  return new Promise((resolve, reject) => {    // Simulating an error    reject(new Error('Network error'));  });}fetchData()  .then(    data => console.log('Data:', data),    error => console.log('Error handled in then:', error.message)  );// Alternative method using catchfetchData()  .then(data => console.log('Data:', data))  .catch(error => console.log('Error handled in catch:', error.message));
```

**Best Practice:** Always include error handling with promises using `.catch()` to prevent unhandled promise rejections, which can lead to silent failures and memory leaks.

* * *

* * *