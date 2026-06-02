# Node.js ES Modules

* * *

## Introduction to ES Modules

ES Modules (ESM) is the official standard format for packaging JavaScript code for reuse.

It was introduced in ES6 (ES2015) and is now supported in Node.js.

Prior to ES Modules, Node.js exclusively used the CommonJS module format (require/exports).

Now developers can choose between CommonJS and ES Modules based on their project needs.

ES Modules provides a more structured and statically analyzable way to work with modules compared to CommonJS, with benefits like tree-shaking for smaller builds.

* * *

## CommonJS vs ES Modules

Here's how CommonJS and ES Modules differ:

Feature

CommonJS

ES Modules

File Extension

.js (default)

.mjs (or .js with proper config)

Import Syntax

require()

import

Export Syntax

module.exports / exports

export / export default

Import Timing

Dynamic (runtime)

Static (parsed before execution)

Top-level Await

Not supported

Supported

File URL in Imports

Not required

Required for local files

```javascript
// math.js (CommonJS)function add(a, b) {  return a + b;}function subtract(a, b) {  return a - b;}module.exports = {  add,  subtract};// app.js (CommonJS)const math = require('./math');console.log(math.add(5, 3)); // 8
```
```javascript
// math.mjs (ES Module)export function add(a, b) {  return a + b;}export function subtract(a, b) {  return a - b;}// app.mjs (ES Module)import { add, subtract } from './math.mjs';console.log(add(5, 3)); // 8
```

* * *

## Enabling ES Modules

There are several ways to enable ES Modules in Node.js:

### 1\. Using the .mjs File Extension

The simplest way is to use the .mjs extension for your files.

Node.js will automatically treat these files as ES Modules.

### 2\. Setting "type": "module" in package.json

To use ES Modules with regular .js files, add the following to your package.json:

```javascript
{  "name": "my-package",  "version": "1.0.0",  "type": "module"}
```

With this setting, all .js files in your project will be treated as ES Modules.

### 3\. Using the --input-type=module Flag

For scripts run directly with the node command, you can specify the module system:

```javascript
node --input-type=module script.js
```

**Note:** If you're working with a codebase that primarily uses CommonJS but you want to use ES Modules in one file, using the .mjs extension is the most explicit and least error-prone approach.

* * *

* * *

## Import and Export Syntax

ES Modules provide more flexible ways to import and export code compared to CommonJS.

### Export Syntax

```javascript
// Multiple named exportsexport function sayHello() {  console.log('Hello');}export function sayGoodbye() {  console.log('Goodbye');}// Alternative: export list at the endfunction add(a, b) {  return a + b;}function subtract(a, b) {  return a - b;}export { add, subtract };
```
```javascript
// Only one default export per moduleexport default function() {  console.log('I am the default export');}// Or with a named function/class/objectfunction mainFunction() {  return 'Main functionality';}export default mainFunction;
```
```javascript
// Combining default and named exportsexport const VERSION = '1.0.0';function main() {  console.log('Main function');}export { main as default }; // Alternative way to set default
```

### Import Syntax

```javascript
// Import specific named exportsimport { sayHello, sayGoodbye } from './greetings.mjs';sayHello(); // Hello// Rename imports to avoid naming conflictsimport { add as sum, subtract as minus } from './math.mjs';console.log(sum(5, 3)); // 8// Import all named exports as an objectimport * as math from './math.mjs';console.log(math.add(7, 4)); // 11
```
```javascript
// Import the default exportimport mainFunction from './main.mjs';mainFunction();// You can name the default import anything you wantimport anyNameYouWant from './main.mjs';anyNameYouWant();
```
```javascript
// Import both default and named exportsimport main, { VERSION } from './main.mjs';console.log(VERSION); // 1.0.0main(); // Main function
```

* * *

## Dynamic Imports

ES Modules support dynamic imports, allowing you to load modules conditionally or on-demand.

```javascript
// app.mjsasync function loadModule(moduleName) {  try {    // Dynamic import returns a promise    const module = await import(`./${moduleName}.mjs`);    return module;  } catch (error) {    console.error(`Failed to load ${moduleName}:`, error);  }}// Load a module based on a conditionconst moduleName = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';loadModule(moduleName).then(module => {  module.default(); // Call the default export});// Or with simpler await syntax(async () => {  const mathModule = await import('./math.mjs');  console.log(mathModule.add(10, 5)); // 15})();
```

**Use Case:** Dynamic imports are great for code-splitting, lazy-loading modules, or conditionally loading modules based on runtime conditions.

* * *

## Top-level Await

Unlike CommonJS, ES Modules support top-level await, allowing you to use await outside of async functions at the module level.

```javascript
// data-loader.mjs// This would cause an error in CommonJS or in a script// But works at the top level in an ES Moduleconsole.log('Loading data...');// Top-level await - the module's execution pauses hereconst response = await fetch('https://jsonplaceholder.typicode.com/todos/1');const data = await response.json();console.log('Data loaded!');export { data };// When another module imports this one, it will only get the exports// after all the top-level await operations have completed
```

Top-level await is especially useful for:

*   Loading configuration from files or remote sources
*   Connecting to databases before exporting functionality
*   Conditional imports or module initialization

* * *

## Best Practices

When working with ES Modules in Node.js, follow these best practices:

### 1\. Be Clear About File Extensions

Always include file extensions in your import statements for local files:

```javascript
// Goodimport { someFunction } from './utils.mjs';// Bad - might not work depending on configurationimport { someFunction } from './utils';
```

### 2\. Use Directory Indexes Properly

For directory imports, create index.mjs files:

```javascript
// utils/index.mjsexport * from './string-utils.mjs';export * from './number-utils.mjs';// app.mjsimport { formatString, add } from './utils/index.mjs';
```

### 3\. Choose the Right Export Style

Use named exports for multiple functions/values, and default exports for main functionality:

```javascript
// For libraries with many utilities, use named exportsexport function validate() { /* ... */ }export function format() { /* ... */ }// For components or classes that are the primary exportexport default class UserService { /* ... */ }
```

### 4\. Handle the Transition from CommonJS

When working with a codebase that mixes CommonJS and ES Modules:

*   ES Modules can import from CommonJS modules using default import
*   CommonJS can require() ES Modules only with dynamic import()
*   Use the compatibility helpers in the Node.js 'module' package for interoperability

```javascript
// Importing CommonJS module from ESMimport fs from 'fs'; // The default import is module.exports// Importing ESM from CommonJS (Node.js 12+)// In a CommonJS module:(async () => {  const { default: myEsmModule } = await import('./my-esm-module.mjs');})();
```

### 5\. Dual Package Hazard

For npm packages that support both module systems, use the "exports" field in package.json to specify different entry points:

```javascript
{  "name": "my-package",  "exports": {    ".": {      "import": "./index.mjs",      "require": "./index.cjs"    }  }}
```

**Node.js Support:** ES Modules are fully supported in Node.js since v12, with better support in v14+.

For older versions, you may need a transpiler like Babel.

* * *

* * *