# Node.js Util Module

* * *

## What is the Util Module?

The Util module is a core Node.js module that provides a collection of utility functions for common tasks.

It's like a Swiss Army knife for Node.js developers, offering solutions for:

#### Common Use Cases

*   Formatting strings with placeholders
*   Inspecting objects for debugging
*   Converting between callbacks and Promises
*   Type checking and validation
*   Handling deprecation warnings
*   Debugging and logging

#### Key Benefits

*   No external dependencies
*   Performance-optimized utilities
*   Consistent with Node.js core
*   Great for debugging and development
*   Useful for production code

**Note:** While some functions in the Util module are designed for internal use by Node.js itself, many are valuable tools for developers building Node.js applications.

The module is included with Node.js, so no installation is required.

* * *

## Getting Started with Util

Here's a practical example that demonstrates several utilities from the Util module in action:

```javascript
const util = require('util');const fs = require('fs');// Convert callback-based fs.readFile to Promise-basedconst readFile = util.promisify(fs.readFile);// Format strings with placeholdersconst greeting = util.format('Hello, %s! Today is %s', 'Developer', new Date().toDateString());console.log(greeting);// Inspect an object with custom optionsconst obj = {  name: 'Test',  nested: { a: 1, b: [2, 3] },  fn: function() { return 'test'; }};console.log(util.inspect(obj, { colors: true, depth: 2 }));// Use debug loggingconst debug = util.debuglog('app');debug('This will only show if NODE_DEBUG=app');// Example of using promisify with async/awaitasync function readConfig() {  try {    const data = await readFile('package.json', 'utf8');    console.log('Package name:', JSON.parse(data).name);  } catch (err) {    console.error('Error reading config:', err);  }}readConfig();
```

* * *

* * *

## Importing and Setup

The Util module can be imported in several ways depending on your module system and needs:

```javascript
// Import the entire moduleconst util = require('util');// Import specific functions using destructuringconst { promisify, inspect, format } = require('util');// Using strict mode (recommended)const assert = require('assert').strict;// For TypeScript users// import * as util from 'util';// import { promisify, inspect } from 'util';
```
```javascript
// Default importimport util from 'util';// Named importsimport { promisify, inspect } from 'util';// Rename importsimport { promisify as pify } from 'util';// Dynamic import (Node.js 14+)const { promisify } = await import('util');// Using with TypeScript types// import * as util from 'util';// import type { InspectOptions } from 'util';
```

**Best Practice:** For better tree-shaking and smaller bundles, prefer destructuring imports of only the functions you need.

The Util module is quite large, and you typically only use a small subset of its functionality.

* * *

## String Formatting and Inspection

The Util module provides powerful tools for formatting strings and inspecting objects, which are particularly useful for logging and debugging.

### util.format(format\[, ...args\])

Returns a formatted string using the first argument as a printf-like format string.

This is similar to `console.log()` but returns the formatted string instead of printing it.

**Format Specifiers:**

*   `%s` - String
*   `%d` - Number (both integer and float)
*   `%i` - Integer
*   `%f` - Floating point value
*   `%j` - JSON (replaced with `'[Circular]'` if the argument contains circular references)
*   `%o` - Object (inspect the object)
*   `%O` - Object (inspect the object, with full detail)
*   `%%` - Single percent sign ('%')

```javascript
const util = require('util');// Basic formattingconst formatted = util.format('Hello, %s!', 'World');console.log(formatted); // 'Hello, World!'// Multiple placeholdersconst multiFormatted = util.format(  'My name is %s. I am %d years old and I love %s.',  'Kai',  30,  'Node.js');console.log(multiFormatted);// 'My name is Kai. I am 30 years old and I love Node.js.'// Available specifiersconst specifiers = util.format(  'String: %s, Number: %d, JSON: %j, Character: %c',  'hello',  42,  { name: 'Object' },  65  // ASCII code for 'A');console.log(specifiers);// Extra arguments are concatenated with spacesconst extra = util.format('Hello', 'World', 'from', 'Node.js');console.log(extra); // 'Hello World from Node.js'
```

### util.inspect(object\[, options\])

Returns a string representation of an object, useful for debugging.

This is what Node.js uses internally for printing objects to the console.

