# Node.js Test Runner

* * *

## Introduction to Node.js Test Runner

The built-in `node:test` module provides a lightweight, no-dependency framework for writing and running JavaScript tests directly in Node.js.

Introduced as a stable API in Node.js 20, it's designed to be a fast, modern alternative to external testing frameworks.

**Note:** The Node.js Test Runner is stable as of Node.js v20.

Some advanced features may be experimental in earlier versions.

### Key Features

#### Core Capabilities

*   **Zero Configuration:** Works out of the box with no setup
*   **Dual Module Support:** Native ESM and CommonJS compatibility
*   **Parallel Execution:** Tests run concurrently by default
*   **Test Isolation:** Each test runs in its own context

#### Advanced Features

*   **Async Support:** First-class async/await handling
*   **Test Hooks:** Before/After hooks for setup/teardown
*   **Mocking:** Built-in test doubles and spies
*   **Code Coverage:** Integration with Node.js coverage tools

* * *

## Getting Started

### Writing Your First Test

Let's create and run a basic test using the Node.js Test Runner.

You'll need Node.js 16.17.0 or later installed.

```javascript
// Load the test moduleconst test = require('node:test');// Use strict assertion mode for better error messagesconst assert = require('node:assert/strict');// Simple synchronous testtest('basic arithmetic', (t) => {  // Assert that 1 + 1 equals 2  assert.equal(1 + 1, 2, '1 + 1 should equal 2');  // Deep equality check for objects/arrays  assert.deepEqual(    { a: 1, b: { c: 2 } },    { a: 1, b: { c: 2 } }  );});// Asynchronous test with async/awaittest('async test', async (t) => {  const result = await Promise.resolve('async result');  assert.strictEqual(result, 'async result');});
```
```javascript
# Run all test files in the test directorynode --test# Run a specific test filenode --test test/example.test.js# Run with coverage reportingNODE_V8_COVERAGE=coverage node --test
```

### Test Structure and Organization

For larger projects, organize your tests in a structured way:

```javascript
project/├── src/│ ├── math.js│ └── utils.js└── test/├── unit/│ ├── math.test.js│ └── utils.test.js└── integration/└── api.test.js
```

### Test Hooks

Use hooks to set up and clean up test environments:

```javascript
const { test, describe, before, after, beforeEach, afterEach } = require('node:test');const assert = require('node:assert/strict');describe('Test Suite with Hooks', (t) => {  let testData = [];  // Runs once before all tests  before(() => {    console.log('Running before all tests');    testData = [1, 2, 3];  });  // Runs before each test  beforeEach((t) => {    console.log('Running before each test');  });  test('array length', () => {    assert.strictEqual(testData.length, 3);  });  // Runs after each test  afterEach(() => {    console.log('Running after each test');  });  // Runs once after all tests  after(() => {    console.log('Running after all tests');    testData = [];  });});
```
```javascript
// simple-test.jsconst test = require('node:test');const assert = require('node:assert/strict');test('basic test', () => {  assert.equal(1 + 1, 2);});
```

### Running Tests

Run tests using the `--test` flag:

```javascript
node --test simple-test.js
```

You can also run all test files in a directory:

```javascript
node --test
```

This will run all files with names matching these patterns:

*   `**/*.test.js`
*   `**/*.spec.js`
*   `**/test-*.js`
*   `**/test/*.js`

* * *

* * *

## Writing Tests

### Asynchronous Tests

For asynchronous code, use an async test function:

```javascript
import test from 'node:test';import assert from 'node:assert/strict';// Using async/awaittest('async test', async () => {  // Simulate async operation  const result = await Promise.resolve(42);  assert.equal(result, 42);});// Using callbacks with done (older style)test('callback test', (t, done) => {  setTimeout(() => {    assert.equal(1 + 1, 2);    done();  }, 100);});
```

### Subtests (Nested Tests)

You can organize related tests using subtests:

