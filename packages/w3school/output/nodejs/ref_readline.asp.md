# Node.js Readline Module

* * *

## Introduction to the Readline Module

The Readline module is a core Node.js module that provides an interface for reading data from a Readable stream (like `process.stdin`) one line at a time.

It's particularly useful for:

#### Common Use Cases

*   Interactive command-line applications
*   Configuration wizards and setup tools
*   Command-line games
*   REPL (Read-Eval-Print Loop) environments
*   Processing large text files line by line
*   Building custom shells and CLIs

#### Key Features

*   Line-by-line input processing
*   Customizable prompts and formatting
*   Tab completion support
*   History management
*   Event-driven interface
*   Promise-based API support

**Note:** The Readline module is built into Node.js, so no additional installation is required.

It's perfect for any application that needs to interact with users through the command line or process text input in a line-oriented way.

* * *

## Getting Started with Readline

Here's a quick example of using the Readline module to create a simple interactive command-line application:

```javascript
const readline = require('readline');// Create interface for input/outputconst rl = readline.createInterface({  input: process.stdin,  output: process.stdout});// Ask a question and handle the responserl.question('What is your name? ', (name) => {  console.log(`Hello, ${name}!`);  // Ask follow-up question  rl.question('How old are you? ', (age) => {    console.log(`In 5 years, you'll be ${parseInt(age) + 5} years old.`);    // Close the interface when done    rl.close();  });});// Handle application exitrl.on('close', () => {  console.log('Goodbye!');  process.exit(0);});
```

* * *

* * *

## Importing and Setup

The Readline module can be imported in several ways depending on your module system and needs:

```javascript
// Basic requireconst readline = require('readline');// Import specific methods using destructuringconst { createInterface } = require('readline');// Create interface with default settingsconst rl = createInterface({  input: process.stdin,  output: process.stdout});
```
```javascript
// Using default importimport readline from 'readline';// Using named importsimport { createInterface } from 'readline';// Dynamic import (Node.js 14+)const { createInterface } = await import('readline');// Create interfaceconst rl = createInterface({  input: process.stdin,  output: process.stdout});
```

**Best Practice:** Always close the readline interface using `rl.close()` when you're done with it to free up system resources and allow your program to exit cleanly.

* * *

## Creating a Readline Interface

The `createInterface` method is the main way to create a readline interface. It takes an options object with several configuration properties:

```javascript
const readline = require('readline');// Create a basic interfaceconst rl = readline.createInterface({  input: process.stdin, // Readable stream to listen to  output: process.stdout, // Writable stream to write to  prompt: '> ', // Prompt to display (default: '> ')});
```

**Common Options:**

*   `input`: The Readable stream to listen to (default: `process.stdin`)
*   `output`: The Writable stream to write to (default: `process.stdout`)
*   `prompt`: The prompt string to use (default: '> ')
*   `terminal`: If true, treats the output as a TTY (default: `output.isTTY`)
*   `historySize`: Maximum number of history entries (default: 30)
*   `removeHistoryDuplicates`: If true, removes duplicate history entries (default: false)
*   `completer`: Optional function for tab auto-completion
*   `crlfDelay`: Delay between CR and LF (default: 100ms)
*   `escapeCodeTimeout`: Time to wait for character escape sequences (default: 500ms)

```javascript
const readline = require('readline');const fs = require('fs');// Create an interface with advanced optionsconst rl = readline.createInterface({  input: fs.createReadStream('input.txt'), // Read from file  output: process.stdout, // Write to console  terminal: false, // Input is not a terminal  historySize: 100, // Larger history  removeHistoryDuplicates: true, // Don't store duplicate commands  prompt: 'CLI> ', // Custom prompt  crlfDelay: Infinity, // Handle all CR/LF as single line break  escapeCodeTimeout: 200 // Faster escape code detection});// Handle each line from the filerl.on('line', (line) => {  console.log(`Processing: ${line}`);});// Handle end of filerl.on('close', () => {  console.log('Finished processing file');});
```

**Note:** When creating interfaces for file processing, set `terminal: false` to disable TTY-specific features and improve performance.

* * *

## Basic Readline Methods

The Readline module provides several methods for interacting with the user. Here are the most commonly used ones:

### 1\. `rl.question(query, callback)`

Displays a query to the user and invokes the callback with the user's response. This is one of the most commonly used methods for simple user interactions.

```javascript
const readline = require('readline');const rl = readline.createInterface({  input: process.stdin,  output: process.stdout});rl.question('What is your name? ', (name) => {  console.log(`Hello, ${name}!`);  rl.close();});
```
```javascript
function askQuestion(query) {  return new Promise(resolve => {    rl.question(query, resolve);  });}async function userSurvey() {  try {    const name = await askQuestion('What is your name? ');    const age = await askQuestion('How old are you? ');    const email = await askQuestion('What is your email? ');    console.log('\n=== User Information ===');    console.log(`Name: ${name}`);    console.log(`Age: ${age}`);    console.log(`Email: ${email}`);  } catch (error) {    console.error('An error occurred:', error);  } finally {    rl.close();  }}userSurvey();
```

**Best Practices for `rl.question()`:**

*   Always handle errors in the callback function
*   Consider using promises or async/await for better flow control with multiple questions
*   Validate user input before processing
*   Always close the interface when done to free up resources

### 2\. `rl.prompt([preserveCursor])`

Writes the current prompt to output and waits for user input. The optional `preserveCursor` parameter (boolean) determines if the cursor position should be preserved.

```javascript
const readline = require('readline');const rl = readline.createInterface({  input: process.stdin,  output: process.stdout,  prompt: 'CLI> '});// Display initial promptrl.prompt();// Handle each line of inputrl.on('line', (line) => {  const input = line.trim();  switch (input) {    case 'hello':      console.log('Hello there!');      break;    case 'time':      console.log(`Current time: ${new Date().toLocaleTimeString()}`);      break;    case 'exit':      rl.close();      return;    default:      console.log(`You entered: ${input}`);  }  // Show the prompt again  rl.prompt();});// Handle application exitrl.on('close', () => {  console.log('Goodbye!');  process.exit(0);});
```

**Tips for Using Prompts:**

*   Use `rl.setPrompt()` to change the prompt string dynamically
*   For multi-line prompts, include line breaks in the prompt string
*   Consider using a library like `chalk` to add colors to your prompts
*   Remember to call `rl.prompt()` after handling each input to show the prompt again

### 3\. `rl.write(data[, key])`

Writes data to the output stream. The optional `key` parameter can be used to simulate key presses.

```javascript
const readline = require('readline');const rl = readline.createInterface({  input: process.stdin,  output: process.stdout});// Display a welcome messagerl.write('Welcome to the CLI Application!\n');rl.write('='.repeat(30) + '\n\n');// Pre-fill a default valuerl.question('Enter your username: ', (username) => {  console.log(`Hello, ${username}!`);  // Simulate typing a default value  rl.write('default@example.com');  // Move cursor to the beginning of the line  rl.write(null, { ctrl: true, name: 'a' });  rl.question('Enter your email: ', (email) => {    console.log(`Your email is: ${email}`);    rl.close();  });});
```

**Common Use Cases for `rl.write()`:**

*   Displaying headers or section titles
*   Providing default values in prompts
*   Simulating user input for testing
*   Creating custom input formatting

### 4\. `rl.close()`

Closes the readline interface and releases control of the input and output streams. This is important to free up system resources and allow your program to exit cleanly.

```javascript
const readline = require('readline');const rl = readline.createInterface({  input: process.stdin,  output: process.stdout});// Handle application exitfunction exitApp() {  console.log('\nCleaning up resources...');  // Perform any necessary cleanup  // (e.g., close database connections, write logs, etc.)  // Close the readline interface  rl.close();}// Handle Ctrl+Crl.on('SIGINT', () => {  console.log('\nReceived SIGINT. Exiting...');  exitApp();});// Handle normal exitrl.on('close', () => {  console.log('Goodbye!');  process.exit(0);});// Start the applicationconsole.log('Application started. Press Ctrl+C to exit.');rl.prompt();
```

### 5\. `rl.pause()` and `rl.resume()`

These methods allow you to temporarily pause and resume the input stream, which can be useful for controlling the flow of user input.

```javascript
const readline = require('readline');const rl = readline.createInterface({  input: process.stdin,  output: process.stdout});let isPaused = false;console.log('Type "pause" to pause input, "resume" to continue, or "exit" to quit');rl.on('line', (input) => {  const command = input.trim().toLowerCase();  switch (command) {    case 'pause':      if (!isPaused) {        console.log('Input paused. Type "resume" to continue...');        rl.pause();        isPaused = true;      }      break;    case 'resume':      if (isPaused) {        console.log('Resuming input...');        rl.resume();        rl.prompt();        isPaused = false;      }      break;    case 'exit':      console.log('Goodbye!');      rl.close();      return;    default:      if (!isPaused) {        console.log(`You entered: ${input}`);        rl.prompt();      }  }});rl.prompt();
```

**When to Use Pause/Resume:**

*   When performing long-running operations that shouldn't be interrupted by user input
*   When temporarily disabling user input during certain operations
*   When implementing a paging mechanism for long outputs
*   When you need to throttle input processing

Method

Description

`rl.question(query, callback)`

Displays the query and waits for user input, then invokes the callback with the user's answer

`rl.prompt([preserveCursor])`

Displays the configured prompt for user input

`rl.write(data[, key])`

Writes data to the output stream, can also simulate keypress events

`rl.close()`

Closes the readline interface and relinquishes control of the input and output streams

`rl.pause()`

Pauses the readline input stream

`rl.resume()`

Resumes the readline input stream

* * *

## Using Promises with Readline

The Readline module's callback-based API can be wrapped in promises for more modern, async/await friendly code:

```javascript
const readline = require('readline');// Create interfaceconst rl = readline.createInterface({  input: process.stdin,  output: process.stdout});// Promise-based question functionfunction askQuestion(query) {  return new Promise(resolve => {    rl.question(query, resolve);  });}// Using async/await with readlineasync function main() {  try {    const name = await askQuestion('What is your name? ');    console.log(`Hello, ${name}!`);    const age = await askQuestion('How old are you? ');    console.log(`In 5 years, you'll be ${parseInt(age) + 5} years old.`);    const location = await askQuestion('Where do you live? ');    console.log(`${location} is a great place!`);    console.log('Thank you for your answers!');  } catch (error) {    console.error('Error:', error);  } finally {    rl.close();   }}// Run the main functionmain();
```

* * *

## Creating an Interactive CLI Menu

You can use the Readline module to create interactive menus for command-line applications:

```javascript
const readline = require('readline');// Create interfaceconst rl = readline.createInterface({  input: process.stdin,  output: process.stdout});// Menu optionsconst menu = {  1: 'Show current time',  2: 'Show system info',  3: 'Show memory usage',  4: 'Exit'};// Function to display menufunction displayMenu() {  console.log('\n===== MAIN MENU =====');  for (const [key, value] of Object.entries(menu)) {    console.log(`${key}: ${value}`);  }  console.log('====================\n');}// Function to handle menu selectionasync function handleMenu() {  let running = true;  while (running) {    displayMenu();    const answer = await askQuestion('Select an option: ');    switch (answer) {      case '1':        console.log(`Current time: ${new Date().toLocaleTimeString()}`);        break;      case '2':        console.log('System info:');        console.log(`Platform: ${process.platform}`);        console.log(`Node.js version: ${process.version}`);        console.log(`Process ID: ${process.pid}`);        break;      case '3':        const memory = process.memoryUsage();        console.log('Memory usage:');        for (const [key, value] of Object.entries(memory)) {          console.log(`${key}: ${Math.round(value / 1024 / 1024 * 100) / 100} MB`);        }        break;      case '4':        console.log('Exiting program. Goodbye!');        running = false;        break;      default:        console.log('Invalid option. Please try again.');      }      if (running) {        await askQuestion('\nPress Enter to continue...');        console.clear(); // Clear console for better UX      }  }}// Promise-based question functionfunction askQuestion(query) {  return new Promise(resolve => {    rl.question(query, resolve);  });}// Start the interactive menuhandleMenu()  .finally(() => {    rl.close();  });
```

* * *

## Reading a File Line by Line

Besides interactive input, the Readline module can also read files line by line, which is useful for processing large text files efficiently:

```javascript
const fs = require('fs');const readline = require('readline');// Create a readable stream for the fileconst fileStream = fs.createReadStream('example.txt');// Create the readline interfaceconst rl = readline.createInterface({  input: fileStream,  crlfDelay: Infinity // Recognize all instances of CR LF as a single line break});// Counter for line numberslet lineNumber = 0;// Process file line by linerl.on('line', (line) => {  lineNumber++;  console.log(`Line ${lineNumber}: ${line}`);});// Handle end of filerl.on('close', () => {  console.log(`Finished reading file with ${lineNumber} lines.`);});
```

**Note:** This approach is memory-efficient for large files as it processes one line at a time rather than loading the entire file into memory.

* * *

## Tab Completion

Tab completion enhances the user experience by providing command and file path suggestions. The Readline module allows you to implement custom completion logic:

**How Tab Completion Works:**

*   User presses the Tab key
*   Readline calls your completer function with the current line and cursor position
*   Your function returns completion suggestions
*   Readline displays the completions or auto-completes if there's only one match

```javascript
const readline = require('readline');const fs = require('fs');const path = require('path');// Available commands for autocompletionconst commands = ['help', 'exit', 'list', 'clear', 'info', 'version', 'history'];// Create the readline interface with a completer functionconst rl = readline.createInterface({  input: process.stdin,  output: process.stdout,  prompt: 'myapp> ',  completer: function(line) {    // Command completion    if (!line.includes(' ')) {      const hits = commands.filter(c => c.startsWith(line));      // Show all completions if none matches      return [hits.length ? hits : commands, line];    }    // File path completion (for commands like "list ")    if (line.startsWith('list ')) {      const dir = line.split(' ')[1] || '.';      try {        let completions = fs.readdirSync(dir);        // Add trailing slash to directories        completions = completions.map(file => {          const fullPath = path.join(dir, file);          return fs.statSync(fullPath).isDirectory() ? file + '/' : file;        });        const hits = completions.filter(c => c.startsWith(line.split(' ')[1] || ''));        return [hits.length ? hits : completions, line.split(' ')[1] || ''];      } catch (err) {        return [[], line];      }    }    return [[], line];  }});// Set the promptrl.prompt();// Handle commandsrl.on('line', (line) => {  line = line.trim();  switch (true) {    case line === 'help':      console.log('Available commands:');      commands.forEach(cmd => console.log(` ${cmd}`));      break;    case line === 'exit':      console.log('Goodbye!');      rl.close();      return;    case line.startsWith('list'):      const dir = line.split(' ')[1] || '.';      try {        const files = fs.readdirSync(dir);        console.log(`Contents of ${dir}:`);        files.forEach(file => {          const stats = fs.statSync(path.join(dir, file));          console.log(` ${file}${stats.isDirectory() ? '/' : ''}`);        });      } catch (err) {        console.error(`Error listing directory: ${err.message}`);      }      break;    case line === 'clear':      console.clear();      break;    case line === 'info':      console.log('Node.js CLI Example');      console.log(`Version: 1.0.0`);      break;    case line === 'version':      console.log(`Node.js version: ${process.version}`);      break;    case line === 'history':      // Note: This requires storing history manually      console.log('History feature not fully implemented.');      break;    case line === '':      // Do nothing for empty lines      break;    default:      console.log(`Unknown command: ${line}`);      console.log('Type "help" for available commands');    }    rl.prompt();}).on('close', () => {    console.log('CLI terminated.');    process.exit(0);});// Handle Ctrl+Crl.on('SIGINT', () => {    rl.question('Are you sure you want to exit? (y/n) ', (answer) => {      if (answer.toLowerCase() === 'y') {        rl.close();      } else {        rl.prompt();      }  });});
```

* * *

## Multi-Line Input

The Readline module excels at handling multi-line input, making it perfect for text editors, code editors, or any application that needs to collect multiple lines of text from users. Here's how to implement it effectively:

**Multi-Line Input Strategies:**

*   **End Marker:** Use a special sequence (like `.end`) to signal the end of input
*   **Bracket Matching:** Automatically detect when all opened brackets/parentheses are closed
*   **Dedicated Command:** Provide a specific command to submit multi-line input
*   **Timeout-Based:** Use a timer to detect when the user is done typing

```javascript
const readline = require('readline');// Create interfaceconst rl = readline.createInterface({  input: process.stdin,  output: process.stdout,  prompt: '> '});console.log('Enter your multi-line input. Type ".end" on a new line to finish:');rl.prompt();// Store linesconst lines = [];// Handle inputrl.on('line', (line) => {   // Check for end command   if (line.trim() === '.end') {     console.log('\nYour complete input:');     console.log('-'.repeat(30));     console.log(lines.join('\n'));     console.log('-'.repeat(30));     // Process the input (example: count words)     const text = lines.join(' ');     const wordCount = text.split(/\s+/).filter(Boolean).length;     const charCount = text.length;     console.log(`\nStatistics:`);     console.log(`Lines: ${lines.length}`);     console.log(`Words: ${wordCount}`);     console.log(`Characters: ${charCount}`);     rl.close();     return;  }  // Add line to collection  lines.push(line);  rl.prompt();});
```

* * *

## Building a Simple REPL

A Read-Eval-Print Loop (REPL) is an interactive programming environment that reads user input, evaluates it, and prints the result.

The Readline module is perfect for building custom REPLs. Here's a comprehensive guide to creating your own:

**Key Components of a REPL:**

*   **Read:** Accept user input line by line
*   **Eval:** Parse and evaluate the input
*   **Print:** Display the result or any output
*   **Loop:** Return to the input prompt for the next command
*   **Special Commands:** Handle commands like `.help`, `.exit`
*   **Error Handling:** Gracefully handle syntax errors and exceptions

```javascript
const readline = require('readline');const vm = require('vm');// Create interfaceconst rl = readline.createInterface({  input: process.stdin,  output: process.stdout,  prompt: 'js> '});// Create context for evaluating codeconst context = vm.createContext({  console,  Number,  String,  Array,  Object,  // Add any other global variables you want to make available  // You can also add your own functions  add: (a, b) => a + b,  multiply: (a, b) => a * b});console.log('Simple JavaScript REPL (Press Ctrl+C to exit)');console.log('Type JavaScript code and press Enter to evaluate');// Show the promptrl.prompt();// Track multi-line inputlet buffer = '';// Handle inputrl.on('line', (line) => {  // Add the line to our buffer  buffer += line;  try {    // Try to evaluate the code    const result = vm.runInContext(buffer, context);    // Display the result    console.log('\x1b[33m%s\x1b[0m', '=> ' + result);    // Reset the buffer after successful evaluation    buffer = '';  } catch (error) {    // If it's a syntax error and might be due to incomplete input,    // continue collecting input    if (error instanceof SyntaxError &&      error.message.includes('Unexpected end of input')) {      // Continue in multi-line mode      rl.setPrompt('... ');    } else {      // It's a real error, show it and reset buffer      console.error('\x1b[31m%s\x1b[0m', 'Error: ' + error.message);      buffer = '';      rl.setPrompt('js> ');    }  }  rl.prompt();});// Handle Ctrl+Crl.on('SIGINT', () => {  if (buffer.length > 0) {    // If there's pending input, clear it    console.log('\nInput cleared');    buffer = '';    rl.setPrompt('js> ');    rl.prompt();  } else {    // Otherwise exit    rl.question('\nAre you sure you want to exit? (y/n) ', (answer) => {      if (answer.toLowerCase() === 'y') {        console.log('Goodbye!');        rl.close();      } else {        rl.prompt();      }    });  }});rl.on('close', () => {  console.log('REPL closed');  process.exit(0);});
```

* * *

## Best Practices

1.  **Always close the interface**: Call `rl.close()` when you're done to clean up resources.
2.  **Handle errors**: Implement error handling for all readline operations.
3.  **Use promises**: Wrap callback-based methods in promises for cleaner async code.
4.  **Consider UX**: Provide clear prompts and feedback to users.
5.  **Use event handlers**: Leverage the event-based nature of readline for complex interactions.
6.  **Memory management**: Be careful with large files; process them line by line.
7.  **Add keyboard shortcuts**: Implement handlers for common keyboard shortcuts (Ctrl+C, Ctrl+D).

* * *

## Readline vs. Other Input Methods

Method

Pros

Cons

Best For

Readline

Line-by-line processing, interactive input, history, completion

More code for complex interfaces

CLIs, interactive prompts, REPLs

process.stdin

Low-level control, raw data

Harder to use, manual buffering

Binary input, custom protocols

Inquirer.js (3rd party)

Rich UI, many input types, validation

External dependency

Complex forms, surveys, config wizards

Commander.js (3rd party)

Command definition, option parsing

Less interactive

Command-line tools with arguments

* * *

## Summary

The Node.js Readline module provides a simple yet powerful way to create interactive command-line interfaces, process text input line by line, and build tools that require user interaction.

It's particularly useful for:

*   Creating interactive command prompts
*   Building CLI applications with user input
*   Processing files line by line
*   Implementing custom REPL environments
*   Developing text-based interfaces and games

While simple on the surface, combining Readline with promises, event handling, and proper UX considerations allows you to build sophisticated command-line applications that provide a great user experience.

* * *

* * *