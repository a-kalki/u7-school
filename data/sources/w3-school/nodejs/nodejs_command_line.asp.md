# Node.js Command Line Usage

* * *

Node.js provides a powerful command line interface (CLI) that allows you to run JavaScript files, manage packages, debug applications, and more.

This guide covers the essential commands and techniques every Node.js developer should know.

**Note:** All commands should be run in a terminal or command prompt.

On Windows, you can use Command Prompt, PowerShell, or Windows Terminal.

On macOS/Linux, use Terminal.

* * *

## Basic Node.js Commands

These are the most common commands you'll use when working with Node.js applications:

```javascript
# Run a JavaScript filenode app.js# Run with additional argumentsnode app.js arg1 arg2# Run in watch mode (restarts on file changes)node --watch app.js
```

* * *

## Using the REPL

The Node.js REPL (Read-Eval-Print Loop) is an interactive shell for executing JavaScript code.

The REPL is started by running `node` in the terminal:

```javascript
> const name = 'Node.js';> console.log(`Hello, ${name}!`);> .help // Show available commands> .exit // Exit REPL
```

* * *

## Command Line Arguments

Access command line arguments using `process.argv`:

```javascript
// args.jsconsole.log('All arguments:', process.argv);console.log('First argument:', process.argv[2]);console.log('Second argument:', process.argv[3]);// Example usage:// node args.js hello world// Output:// All arguments: ['/path/to/node', '/path/to/args.js', 'hello', 'world']// First argument: hello// Second argument: world
```

* * *

## Environment Variables

Access and set environment variables:

```javascript
// env.jsconsole.log('Environment:', process.env.NODE_ENV || 'development');console.log('Custom variable:', process.env.MY_VARIABLE);console.log('Database URL:', process.env.DATABASE_URL || 'Not set');// Example usage with environment variables:// NODE_ENV=production MY_VARIABLE=test node env.js
```
```javascript
# Set environment variables when runningNODE_ENV=production MY_VARIABLE=test node env.js
```

* * *

* * *

## Debugging Node.js Applications

Node.js includes a powerful debugging system that integrates with Chrome DevTools:

```javascript
# Start with inspector (listens on default port 9229)node --inspect app.js# Break on first line of applicationnode --inspect-brk app.js# Specify a custom portnode --inspect=9222 app.js# Enable remote debugging (be careful with this in production)node --inspect=0.0.0.0:9229 app.js
```
```javascript

```

* * *

## Common CLI Tools

Node.js comes with several useful command-line tools:

```javascript
# Install and use different Node.js versionsnvm install 18.16.0 # Install specific versionnvm use 18.16.0 # Switch to versionnvm ls # List installed versions
```
```javascript
# Common npm commandsnpm init # Initialize a new projectnpm install # Install dependenciesnpm update # Update packagesnpm audit # Check for vulnerabilities
```

* * *

## Common Command Line Flags

Node.js provides several command-line flags to control its behavior. Here are some of the most useful ones:

```javascript
# Show Node.js versionnode --version # or -v# Show V8 versionnode --v8-options# Show command-line helpnode --help
```
```javascript
# Check syntax without executingnode --check app.js# Show stack traces for warningsnode --trace-warnings app.js# Set max memory (in MB)node --max-old-space-size=4096 app.js# Preload a module before executionnode --require dotenv/config app.js
```
```javascript
# Enable ES module loadernode --experimental-modules app.mjs# Enable experimental featuresnode --experimental-repl-await# Enable experimental worker threadsnode --experimental-worker
```

* * *

* * *