```javascript
import test from 'node:test';import assert from 'node:assert/strict';test('math operations', async (t) => {  await t.test('addition', () => {    assert.equal(1 + 1, 2);  });    await t.test('multiplication', () => {    assert.equal(2 * 3, 6);  });    await t.test('division', () => {    assert.equal(10 / 2, 5);  });});
```

### Setup and Teardown (Test Fixtures)

For tests that need setup and teardown, use the `t.before()` and `t.after()` hooks:

```javascript
import test from 'node:test';import assert from 'node:assert/strict';test('using test fixtures', async (t) => {  // Setup - runs before the test  t.before(() => {    console.log('Setting up test resources');    // Example: Create test database, mock services, etc.  });    // Actual test  await t.test('my test with fixtures', () => {    assert.equal(1 + 1, 2);  });    // Teardown - runs after the test  t.after(() => {    console.log('Cleaning up test resources');    // Example: Delete test database, restore mocks, etc.  });});
```

### Skipping and Todo Tests

You can mark tests to be skipped or as todos:

```javascript
import test from 'node:test';// Skip this testtest('skipped test', { skip: true }, () => {  // This won't run});// Skip with a reasontest('skipped with reason', { skip: 'working on this later' }, () => {  // This won't run});// Mark as TODOtest('todo test', { todo: true }, () => {  // This won't run, but will be reported as TODO});// Conditional skiptest('conditional skip', { skip: process.platform === 'win32' }, () => {  // This will be skipped on Windows});
```

## Assertions

The Node.js Test Runner works with the built-in `assert` module. For stricter equality checks, use `assert/strict`.

```javascript
import assert from 'node:assert/strict';// Equality checksassert.equal(1, 1);                 // Loose equality (==)assert.strictEqual(1, 1);           // Strict equality (===)assert.deepEqual({a: 1}, {a: 1});   // Deep equality for objectsassert.deepStrictEqual({a: 1}, {a: 1}); // Strict deep equality// Truthiness checksassert.ok(true);                    // Checks if value is truthyassert.ok(1);                       // Also truthy// Comparing valuesassert.notEqual(1, 2);              // Check inequalityassert.notStrictEqual(1, '1');      // Check strict inequality// Throwing errorsassert.throws(() => { throw new Error('Boom!'); }); // Check if function throwsassert.doesNotThrow(() => { return 42; });         // Check if no error thrown// Async assertionsawait assert.rejects(               // Check if Promise rejects  async () => { throw new Error('Async boom!'); });
```

* * *

## Working with Mocks

The Node.js Test Runner doesn't include built-in mocking, but you can:

*   Use dependency injection to provide test doubles
*   Create simple mock functions and objects
*   Integrate with third-party mocking libraries if needed

```javascript
import test from 'node:test';import assert from 'node:assert/strict';// Function we want to testfunction processUser(user, logger) {  if (!user.name) {    logger.error('User has no name');    return false;  }  logger.info(`Processing user: ${user.name}`);  return true;}// Test with a mock loggertest('processUser logs correctly', () => {  // Create a mock logger  const mockCalls = [];  const mockLogger = {    error: (msg) => mockCalls.push(['error', msg]),    info: (msg) => mockCalls.push(['info', msg])  };    // Test with valid user  const validResult = processUser({name: 'Alice'}, mockLogger);  assert.strictEqual(validResult, true);  assert.deepStrictEqual(mockCalls[0], ['info', 'Processing user: Alice']);    // Reset mock calls  mockCalls.length = 0;    // Test with invalid user  const invalidResult = processUser({}, mockLogger);  assert.strictEqual(invalidResult, false);  assert.deepStrictEqual(mockCalls[0], ['error', 'User has no name']);});
```

* * *

## Testing Real Examples

### Testing a Utility Function

