# Node.js Interface Reference

* * *

## Interface Object

The `Interface` class is part of the `readline` module in Node.js. It provides a way to read data from a Readable stream (such as `process.stdin`) one line at a time. It's commonly used for creating command-line interfaces (CLIs) and interactive prompts.

### Importing the readline Module

```javascript
// Import the readline moduleconst readline = require('readline');// Create an Interface instanceconst rl = readline.createInterface({  input: process.stdin,  output: process.stdout});
```

* * *

## Interface Properties

Property

Description

rl.line

The current input line being processed.

rl.cursor

The cursor position in the current line.

rl.input

The Readable stream being used.

rl.output

The Writable stream being used.

rl.terminal

A boolean indicating if the stream should be treated like a TTY and have ANSI/VT100 escape codes written to it.

rl.history

The history buffer if one was provided. This is not available when using the Promise-based API.

* * *

* * *

## Interface Methods

Method

Description

rl.question(query, callback)

Displays the `query` to the user and waits for their input. Once they provide it, calls `callback` with the user's input as its first argument.

rl.close()

Closes the Interface instance, relinquishing control over the input and output streams.

rl.pause()

Pauses the readline input stream, allowing it to be resumed later.

rl.resume()

Resumes the readline input stream.

rl.write(data\[, key\])

Writes `data` to the output stream. The `key` argument can be an object with special characters like `ctrl` or `meta`.

rl.prompt(\[preserveCursor\])

Displays the prompt for the user to input. If `preserveCursor` is `true`, the cursor position isn't reset.

rl.getPrompt()

Returns the current prompt string.

rl.setPrompt(prompt)

Sets the prompt string that will be displayed when `rl.prompt()` is called.

* * *

## Interface Events

Event

Description

'close'

Emitted when the Interface instance is closed.

'line'

Emitted when the user submits a line of input by pressing the Enter key.

'pause'

Emitted when the input stream is paused.

'resume'

Emitted when the input stream is resumed.

'SIGCONT'

Emitted when a Node.js process previously paused with Ctrl+Z (SIGTSTP) is resumed.

'SIGINT'

Emitted when Ctrl+C is pressed, known as SIGINT.

'SIGTSTP'

Emitted when Ctrl+Z is pressed, known as SIGTSTP.

'history'

Emitted whenever the history changes.

* * *

## Basic Usage Example

This example demonstrates the basic usage of the Interface object to create a simple command-line prompt:

```javascript
const readline = require('readline');// Create interface for reading from stdin and writing to stdoutconst rl = readline.createInterface({  input: process.stdin,  output: process.stdout});// Ask a question and get the user's inputrl.question('What is your name? ', (name) => {  console.log(`Hello, ${name}!`);  // Ask another question  rl.question('How are you today? ', (response) => {    console.log(`Glad to hear: ${response}`);        // Close the interface    rl.close();  });});// Handle the close eventrl.on('close', () => {  console.log('Interface closed. Goodbye!');});
```

* * *

## Promise-based API Example

Node.js v17+ provides a promise-based API for readline:

```javascript
// For Node.js v17 and above:const readline = require('readline/promises');const { stdin: input, stdout: output } = require('process');async function askQuestions() {  const rl = readline.createInterface({ input, output });  try {    // Ask questions sequentially    const name = await rl.question('What is your name? ');    console.log(`Hello, ${name}!`);    const age = await rl.question('How old are you? ');    console.log(`You are ${age} years old.`);    const location = await rl.question('Where do you live? ');    console.log(`${location} is a nice place!`);    // Summary    console.log('\nSummary:');    console.log(`Name: ${name}`);    console.log(`Age: ${age}`);    console.log(`Location: ${location}`);  } finally {    // Make sure to close the interface    rl.close();  }}// Run the async functionaskQuestions()  .then(() => console.log('Questions completed!'))  .catch(err => console.error('Error:', err));
```

* * *

## Command Line Interface Example

Building a simple command-line interface with history support:

```javascript
const readline = require('readline');const fs = require('fs');const path = require('path');// History file pathconst historyFile = path.join(__dirname, '.command_history');// Load command history if it existslet commandHistory = [];try {  if (fs.existsSync(historyFile)) {    commandHistory = fs.readFileSync(historyFile, 'utf8')      .split('\n')      .filter(cmd => cmd.trim());  }} catch (err) {  console.error('Error loading history:', err.message);}// Create the interface with custom configurationconst rl = readline.createInterface({  input: process.stdin,  output: process.stdout,  prompt: 'cli> ',  historySize: 100,  history: commandHistory});// Available commandsconst commands = {  help: () => {    console.log('\nAvailable commands:');    console.log('  help     - Show this help message');    console.log('  hello    - Say hello');    console.log('  date     - Show current date and time');    console.log('  clear    - Clear the console');    console.log('  exit     - Exit the CLI');    rl.prompt();  },  hello: () => {    console.log('Hello, world!');    rl.prompt();  },  date: () => {    console.log(new Date().toLocaleString());    rl.prompt();  },  clear: () => {    process.stdout.write('\x1Bc');    rl.prompt();  },  exit: () => {    // Save command history to file    try {      fs.writeFileSync(historyFile, rl.history.join('\n'));      console.log(`Command history saved to ${historyFile}`);    } catch (err) {      console.error('Error saving history:', err.message);    }        console.log('Goodbye!');    rl.close();  }};// Display welcome messageconsole.log('Simple CLI Example');console.log('Type "help" for available commands');// Display the promptrl.prompt();// Handle inputrl.on('line', (line) => {  const input = line.trim();    if (input === '') {    rl.prompt();    return;  }    const command = input.toLowerCase();    if (commands[command]) {    commands[command]();  } else {    console.log(`Command not found: ${input}`);    console.log('Type "help" for available commands');    rl.prompt();  }}).on('close', () => {  process.exit(0);});// Handle Ctrl+C (SIGINT)rl.on('SIGINT', () => {  rl.question('Are you sure you want to exit? (y/n) ', (answer) => {    if (answer.toLowerCase() === 'y') {      commands.exit();    } else {      console.log('Operation cancelled');      rl.prompt();    }  });});
```