**Common Use Cases:**

*   Debugging complex objects
*   Creating human-readable object representations
*   Logging objects with circular references
*   Customizing object display in logs

**Common Options:**

*   `showHidden` - Show non-enumerable properties (default: false)
*   `depth` - Number of levels to recurse (default: 2, null for unlimited)
*   `colors` - Add ANSI color codes (default: false)
*   `customInspect` - Use custom inspect functions (default: true)
*   `showProxy` - Show Proxy details (default: false)
*   `maxArrayLength` - Maximum number of array elements to include (default: 100)
*   `breakLength` - Length at which to break object keys (default: 60)
*   `compact` - Break properties onto new lines (default: true for arrays, false for objects)
*   `sorted` - Sort properties (default: false, true for alphabetical, function for custom sort)

```javascript
const util = require('util');// Basic usageconst obj = {  name: 'John',  age: 30,  hobbies: ['reading', 'coding'],  address: {    city: 'New York',    country: 'USA'  },  toString() {    return `${this.name}, ${this.age}`;  }};// Default inspectionconsole.log(util.inspect(obj));// Custom optionsconsole.log(util.inspect(obj, {  colors: true, // Add ANSI color codes  depth: 0, // Only inspect the first level  showHidden: true, // Show non-enumerable properties  compact: false, // Don't format objects on a single line  showProxy: true, // Show proxy details  maxArrayLength: 3, // Limit array elements displayed  breakLength: 50, // Line break after 50 characters  sorted: true // Sort object properties alphabetically}));// Circular referencesconst circular = { name: 'Circular' };circular.self = circular;console.log(util.inspect(circular));
```

### util.inspect.custom

Symbol used to customize object inspection.

This allows objects to define their own string representation when inspected.

**Best Practices:**

*   Use `util.inspect.custom` for custom inspection rather than `inspect()` method for better compatibility
*   Keep the custom inspection output concise and informative
*   Include important object state in the output
*   Consider performance for frequently inspected objects
*   Handle circular references to prevent infinite recursion

```javascript
const util = require('util');// Class with custom inspectionclass Person {  constructor(name, age) {    this.name = name;    this.age = age;    this._private = 'hidden information';  }    // Custom inspect method  [util.inspect.custom](depth, options) {    return `Person(${this.name}, ${this.age})`;  }}const kai = new Person('Kai', 30);// Custom inspection is usedconsole.log(util.inspect(kai)); // Person(Kai, 30)// Directly using console.log also uses custom inspectionconsole.log(kai); // Person(Kai, 30)
```

* * *

## Promises and Async Utilities

Node.js's Util module provides several utilities for working with asynchronous code, making it easier to work with both callback-based and Promise-based APIs.

### util.promisify(original)

Converts a callback-based function following the Node.js callback pattern to a function that returns a Promise.

This is useful for working with older Node.js APIs that use callbacks.

**When to use `util.promisify`:**

*   Working with older Node.js APIs that use callbacks
*   Converting callback-based libraries to use Promises
*   Simplifying async/await code by removing callbacks
*   Working with functions that follow the Node.js callback pattern (error-first, single result)

**Limitations:**

*   Only works with functions that follow the Node.js callback pattern: `(err, value) => {}`
*   Doesn't work with functions that return multiple values in the callback
*   Custom promisification may be needed for more complex APIs

```javascript
const util = require('util');const fs = require('fs');// Convert fs.readFile from callback-based to Promise-basedconst readFilePromise = util.promisify(fs.readFile);// Now we can use it with async/await or Promise chainingasync function readFileExample() {  try {    // Using the promisified function    const data = await readFilePromise('package.json', 'utf8');    console.log('File content:', data.substring(0, 100) + '...');        // Error handling with try/catch    return 'File read successfully';  } catch (err) {    console.error('Error reading file:', err.message);    return 'Error reading file';  }}readFileExample().then(result => {  console.log('Result:', result);});
```

### util.callbackify(original)

Converts a function that returns a Promise to a function that follows the Node.js callback pattern.

This is useful for working with older Node.js APIs that expect callback functions.

**When to use `util.callbackify`:**

