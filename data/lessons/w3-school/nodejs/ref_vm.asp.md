# Node.js VM Module

* * *

## Introduction to the VM Module

The VM (Virtual Machine) module allows you to compile and run code within isolated contexts.

This is useful for:

*   Running untrusted code safely in a sandbox
*   Evaluating JavaScript code dynamically
*   Creating plugins and extension systems
*   Building custom scripting environments
*   Testing code in isolation

**Warning:** While the VM module provides isolation from the main JavaScript environment, it is not a completely secure sandbox. It should not be used as the sole security mechanism for running untrusted code.

* * *

## Importing the VM Module

To use the VM module, you need to import it in your Node.js application:

```javascript
const vm = require('vm');
```

* * *

## Key Concepts

The VM module has several key components:

Component

Description

`Script`

A compiled JavaScript code that can be executed multiple times in different contexts

`Context`

An isolated global object where scripts execute, similar to a sandboxed environment

`ContextifiedObject`

An object that has been associated with a VM context and serves as its global object

* * *

* * *

## Basic Usage: Running JavaScript in a Context

The simplest way to use the VM module is to run code in a context:

```javascript
const vm = require('vm');// Create a context objectconst context = { x: 2 };// Compile and run a script in the contextvm.createContext(context);vm.runInContext('x = x * 2; y = 10;', context);// Inspect the modified contextconsole.log(context); // Outputs: { x: 4, y: 10 }
```

In this example:

1.  We create a context object with a variable `x`
2.  We "contextify" this object using `vm.createContext()`
3.  We run JavaScript code in this context that modifies `x` and creates `y`
4.  The changes are reflected in the context object

* * *

## VM Module Methods

### Script Methods

Method

Description

`vm.Script(code[, options])`

Creates a new Script object that represents compiled code

`script.runInContext(contextObject[, options])`

Runs the compiled code in the specified context

`script.runInNewContext([contextObject][, options])`

Runs the compiled code in a new context

`script.runInThisContext([options])`

Runs the compiled code in the current context

### Context Methods

Method

Description

`vm.createContext([contextObject][, options])`

Creates a new context which can be used for script execution

`vm.isContext(object)`

Checks if an object has been contextified

`vm.runInContext(code, contextObject[, options])`

Compiles and executes code in the given context

`vm.runInNewContext(code[, contextObject][, options])`

Compiles and executes code in a new context

`vm.runInThisContext(code[, options])`

Compiles and executes code in the current context

* * *

## Creating and Compiling Scripts

For better performance when executing the same code multiple times, you can pre-compile it using the `Script` class:

```javascript
const vm = require('vm');// Compile the script onceconst script = new vm.Script('x += 40; let z = 30;');// Create multiple contextsconst context1 = { x: 10 };const context2 = { x: 20 };// Contextify the objectsvm.createContext(context1);vm.createContext(context2);// Run the same script in different contextsscript.runInContext(context1);script.runInContext(context2);console.log(context1); // Outputs: { x: 50, z: 30 }console.log(context2); // Outputs: { x: 60, z: 30 }
```

**Note:** Compiling scripts separately is more efficient when you need to execute the same code multiple times, as the parsing and compilation steps happen only once.

* * *

## Different Ways to Run Code

### 1\. runInContext

Runs code in a previously created context:

```javascript
const vm = require('vm');const context = { value: 10 };vm.createContext(context);// Run directlyvm.runInContext('value += 5', context);console.log(context.value); // 15// Compile then runconst script = new vm.Script('value *= 2');script.runInContext(context);console.log(context.value); // 30
```

### 2\. runInNewContext

Creates a new context and runs code in it:

```javascript
const vm = require('vm');// No need to call createContext firstconst context = { value: 10 };vm.runInNewContext('value += 5; result = value * 2;', context);console.log(context); // { value: 15, result: 30 }
```

### 3\. runInThisContext

Runs code in the current V8 context (similar to `eval` but safer):