* * *

## Interactive Password Input

Creating a password input that masks the entered characters:

```javascript
const readline = require('readline');// Create the interfaceconst rl = readline.createInterface({  input: process.stdin,  output: process.stdout});// Function to prompt for masked inputfunction promptPassword(query) {  return new Promise((resolve) => {    // Create a hidden readline instance to control input/output    const stdin = process.stdin;        // Save the original configuration    const originalStdinIsTTY = stdin.isTTY;    if (originalStdinIsTTY) {      stdin.setRawMode(true);    }        let password = '';        // Write the query    process.stdout.write(query);        // Handle keypress events    const onData = (key) => {      // Ctrl+C      if (key.toString() === '\u0003') {        process.stdout.write('\n');        process.exit();      }            // Enter key      if (key.toString() === '\r' || key.toString() === '\n') {        if (originalStdinIsTTY) {          stdin.setRawMode(false);        }        stdin.removeListener('data', onData);        process.stdout.write('\n');        resolve(password);        return;      }            // Backspace      if (key.toString() === '\u0008' || key.toString() === '\u007f') {        if (password.length > 0) {          password = password.slice(0, -1);          process.stdout.write('\b \b'); // Erase last character        }        return;      }            // Regular character      password += key.toString();      process.stdout.write('*'); // Show asterisk for each character    };        stdin.on('data', onData);  });}// Example usageasync function login() {  const username = await new Promise((resolve) => {    rl.question('Username: ', (answer) => {      resolve(answer);    });  });    const password = await promptPassword('Password: ');    console.log(`\nAttempting login for user: ${username}`);    // Simulate authentication check  if (username === 'admin' && password === 'password') {    console.log('Login successful!');  } else {    console.log('Invalid username or password');  }    rl.close();}// Start the login processlogin();
```

* * *

## Interactive Menu Example

Creating an interactive menu with options:

```javascript
const readline = require('readline');// Create the interfaceconst rl = readline.createInterface({  input: process.stdin,  output: process.stdout});// Menu optionsconst menuOptions = [  { id: 1, name: 'View Profile' },  { id: 2, name: 'Edit Settings' },  { id: 3, name: 'Check Messages' },  { id: 4, name: 'Log Out' },  { id: 5, name: 'Exit' }];// Display the menufunction displayMenu() {  console.log('\n===== MAIN MENU =====');  menuOptions.forEach(option => {    console.log(`${option.id}. ${option.name}`);  });  console.log('====================');}// Process the selected optionfunction processOption(option) {  const selectedOption = menuOptions.find(item => item.id === parseInt(option));    if (!selectedOption) {    console.log('Invalid option. Please try again.');    return promptUser();  }    console.log(`\nYou selected: ${selectedOption.name}`);    // Handle each option  switch (selectedOption.id) {    case 1:      console.log('Displaying user profile...');      console.log('Name: John Doe');      console.log('Email: john@example.com');      console.log('Role: Administrator');      break;    case 2:      console.log('Opening settings menu...');      console.log('(Settings options would be displayed here)');      break;    case 3:      console.log('Checking messages...');      console.log('You have no new messages.');      break;    case 4:      console.log('Logging out...');      console.log('You have been logged out successfully.');      return rl.close();    case 5:      console.log('Exiting the application...');      return rl.close();  }    // Return to the menu after a short delay  setTimeout(() => {    promptUser();  }, 1500);}// Prompt the user to select an optionfunction promptUser() {  displayMenu();  rl.question('Select an option: ', (answer) => {    processOption(answer);  });}// Start the menuconsole.log('Welcome to the Interactive Menu Example');promptUser();// Handle close eventrl.on('close', () => {  console.log('\nThank you for using the application!');  process.exit(0);});
```

* * *

## Best Practices

1.  **Always close the interface**: Be sure to call `rl.close()` when you're done to free up resources.
2.  **Handle Ctrl+C**: Listen for the 'SIGINT' event to handle program termination gracefully.
3.  **Use promise-based API**: For Node.js v17 and above, consider using the promise-based API for cleaner async code.
4.  **Save history**: For CLI applications, save and restore command history to provide a better user experience.
5.  **Handle errors**: Always handle potential errors when interacting with the user.
6.  **Provide clear prompts**: Make sure your prompts clearly indicate what type of input is expected.
7.  **Validate input**: Always validate user input before processing it.

* * *