*   Integrating Promise-based code with callback-based APIs
*   Maintaining backward compatibility in libraries
*   Working with APIs that expect Node.js-style callbacks
*   Gradually migrating from callbacks to Promises

**Best Practices:**

*   Prefer using Promises directly when possible
*   Document that the function uses callbacks in its JSDoc
*   Consider providing both Promise and callback interfaces in your APIs
*   Handle Promise rejections properly in the callback

```javascript
const util = require('util');// A Promise-based functionasync function fetchUserData(id) {  if (!id) {    throw new Error('ID is required');  }    // Simulate API request  return {    id,    name: `User ${id}`,    email: `user${id}@example.com`  };}// Convert to callback-basedconst fetchUserDataCallback = util.callbackify(fetchUserData);// Using the callback-based functionfetchUserDataCallback(1, (err, user) => {  if (err) {    console.error('Error:', err);    return;  }    console.log('User data:', user);});// Error handlingfetchUserDataCallback(null, (err, user) => {  if (err) {    console.error('Error occurred:', err.message);    return;  }    console.log('User data:', user); // This won't execute});
```

### util.promisify.custom

Symbol to customize promisification behavior. This allows you to provide a custom implementation when a function is promisified.

**Use cases for custom promisification:**

*   Functions that don't follow the standard callback pattern
*   APIs that return multiple values in the callback
*   Custom error handling or transformation of results
*   Optimizing performance for specific use cases
*   Adding additional functionality during promisification

```javascript
const util = require('util');// Function with custom promisificationfunction doSomething(options, callback) {  callback(null, 'regular result');}// Define custom promisificationdoSomething[util.promisify.custom] = (options) => {  return Promise.resolve('custom promisified result');};// Use the custom promisificationconst promisified = util.promisify(doSomething);// Compare the resultsasync function compareResults() {  // Original function with callback  doSomething({}, (err, result) => {    console.log('Callback result:', result);  });  // Custom promisified function  const customResult = await promisified({});  console.log('Promisified result:', customResult);}compareResults();
```

* * *

## Type Checking Utilities

The Util module provides comprehensive type checking utilities that are more reliable than JavaScript's `typeof` operator, especially for built-in objects and Node.js-specific types.

**Why use `util.types`?**

*   More accurate than `typeof` for many built-in types
*   Consistent behavior across Node.js versions
*   Works with Node.js-specific types like `Buffer`
*   Better performance than manual type checking in many cases
*   Handles edge cases properly (e.g., cross-realm objects)

```javascript
const util = require('util');// Example valuesconst values = [  'string',  123,  true,  Symbol('symbol'),  { key: 'value' },  [1, 2, 3],  null,  undefined,  () => {},  BigInt(123),  new Date(),  /regex/,  Buffer.from('buffer'),  new Error('error')];// Check types for each valuevalues.forEach(value => {  console.log(`Value: ${util.inspect(value)}`);  console.log(`- isArray: ${util.types.isArrayBuffer(value)}`);  console.log(`- isDate: ${util.types.isDate(value)}`);  console.log(`- isRegExp: ${util.types.isRegExp(value)}`);  console.log(`- isNativeError: ${util.types.isNativeError(value)}`);  console.log(`- isPromise: ${util.types.isPromise(value)}`);  console.log(`- isPrimitive: ${util.isPrimitive(value)}`);  console.log(`- isString: ${util.isString(value)}`);  console.log(`- isNumber: ${util.isNumber(value)}`);  console.log(`- isBoolean: ${util.isBoolean(value)}`);  console.log(`- isSymbol: ${util.types.isSymbol(value)}`);  console.log(`- isNull: ${value === null}`);  console.log(`- isUndefined: ${value === undefined}`);  console.log(`- isFunction: ${util.types.isFunction(value)}`);  console.log(`- isBuffer: ${Buffer.isBuffer(value)}`);  console.log('---');});
```

Many of the type-checking functions in `util` are deprecated in favor of `util.types` or JavaScript's built-in type checking methods like `Array.isArray()`.

### util.types

The `util.types` provides type checking functions for various JavaScript types and Node.js-specific objects:

```javascript
const util = require('util');// JavaScript built-in typesconsole.log('util.types.isDate(new Date()):',  util.types.isDate(new Date()));console.log('util.types.isRegExp(/test/):',  util.types.isRegExp(/test/));console.log('util.types.isPromise(Promise.resolve()):',  util.types.isPromise(Promise.resolve()));// Node.js-specific typesconsole.log('util.types.isArrayBuffer(new ArrayBuffer(0)):',  util.types.isArrayBuffer(new ArrayBuffer(0)));console.log('util.types.isSharedArrayBuffer(new SharedArrayBuffer(0)):',  util.types.isSharedArrayBuffer(new SharedArrayBuffer(0)));console.log('util.types.isUint8Array(new Uint8Array()):',  util.types.isUint8Array(new Uint8Array()));// More advanced typesconsole.log('util.types.isProxy(new Proxy({}, {})):',  util.types.isProxy(new Proxy({}, {})));console.log('util.types.isExternal(Requiring C++ binding):',  'Not demonstrated in this example');
```

* * *

## Deprecation Utilities

Node.js provides utilities to help manage API deprecations, making it easier to evolve your codebase while maintaining backward compatibility.

**Deprecation Strategy:**

1.  Mark deprecated functions with `util.deprecate()`
2.  Provide clear migration instructions in the deprecation message
3.  Include a deprecation code for easier tracking
4.  Document the deprecation in your API docs
5.  Remove deprecated functionality in a future major version

### util.deprecate(fn, msg\[, code\])

Marks a function as deprecated, issuing a warning when it's called.

```javascript
const util = require('util');// Original functionfunction oldFunction(x, y) {  return x + y;}// Deprecate the functionconst deprecatedFunction = util.deprecate(  oldFunction,  'oldFunction() is deprecated. Use newFunction() instead.',  'DEP0001');// New functionfunction newFunction(x, y) {  return x + y;}// Using the deprecated function will show a warningconsole.log('Result:', deprecatedFunction(5, 10));// Using the new functionconsole.log('Result:', newFunction(5, 10));
```

### Managing Deprecation Warnings

You can control the display of deprecation warnings using environment variables:

```javascript
# Show all deprecation warningsNODE_OPTIONS='--trace-deprecation'# Show only the first occurrence of each deprecationNODE_OPTIONS='--no-deprecation'# Silence all deprecation warningsNODE_OPTIONS='--no-warnings'# Turn deprecation warnings into exceptionsNODE_OPTIONS='--throw-deprecation'
```

* * *

## Debugging and Development Utilities

Node.js provides several utilities to aid in debugging and development, making it easier to diagnose issues and understand application behavior.

### util.debuglog(section)

Creates a function that conditionally writes debug messages to `stderr` based on the `NODE_DEBUG` environment variable.

This is a lightweight alternative to full-featured logging libraries.

**Best Practices for Debug Logging:**

*   Use descriptive section names that match your application's modules
*   Include relevant context in debug messages
*   Use string placeholders for better performance
*   Keep debug messages concise but informative
*   Consider the performance impact of computing values for debug messages

**Example Usage:**

// Enable debug logging for specific modules  
// NODE\_DEBUG=app,db node your-app.js  
  
// In your application  
const debugApp = util.debuglog('app');  
const debugDB = util.debuglog('db');  
  
// These will only log when 'app' is in NODE\_DEBUG  
debugApp('Application started with config: %j', config);  
  
// These will only log when 'db' is in NODE\_DEBUG  
debugDB('Connected to database: %s', connectionString);  
  
// Enable all debug logs (not recommended in production)  
// NODE\_DEBUG=\* node your-app.js

```javascript
const util = require('util');// Create debug loggers for different sectionsconst debugApp = util.debuglog('app');const debugDB = util.debuglog('db');const debugAuth = util.debuglog('auth');// These messages only appear when NODE_DEBUG includes 'app'debugApp('Application starting...');debugApp('Configuration loaded from %j', { source: 'config.json' });// These messages only appear when NODE_DEBUG includes 'db'debugDB('Connected to database');debugDB('Query executed: %s', 'SELECT * FROM users');// These messages only appear when NODE_DEBUG includes 'auth'debugAuth('User authenticated: %s', 'john.doe');// To see these messages, run your app with:// NODE_DEBUG=app,db node your-app.jsconsole.log('Application running normally (this always shows)');
```

* * *

* * *