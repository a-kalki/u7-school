# Node.js Asynchronous Programming

* * *

## What is Asynchronous Programming?

In Node.js, **asynchronous** operations let your program do other work while waiting for tasks like file I/O or network requests to complete.

This non-blocking approach enables Node.js to handle thousands of concurrent connections efficiently.

* * *

## Sync vs Async: Key Differences

### Synchronous

*   Blocks execution until complete
*   Simple to understand
*   Can cause delays
*   Uses functions like `readFileSync`

### Asynchronous

*   Non-blocking execution
*   Better performance
*   More complex to handle
*   Uses callbacks, promises, or async/await

```javascript
const fs = require('fs');console.log('1. Starting sync read...');const data = fs.readFileSync('myfile.txt', 'utf8');console.log('2. File contents:', data);console.log('3. Done reading file');
```

Output will be in order: 1 → 2 → 3 (blocks between each step)

```javascript
const fs = require('fs');console.log('1. Starting async read...');fs.readFile('myfile.txt', 'utf8', (err, data) => {  if (err) throw err;  console.log('2. File contents:', data);});console.log('3. Done starting read operation');
```

Output order: 1 → 3 → 2 (doesn't wait for file read to complete)

* * *

* * *

## Avoiding Callback Hell

```javascript
getUser(userId, (err, user) => {  if (err) return handleError(err);  getOrders(user.id, (err, orders) => {    if (err) return handleError(err);    processOrders(orders, (err) => {      if (err) return handleError(err);      console.log('All done!');    });  });});
```
```javascript
getUser(userId)  .then(user => getOrders(user.id))  .then(orders => processOrders(orders))  .then(() => console.log('All done!'))  .catch(handleError);
```
```javascript
async function processUser(userId) {  try {    const user = await getUser(userId);    const orders = await getOrders(user.id);    await processOrders(orders);    console.log('All done!');  } catch (err) {    handleError(err);  }}
```

* * *

## Modern Async Patterns

```javascript
const fs = require('fs').promises;console.log('1. Reading file...');fs.readFile('myfile.txt', 'utf8')  .then(data => {    console.log('3. File content:', data);  })  .catch(err => console.error('Error:', err));console.log('2. This runs before file is read!');
```
```javascript
async function readFiles() {  try {    console.log('1. Starting to read files...');    const data1 = await fs.readFile('file1.txt', 'utf8');    const data2 = await fs.readFile('file2.txt', 'utf8');    console.log('2. Files read successfully!');    return { data1, data2 };  } catch (error) {    console.error('Error reading files:', error);  }}
```

* * *

## Best Practices

```javascript
// Use async/await for better readabilityasync function getUserData(userId) {  try {    const user = await User.findById(userId);    const orders = await Order.find({ userId });    return { user, orders };  } catch (error) {     console.error('Failed to fetch user data:', error);    throw error; // Re-throw or handle appropriately  }}
```
```javascript
// Nested callbacks are hard to read and maintainUser.findById(userId, (err, user) => {  if (err) return console.error(err);  Order.find({ userId }, (err, orders) => {    if (err) return console.error(err);    // Process orders...  });});
```

* * *

### Key Takeaways

*   ✅ Use `async/await` for better readability
*   ✅ Always handle errors with `try/catch`
*   ✅ Run independent operations in parallel with `Promise.all`
*   ❌ Avoid mixing sync and async code patterns
*   ❌ Don't forget to `await` promises

```javascript
// Run multiple async operations in parallelasync function fetchAllData() {  try {    const [users, products, orders] = await Promise.all([      User.find(),      Product.find(),      Order.find()    ]);    return { users, products, orders };  } catch (error) {    console.error('Error fetching data:', error);    throw error;  }}
```

* * *

## Why Use Asynchronous Code?

Asynchronous code lets Node.js handle many requests at once, without waiting for slow operations like file or database access.

This makes Node.js great for servers and real-time apps.

* * *

## Summary

### Asynchronous Programming in Node.js

*   Node.js uses an event loop for non-blocking I/O
*   Modern async code uses `async/await` with Promises
*   Always handle errors in async operations
*   Use `Promise.all` for parallel operations
*   Avoid callback hell with proper async patterns

* * *

* * *