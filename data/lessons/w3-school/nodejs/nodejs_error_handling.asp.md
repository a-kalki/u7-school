# Node.js Error Handling

* * *

## Why Handle Errors?

Errors are inevitable in any program, but how you handle them makes all the difference. In Node.js, proper error handling is crucial because:

*   It prevents applications from crashing unexpectedly
*   It provides meaningful feedback to users
*   It makes debugging easier with proper error context
*   It helps maintain application stability in production
*   It ensures resources are properly cleaned up

* * *

## Common Error Types in Node.js

Understanding different error types helps in handling them appropriately:

```javascript
// SyntaxErrorJSON.parse('{invalid json}');// TypeErrornull.someProperty;// ReferenceErrorunknownVariable;
```
```javascript
// ENOENT: No such file or directoryconst fs = require('fs');fs.readFile('nonexistent.txt', (err) => {  console.error(err.code); // 'ENOENT'});// ECONNREFUSED: Connection refusedconst http = require('http');const req = http.get('http://nonexistent-site.com', (res) => {});req.on('error', (err) => {  console.error(err.code); // 'ECONNREFUSED' or 'ENOTFOUND'});
```

* * *

## Basic Error Handling

Node.js follows several patterns for error handling:

### Error-First Callbacks

The most common pattern in Node.js core modules where the first argument to a callback is an error object (if any occurred).

```javascript
const fs = require('fs');function readConfigFile(filename, callback) {  fs.readFile(filename, 'utf8', (err, data) => {    if (err) {      // Handle specific error types      if (err.code === 'ENOENT') {        return callback(new Error(`Config file ${filename} not found`));      } else if (err.code === 'EACCES') {        return callback(new Error(`No permission to read ${filename}`));      }      // For all other errors      return callback(err);    }    // Process data if no error    try {      const config = JSON.parse(data);      callback(null, config);    } catch (parseError) {      callback(new Error(`Invalid JSON in ${filename}`));    }  });}// UsagereadConfigFile('config.json', (err, config) => {  if (err) {    console.error('Failed to read config:', err.message);    // Handle the error (e.g., use default config)    return;  }  console.log('Config loaded successfully:', config);});
```

* * *

## Modern Error Handling

### Using try...catch with Async/Await

With async/await, you can use try/catch blocks for both synchronous and asynchronous code:

```javascript
const fs = require('fs').promises;async function loadUserData(userId) {  try {    const data = await fs.readFile(`users/${userId}.json`, 'utf8');    const user = JSON.parse(data);    if (!user.email) {      throw new Error('Invalid user data: missing email');    }    return user;  } catch (error) {    // Handle different error types    if (error.code === 'ENOENT') {      throw new Error(`User ${userId} not found`);    } else if (error instanceof SyntaxError) {      throw new Error('Invalid user data format');    }    // Re-throw other errors    throw error;  } finally {    // Cleanup code that runs whether successful or not    console.log(`Finished processing user ${userId}`);  }}// Usage(async () => {  try {    const user = await loadUserData(123);    console.log('User loaded:', user);  } catch (error) {    console.error('Failed to load user:', error.message);    // Handle error (e.g., show to user, retry, etc.)  }})();
```

* * *

* * *

## Global Error Handling

### Uncaught Exceptions

For unexpected errors, you can listen for **uncaughtException** to perform cleanup before exiting:

```javascript
// Handle uncaught exceptions (synchronous errors)process.on('uncaughtException', (error) => {  console.error('UNCAUGHT EXCEPTION! Shutting down...');  console.error(error.name, error.message);  // Perform cleanup (close database connections, etc.)  server.close(() => {    console.log('Process terminated due to uncaught exception');    process.exit(1); // Exit with failure  });});// Handle unhandled promise rejectionsprocess.on('unhandledRejection', (reason, promise) => {  console.error('UNHANDLED REJECTION! Shutting down...');  console.error('Unhandled Rejection at:', promise, 'Reason:', reason);  // Close server and exit  server.close(() => {    process.exit(1);  });});// Example of an unhandled promise rejectionPromise.reject(new Error('Something went wrong'));// Example of an uncaught exceptionsetTimeout(() => {  throw new Error('Uncaught exception after timeout');}, 1000);
```

* * *

## Error Handling Best Practices

### Dos and Don'ts

#### Do

*   Handle errors at the appropriate level
*   Log errors with sufficient context
*   Use custom error types for different scenarios
*   Clean up resources in finally blocks
*   Validate input to catch errors early

#### Don't

*   Ignore errors (empty catch blocks)
*   Expose sensitive error details to clients
*   Use try/catch for flow control
*   Swallow errors without logging them
*   Continue execution after unrecoverable errors

```javascript
class ValidationError extends Error {  constructor(message, field) {    super(message);    this.name = 'ValidationError';    this.field = field;    this.statusCode = 400;  }}class NotFoundError extends Error {  constructor(resource) {    super(`${resource} not found`);    this.name = 'NotFoundError';    this.statusCode = 404;  }}// Usagefunction getUser(id) {  if (!id) {    throw new ValidationError('User ID is required', 'id');  }  // ...}
```

* * *

## Summary

Effective error handling is a critical aspect of building robust Node.js applications.

By understanding different error types, using appropriate patterns, and following best practices, you can create applications that are more stable, maintainable, and user-friendly.

Remember that good error handling is not just about preventing crashes-it's about providing meaningful feedback, maintaining data integrity, and ensuring a good user experience even when things go wrong.

* * *

* * *