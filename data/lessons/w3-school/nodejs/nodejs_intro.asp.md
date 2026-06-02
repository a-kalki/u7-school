# Node.js Introduction

* * *

## What You'll Learn

In this tutorial, you'll learn:

*   How to install and run Node.js
*   Core concepts like modules and the event loop
*   How to build web servers and APIs
*   Working with databases and files
*   Deploying Node.js applications

* * *

## What is Node.js?

**Node.js** is a free, open-source JavaScript runtime that runs on Windows, Mac, Linux, and more.

It lets you execute JavaScript code outside of a web browser, enabling server-side development with JavaScript.

Built on Chrome's V8 JavaScript engine, Node.js is designed for building scalable network applications efficiently.

```javascript
console.log('Hello from Node.js!');
```

* * *

## Why Node.js?

Node.js excels at handling many simultaneous connections with minimal overhead, making it perfect for:

*   **Real-time applications** (chats, gaming, collaboration tools)
*   APIs and microservices
*   Data streaming applications
*   Command-line tools
*   Server-side web applications

Its non-blocking, event-driven architecture makes it highly efficient for I/O-heavy workloads.

* * *

* * *

## Asynchronous Programming

Node.js uses **asynchronous** (non-blocking) programming.

This means it can keep working while waiting for tasks like reading files or talking to a database.

With asynchronous code, Node.js can handle many things at once-making it fast and efficient.

```javascript
// Load the filesystem moduleconst fs = require('fs');// Read file asynchronouslyfs.readFile('myfile.txt', 'utf8', (err, data) => {  if (err) {    console.error('Error reading file: ' + err);    return;  }  console.log('File content: ' + data);});console.log('Reading file... (this runs first!)');
```

In this example:

1.  We load the built-in `fs` module
2.  We call `readFile` to read a file
3.  Node.js continues to the next line while reading the file
4.  When the file is read, our callback function runs

This non-blocking behavior lets Node.js handle many requests efficiently.

* * *

## What Can Node.js Do?

*   **Web Servers**: Create fast, scalable network applications
*   **File Operations**: Read, write, and manage files on the server
*   **Database Interaction**: Work with databases like MongoDB, MySQL, and more
*   **APIs**: Build RESTful services and GraphQL APIs
*   **Real-time**: Handle WebSockets for live applications
*   **CLI Tools**: Create command-line applications

```javascript
const http = require('http');http.createServer((req, res) => {  res.writeHead(200, {'Content-Type': 'text/plain'});  res.end('Hello World!');}).listen(8080);
```

* * *

## What is a Node.js File?

Node.js files contain code that runs on the server. They usually have the `.js` extension and can be started with the `node` command.

*   Node.js files run tasks when certain events happen (like a web request)
*   They must be started on the server to have any effect
*   They use JavaScript syntax

```javascript
node app.js
```

## Node.js Versions & LTS:

Node.js releases a new major version every six months.

For stability, use an **LTS (Long Term Support)** version for production projects.

* * *

* * *