# Node.js Modules

* * *

## What is a Module in Node.js?

Modules are the building blocks of Node.js applications, allowing you to organize code into logical, reusable components. They help in:

*   Organizing code into manageable files
*   Encapsulating functionality
*   Preventing global namespace pollution
*   Improving code maintainability and reusability

Node.js supports two module systems: CommonJS (traditional) and ES Modules (ECMAScript modules).

This page covers CommonJS, while [ES Modules](nodejs_modules_esm.asp.html) are covered separately.

* * *

## Core Built-in Modules

Node.js provides several built-in modules that are compiled into the binary.

Here are some of the most commonly used ones:

*   `fs` - File system operations
*   `http` - HTTP server and client
*   `path` - File path utilities
*   `os` - Operating system utilities
*   `events` - Event handling

*   `util` - Utility functions
*   `stream` - Stream handling
*   `crypto` - Cryptographic functions
*   `url` - URL parsing
*   `querystring` - URL query string handling

To use any built-in module, use the `require()` function:

```javascript
const http = require('http');
```

Now you can use the module's features, like creating a server:

```javascript
http.createServer((req, res) => {  res.writeHead(200, {'Content-Type': 'text/html'});  res.end('Hello World!');}).listen(8080);
```

* * *

* * *

## Creating and Exporting Modules

In Node.js, any file with a `.js` extension is a module. You can export functionality from a module in several ways:

### 1\. Exporting Multiple Items

Add properties to the `exports` object for multiple exports:

```javascript
// Exporting multiple functionsconst getCurrentDate = () => new Date().toISOString();const formatCurrency = (amount, currency = 'USD') => {  return new Intl.NumberFormat('en-US', {    style: 'currency',    currency: currency  }).format(amount);};// Method 1: Exporting multiple itemsexports.getCurrentDate = getCurrentDate;exports.formatCurrency = formatCurrency;// Method 2: Exporting an object with multiple properties// module.exports = { getCurrentDate, formatCurrency };
```

### 2\. Exporting a Single Item

To export a single item (function, object, etc.), assign it to `module.exports`:

```javascript
class Logger {  constructor(name) {    this.name = name;  }  log(message) {    console.log(`[${this.name}] ${message}`);  }  error(error) {    console.error(`[${this.name}] ERROR:`, error.message);  }}// Exporting a single classmodule.exports = Logger;
```

### 3\. Using Your Modules

Import and use your custom modules using `require()` with a relative or absolute path:

```javascript
const http = require('http');const path = require('path');// Importing custom modulesconst { getCurrentDate, formatCurrency } = require('./utils');const Logger = require('./logger');// Create a logger instanceconst logger = new Logger('App');// Create serverconst server = http.createServer((req, res) => {  try {    logger.log(`Request received for ${req.url}`);    res.writeHead(200, { 'Content-Type': 'text/html' });    res.write(`<h1>Welcome to our app!</h1>`);    res.write(`<p>Current date: ${getCurrentDate()}</p>`);    res.write(`<p>Formatted amount: ${formatCurrency(99.99)}</p>`);    res.end();  } catch (error) {    logger.error(error);    res.writeHead(500, { 'Content-Type': 'text/plain' });    res.end('Internal Server Error');  }});// Start serverconst PORT = process.env.PORT || 3000;server.listen(PORT, () => {  logger.log(`Server running at http://localhost:${PORT}`);});
```

* * *

## Module Loading and Caching

Node.js caches modules after the first time they are loaded. This means that subsequent `require()` calls return the cached version.

### Module Resolution

When you require a module, Node.js looks for it in this order:

1.  Core Node.js modules (like `fs`, `http`)
2.  Node modules in `node_modules` folders
3.  Local files (using `./` or `../` prefix)

Run the example in your terminal:

```javascript
C:\Users\<Your Name>> node demo_module.js
```

Visit [http://localhost:8080](http://localhost:8080) to see the result in your browser.

* * *

## Best Practices

#### Module Organization

*   Keep modules focused on a single responsibility
*   Use meaningful file and directory names
*   Group related functionality together
*   Use `index.js` for module entry points

#### Export Patterns

*   Prefer named exports for utilities
*   Use default exports for single-class modules
*   Document your module's API
*   Handle module initialization if needed

* * *

## Summary

Modules are a key concept in Node.js. They enable you to organize code into reusable, maintainable units.

By understanding how to create, export, and use modules effectively, you can build scalable and well-structured applications.

Key takeaways:

*   Node.js uses CommonJS modules by default
*   Use `require()` to import and `module.exports` to export
*   Modules are cached after first load
*   Follow best practices for module organization and structure

* * *

* * *