```javascript
const vm = require('vm');// Define a variable in the current scopeconst locallet = 20;let result;// This won't have access to localVarvm.runInThisContext('result = (typeof locallet !== "undefined" ? locallet : "not defined")');console.log(result); // 'not defined'// But it can access globalsglobal.globallet = 30;vm.runInThisContext('result = globalVar');console.log(result); // 30// Compare with eval, which CAN access local variableseval('result = localVar');console.log(result); // 20
```

**Note:** `runInThisContext` is similar to `eval`, but it doesn't have access to local variables in the scope it was called from. This makes it somewhat safer, as it reduces the risk of code injection affecting local variables.

* * *

## Working with the Timeout Option

You can set a timeout for script execution to prevent infinite loops or long-running scripts:

```javascript
const vm = require('vm');const context = { result: 0 };vm.createContext(context);try {  // This should timeout after 1000ms (1 second)  vm.runInContext(`    let counter = 0;    while (true) {      counter++;      result = counter;    }  `, context, { timeout: 1000 });} catch (err) {  console.error(`Execution timed out: ${err.message}`);  console.log(`Results before timeout: counter reached ${context.result}`);}
```

**Warning:** The timeout option doesn't guarantee that execution will stop exactly at the specified time. The actual timeout may vary slightly.

* * *

## Controlling Access to Node.js Core Modules

By default, code run in VM contexts doesn't have access to Node.js core modules. You can control which modules are available:

```javascript
const vm = require('vm');const fs = require('fs');// Create a sandbox with controlled access to core modulesconst sandbox = {  // Allow limited access to console  console: {    log: console.log,    error: console.error  },    // Provide controlled access to fs module  fs: {    readFileSync: fs.readFileSync  },    // Custom utility  util: {    add: (a, b) => a + b,    multiply: (a, b) => a * b  },    // No access to process, child_process, etc.};vm.createContext(sandbox);// Run code with limited accesstry {  vm.runInContext(`    // We can use the allowed methods    console.log('Running in sandbox');    console.log('2 + 3 =', util.add(2, 3));        // Try to read a safe file    try {      const content = fs.readFileSync('example.txt', 'utf8');      console.log('File content:', content);    } catch (err) {      console.error('File read error:', err.message);    }        // Try to access process (should fail)    try {      console.log('Process info:', process.version);    } catch (err) {      console.error('Cannot access process:', err.message);    }  `, sandbox);} catch (err) {  console.error('Sandbox execution failed:', err);}
```

**Warning:** While you can limit access to certain modules, this approach isn't completely secure. A determined attacker might still find ways to escape the sandbox. For truly secure sandboxing, consider additional isolation techniques or specialized libraries.

* * *

## Building a Simple Template Engine

The VM module can be used to create a simple template engine:

```javascript
const vm = require('vm');function renderTemplate(template, data) {  // Create template function - replace {{ let }} with values  const templateScript = `    function template(data) {      let output = \`${template.replace(/\{\{\s*(\w+)\s*\}\}/g, '${data.$1}')}\`;      return output;    }    template(data);  `;    // Create a context with the data  const context = { data };  vm.createContext(context);    // Execute the template function  return vm.runInContext(templateScript, context);}// Example usageconst template = `<!DOCTYPE html><html><head>  <title>{{ title }}</title></head><body>  <h1>{{ title }}</h1>  <p>Welcome, {{ name }}!</p>  <p>Today is {{ date }}</p></body></html>`;const data = {  title: 'My Template Page',  name: 'User',  date: new Date().toLocaleDateString()};const rendered = renderTemplate(template, data);console.log(rendered);
```

**Note:** While this example demonstrates a simple use case, production template engines like Handlebars or EJS are more robust and secure. This example is vulnerable to injection attacks if user data isn't properly escaped.

* * *

## Creating a Plugin System

The VM module is useful for creating plugin systems where plugins can be loaded and executed in isolation:

```javascript
const vm = require('vm');const fs = require('fs');const path = require('path');class PluginSystem {  constructor() {    this.plugins = new Map();    this.api = {      version: '1.0.0',      registerHook: this.registerHook.bind(this),      utils: {        add: (a, b) => a + b,        multiply: (a, b) => a * b,        formatDate: (date) => new Date(date).toLocaleDateString()      }    };        this.hooks = {      init: [],      process: [],      shutdown: []    };  }    // Register a plugin hook  registerHook(hookName, callback) {    if (this.hooks[hookName]) {      this.hooks[hookName].push(callback);      console.log(`Registered ${hookName} hook`);    } else {      console.error(`Invalid hook name: ${hookName}`);    }  }    // Load a plugin from file  loadPlugin(pluginName, pluginCode) {    try {      console.log(`Loading plugin: ${pluginName}`);            // Create a sandbox for this plugin      const sandbox = {        console: {          log: (msg) => console.log(`[${pluginName}] ${msg}`),          error: (msg) => console.error(`[${pluginName}] ${msg}`)        },        setTimeout,        clearTimeout,        api: this.api      };            // Create context and run the plugin code      const context = vm.createContext(sandbox);      vm.runInContext(pluginCode, context);            // Store the loaded plugin      this.plugins.set(pluginName, {        name: pluginName,        sandbox      });            console.log(`Successfully loaded plugin: ${pluginName}`);    } catch (err) {      console.error(`Error loading plugin ${pluginName}:`, err.message);    }  }    // Run all hooks of a specific type  async runHooks(hookName, data) {    console.log(`Running ${hookName} hooks...`);        for (const hook of this.hooks[hookName]) {      try {        const result = await hook(data);        console.log(`Hook result:`, result);      } catch (err) {        console.error(`Error in ${hookName} hook:`, err.message);      }    }  }    // Load all plugins from a directory  loadPluginsFromDirectory(directory) {    try {      const files = fs.readdirSync(directory);            for (const file of files) {        if (file.endsWith('.js')) {          const pluginName = path.basename(file, '.js');          const pluginPath = path.join(directory, file);          const pluginCode = fs.readFileSync(pluginPath, 'utf8');                    this.loadPlugin(pluginName, pluginCode);        }      }    } catch (err) {      console.error('Error loading plugins directory:', err.message);    }  }    // Run the plugin system  async run(data) {    await this.runHooks('init', data);    await this.runHooks('process', data);    await this.runHooks('shutdown', data);  }}// Example plugin code (normally this would be in a separate file)const examplePlugin = `// Register initialization hookapi.registerHook('init', async (data) => {  console.log('Plugin initializing with data:', data);  return 'Initialization complete';});// Register processing hookapi.registerHook('process', async (data) => {  console.log('Processing data');  return {    processed: true,    sum: api.utils.add(data.x, data.y),    product: api.utils.multiply(data.x, data.y),    date: api.utils.formatDate(new Date())  };});// Register shutdown hookapi.registerHook('shutdown', async () => {  console.log('Plugin shutting down');  return 'Shutdown complete';});console.log('Plugin loaded with API version', api.version);`;// Create and run the plugin system(async () => {  const system = new PluginSystem();    // Load plugins  system.loadPlugin('example', examplePlugin);    // You could also load from a directory  // system.loadPluginsFromDirectory('./plugins');    // Run the system  await system.run({ x: 5, y: 10 });})();
```

* * *

## Best Practices and Security Considerations

### Security Best Practices

1.  **Don't rely solely on the VM module for security**: Use additional security measures for untrusted code.
2.  **Limit resources**: Set timeouts and memory limits for executed code.
3.  **Control access**: Only provide necessary functionality to the sandbox.
4.  **Validate inputs**: Carefully validate all inputs before processing them in a VM.
5.  **Consider process isolation**: For highest security, run untrusted code in separate processes or containers.

### Performance Best Practices

1.  **Compile scripts once**: Use `new vm.Script()` for code that will be executed multiple times.
2.  **Reuse contexts**: Creating new contexts is expensive, so reuse when possible.
3.  **Limit context size**: Keep contexts small to improve performance.
4.  **Be cautious with large data**: Passing large data structures between contexts can be inefficient.

* * *

## VM Module vs. eval()

The VM module provides several advantages over using `eval()`:

Feature

VM Module

eval()

Access to local variables

No (with runInThisContext)

Yes

Isolation

Better (separate contexts)

None (same context)

Security

Better (controlled context)

Worse (can access everything)

Performance for repeated execution

Better (can pre-compile)

Worse (compiles each time)

Control over execution

More (timeouts, etc.)

Less

* * *

## Limitations of the VM Module

1.  **Not a complete sandbox**: VM contexts don't provide true isolation like separate processes.
2.  **No CPU or memory limits**: Cannot restrict resource usage directly (only timeout is available).
3.  **Prototype pollution risks**: Code in VM contexts can still potentially modify JavaScript prototypes.
4.  **Synchronous execution**: Running code blocks the event loop (unless you run it in a worker thread).
5.  **Debugging challenges**: Debugging code running in VM contexts can be difficult.

**Warning:** For critical security applications, consider using more robust sandboxing solutions like separate processes with the `child_process` module, containers, or specialized libraries like `vm2`.

* * *

## Summary

The Node.js VM module provides a way to execute JavaScript code in isolated V8 contexts. It's useful for:

*   Running code dynamically with some level of isolation
*   Creating plugin systems that can be extended safely
*   Building template engines and scripting environments
*   Testing code in controlled contexts

While not a complete security solution for running untrusted code, the VM module offers more isolation than `eval()` and is a valuable tool for JavaScript evaluation within Node.js applications.

* * *

## Advanced Context Management

Learn how to create and manage complex VM contexts with custom globals and modules:

### 1\. Creating a Custom Context with Global Variables

```javascript
const vm = require('vm');const util = require('util');// Create a custom context with specific global variablesconst context = {  console: {    log: (...args) => {      // Custom console.log implementation      process.stdout.write('Custom Log: ' + util.format(...args) + '\n');    },    error: console.error,    warn: console.warn,    info: console.info  },  // Add custom utilities  utils: {    formatDate: () => new Date().toISOString(),    generateId: () => Math.random().toString(36).substr(2, 9)  },  // Add a safe require function  require: (moduleName) => {    const allowedModules = ['path', 'url', 'util'];    if (!allowedModules.includes(moduleName)) {      throw new Error(`Module '${moduleName}' is not allowed`);    }    return require(moduleName);  }};// Contextify the objectvm.createContext(context);// Run code in the custom contextconst code = `  console.log('Current time:', utils.formatDate());  console.log('Generated ID:', utils.generateId());    try {    const fs = require('fs'); // This will throw an error  } catch (err) {    console.error('Security error:', err.message);  }    // This will work as it's an allowed module  const path = require('path');  console.log('Current directory:', path.dirname('/path/to/file.txt'));`;try {  vm.runInContext(code, context, { filename: 'custom-context.js' });} catch (err) {  console.error('Script execution failed:', err);}
```

### 2\. Module System in VM

Implement a simple module system within a VM context:

```javascript
const vm = require('vm');const fs = require('fs');const path = require('path');class VMModuleSystem {  constructor(basePath = '.') {    this.basePath = path.resolve(basePath);    this.cache = new Map();    this.context = vm.createContext({      module: { exports: {} },      exports: {},      console: console,      require: this.require.bind(this),      __dirname: this.basePath,      __filename: path.join(this.basePath, 'main.js')    });  }    require(modulePath) {    // Handle core modules    if (require.resolve.paths(modulePath) === null) {      return require(modulePath);    }        // Resolve the module path    const resolvedPath = this.resolveModule(modulePath);        // Check cache    if (this.cache.has(resolvedPath)) {      return this.cache.get(resolvedPath).exports;    }        // Create new module    const module = { exports: {} };    this.cache.set(resolvedPath, module);        try {      // Read and execute the module      const code = fs.readFileSync(resolvedPath, 'utf8');      const wrapper = `(function(module, exports, require, __dirname, __filename) {${code}\n})`;            const script = new vm.Script(wrapper, {        filename: resolvedPath,        lineOffset: 0,        displayErrors: true      });            const localRequire = (path) => this.require(path);      localRequire.resolve = (request) => this.resolveModule(request, resolvedPath);            script.runInNewContext({        module: module,        exports: module.exports,        require: localRequire,        __dirname: path.dirname(resolvedPath),        __filename: resolvedPath      });            return module.exports;    } catch (err) {      this.cache.delete(resolvedPath);      throw err;    }  }    resolveModule(request, parentPath) {    try {      // Try to resolve as a file      if (request.startsWith('./') || request.startsWith('../')) {        const resolved = path.resolve(path.dirname(parentPath || this.basePath), request);                // Try with .js extension        try {          const stats = fs.statSync(resolved + '.js');          if (stats.isFile()) return resolved + '.js';        } catch (e) {}                // Try as directory with index.js        try {          const indexPath = path.join(resolved, 'index.js');          const stats = fs.statSync(indexPath);          if (stats.isFile()) return indexPath;        } catch (e) {}                // Try as file without extension        try {          const stats = fs.statSync(resolved);          if (stats.isFile()) return resolved;        } catch (e) {}      }            // Try to resolve as a module      try {        return require.resolve(request);      } catch (e) {        throw new Error(`Cannot find module '${request}'`);      }    } catch (err) {      throw new Error(`Cannot find module '${request}': ${err.message}`);    }  }    runFile(filePath) {    const absolutePath = path.resolve(this.basePath, filePath);    return this.require(absolutePath);  }}// Example usageconst moduleSystem = new VMModuleSystem(__dirname);try {  // This will execute the file in the VM with the custom module system  moduleSystem.runFile('example-module.js');} catch (err) {  console.error('Module execution failed:', err);}
```

* * *

## Security Best Practices

When using the VM module, security should be your top priority. Here are some best practices:

```javascript
const vm = require('vm');const { execSync } = require('child_process');// UNSAFE: Directly executing untrusted codefunction unsafeEval(code) {  // This is dangerous as it has access to the entire Node.js environment  return vm.runInThisContext(code);}// SAFER: Isolated context with limited accessfunction safeEval(code, timeout = 1000) {  // Create a context with only the necessary globals  const context = {    console: {      log: console.log,      error: console.error    },    // Add safe utilities    Math: Object.create(null),    JSON: {      parse: JSON.parse,      stringify: JSON.stringify    },    // Add a safe setTimeout with limits    setTimeout: (fn, delay) => {      if (delay > 1000) delay = 1000; // Cap delay at 1 second      return setTimeout(fn, delay);    }  };    // Copy safe methods from Math  Object.getOwnPropertyNames(Math)    .filter(prop => typeof Math[prop] === 'function')    .forEach(prop => {      context.Math[prop] = Math[prop];    });    // Create the context without prototype access  const sandbox = vm.createContext(context, {    name: 'sandbox',    codeGeneration: {      strings: false,      wasm: false    }  });    // Run the code with a timeout  try {    const script = new vm.Script(`      (function() {        "use strict";        ${code}      })();    `, {      filename: 'sandbox.js',      lineOffset: 0,      displayErrors: true,      timeout: timeout,      microtaskMode: 'afterEvaluate'    });        return script.runInContext(sandbox, { timeout });  } catch (err) {    console.error('Script execution failed:', err.message);    throw new Error('Script execution failed');  }}// Example of safe evaluationtry {  const result = safeEval(`    function add(a, b) { return a + b; }    add(2, 3);  `);  console.log('Safe evaluation result:', result); // Outputs: 5    // This will be caught by our safe evaluator  safeEval('process.exit(1)');} catch (err) {  console.error('Caught error:', err.message);}// Example of security risksconsole.log('\nTesting security risks:');try {  console.log('1. Accessing process:');  safeEval('process.versions.node');} catch (err) {  console.log('✓ Blocked access to process object');}try {  console.log('2. Infinite loop:');  safeEval('while(true){}');} catch (err) {  console.log('✓ Caught infinite loop with timeout');}try {  console.log('3. Prototype pollution:');  safeEval('({}).constructor.prototype.polluted = true');  console.log('✓ Blocked prototype pollution');} catch (err) {  console.log('✓ Blocked prototype pollution');}
```

**Important:** The VM module is not a security boundary. For running truly untrusted code, consider using dedicated sandboxing solutions like Docker, AWS Lambda, or Google Cloud Functions.

* * *

## Performance Optimization

Optimize VM performance with these techniques:

```javascript
const vm = require('vm');const { performance, PerformanceObserver } = require('perf_hooks');// 1. Compile once, run many timesconst expensiveCalculation = new vm.Script(`  function calculate(n) {    let result = 0;    for (let i = 0; i < n; i++) {      result += Math.sqrt(i) * Math.PI;    }    return result;  }    // Return the function reference  calculate;`);// Create a contextconst context = { Math };vm.createContext(context);// Run once to get the functionconst calculate = expensiveCalculation.runInContext(context);// Now we can call the function multiple times without recompilingconsole.log('Result (n=1000):', calculate(1000));console.log('Result (n=2000):', calculate(2000));// 2. Use code caching for better performanceconst cache = new Map();function compileWithCache(code, filename) {  if (cache.has(code)) {    console.log(`Using cached script for ${filename}`);    return cache.get(code);  }    console.log(`Compiling script for ${filename}`);  const script = new vm.Script(code, {    filename,    cachedData: null, // Will be populated on first run    produceCachedData: true  });    cache.set(code, script);  return script;}// 3. Measure performancefunction measurePerformance() {  const obs = new PerformanceObserver((items) => {    const entry = items.getEntries()[0];    console.log(`\nExecution time for ${entry.name}: ${entry.duration.toFixed(2)}ms`);    performance.clearMarks();  });  obs.observe({ entryTypes: ['measure'] });    // Test with different script sizes  const smallScript = new vm.Script('let sum = 0; for (let i = 0; i < 1000; i++) sum += i; return sum;');  const largeScript = new vm.Script(`    function processData(data) {      return data.map(x => ({        ...x,        processed: true,        timestamp: Date.now(),        hash: require('crypto').createHash('md5').update(JSON.stringify(x)).digest('hex')      }));    }        // Process sample data    const data = Array(1000).fill(null).map((_, i) => ({ id: i, value: Math.random() }));    return processData(data);  `);    // Measure execution  performance.mark('small-start');  smallScript.runInThisContext();  performance.mark('small-end');    performance.mark('large-start');  largeScript.runInThisContext();  performance.mark('large-end');    performance.measure('Small script execution', 'small-start', 'small-end');  performance.measure('Large script execution', 'large-start', 'large-end');}// Run performance testmeasurePerformance();// 4. Reuse contexts for better performancefunction createOptimizedContext() {  const context = {    // Only include what's necessary    console: {      log: console.log,      error: console.error    },    // Add required globals    setTimeout,    clearTimeout,    // Add custom utilities    utils: {      formatNumber: n => new Intl.NumberFormat().format(n),      formatDate: d => d.toISOString()    }  };    // Create context once  vm.createContext(context);  return context;}// Reuse the same context for multiple scriptsconst sharedContext = createOptimizedContext();// Run multiple scripts with the same contextfunction runWithSharedContext(code) {  try {    const script = new vm.Script(code);    return script.runInContext(sharedContext);  } catch (err) {    console.error('Script execution failed:', err);    throw err;  }}// Example usageconst script1 = 'console.log("Script 1:", utils.formatNumber(1234567.89));';const script2 = 'console.log("Script 2:", utils.formatDate(new Date()));';runWithSharedContext(script1);runWithSharedContext(script2);
```

**Performance Tips:**

1.  **Pre-compile scripts** when possible to avoid recompilation overhead
2.  **Reuse contexts** instead of creating new ones for each execution
3.  **Minimize context size** by only including necessary globals
4.  **Use code caching** for frequently executed scripts
5.  **Monitor performance** to identify bottlenecks
6.  **Consider worker threads** for CPU-intensive operations

* * *

* * *