```javascript
// utils.jsexports.formatPrice = function(price) {  if (typeof price !== 'number' || isNaN(price)) {    throw new Error('Price must be a valid number');  }  return `$${price.toFixed(2)}`;};// utils.test.jsconst test = require('node:test');const assert = require('node:assert/strict');const { formatPrice } = require('./utils');// Test casestest('formatPrice formats numbers as currency strings', (t) => {  assert.equal(formatPrice(10), '$10.00');  assert.equal(formatPrice(10.5), '$10.50');  assert.equal(formatPrice(0), '$0.00');});// Test for errortest('formatPrice throws error for invalid inputs', (t) => {  assert.throws(() => formatPrice('not a number'), {    message: 'Price must be a valid number'  });  assert.throws(() => formatPrice(NaN));  assert.throws(() => formatPrice());});
```

### Testing an API Endpoint

```javascript
// userService.jsconst express = require('express');const app = express();app.use(express.json());app.get('/users/:id', (req, res) => {  const userId = parseInt(req.params.id);  // Simplified - in real app would fetch from database  if (userId === 1) {    res.json({ id: 1, name: 'John Doe', email: 'john@example.com' });  } else {    res.status(404).json({ error: 'User not found' });  }});module.exports = app;// userService.test.jsconst test = require('node:test');const assert = require('node:assert/strict');const http = require('node:http');const app = require('./userService');test('GET /users/:id returns correct user', async (t) => {  // Start the server  const server = http.createServer(app);  await new Promise(resolve => server.listen(0, resolve));  const port = server.address().port;    try {    // Make request to our API    const response = await fetch(`http://localhost:${port}/users/1`);    assert.equal(response.status, 200, 'Status should be 200');        const user = await response.json();    assert.deepStrictEqual(user, {      id: 1,      name: 'John Doe',      email: 'john@example.com'    });        // Test not found case    const notFoundResponse = await fetch(`http://localhost:${port}/users/999`);    assert.equal(notFoundResponse.status, 404, 'Status should be 404');  } finally {    // Clean up - close the server    await new Promise(resolve => server.close(resolve));  }});
```

* * *

## Advanced Configuration

### Custom Reporters

You can specify different output formats for test results:

```javascript
node --test --test-reporter=spec
```

Available reporters include:

*   `spec` - Detailed hierarchical view
*   `dot` - Minimal dots output
*   `tap` - Test Anything Protocol format
*   `junit` - JUnit XML format

### Filtering Tests

You can filter which tests to run using patterns:

```javascript
node --test --test-name-pattern="user"
```

This runs only tests with "user" in their name.

### Watch Mode

For development, you can run tests in watch mode to automatically rerun when files change:

```javascript
node --test --watch
```

* * *

## Comparison with Other Testing Frameworks

Feature

Node.js Test Runner

Jest

Mocha

Vitest

**Built-in**

✅ Yes (Node.js 16.17.0+)

❌ No

❌ No

❌ No

**Zero Config**

✅ Yes

✅ Yes

❌ Needs setup

✅ Yes

**Test Runner**

Node.js built-in

Jest

Mocha

Vite

**Assertion Library**

node:assert

Jest Expect

Chai/Sinon

Jest-compatible

**Parallel Tests**

✅ Yes

✅ Yes

✅ With --parallel

✅ Yes

**Code Coverage**

✅ With NODE\_V8\_COVERAGE

✅ Built-in

❌ Needs nyc/istanbul

✅ Built-in

**Mocking**

✅ Basic

✅ Advanced

❌ Needs Sinon

✅ Advanced

**Watch Mode**

✅ Yes (--watch)

✅ Yes

✅ With --watch

✅ Fast HMR

**Best For**

Built-in solution, simple projects

Full-featured testing

Flexible testing

Vite projects, ESM

**Note:** The Node.js Test Runner is ideal for projects that want a lightweight, zero-dependency testing solution that's built into Node.js itself.

For more complex testing needs, Jest or Mocha might be better choices.

* * *

* * *