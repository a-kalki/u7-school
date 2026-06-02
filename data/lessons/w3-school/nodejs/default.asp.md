# Node.js Tutorial

## What is Node.js?

**Node.js** is a free, open source tool that lets you run JavaScript outside the web browser.

With Node.js, you can build fast and scalable applications like web servers, APIs, tools, and more.

[Start learning Node.js now »](nodejs_intro.asp.html)

* * *

## What Can You Build With Node.js?

Node.js uses an **event-driven**, **non-blocking** model.

It can handle many connections at once without waiting for one to finish before starting another.

This makes it great for real-time apps and high-traffic websites.

Here are some examples of what you can build with Node.js:

*   Web servers and websites
*   REST APIs
*   Real-time apps (like chat)
*   Command-line tools
*   Working with files and databases
*   IoT and hardware control

* * *

## How to Run Node.js Code

Save your code in a file, for example `app.js`, then run it in your terminal or command prompt with:

```javascript
node app.js
```

This will start your Node.js program.

* * *

* * *

## Learning by Examples

Our "Show Node.js" tool makes it easy to learn Node.js, it shows both the code and the result.

```javascript
let http = require('http');http.createServer(function (req, res) {  res.writeHead(200, {'Content-Type': 'text/plain'});  res.end('Hello World!');}).listen(8080);
```

**Click on the "Run example" button to see how it works.**

* * *

## Examples Running in the Command Line Interface

In this tutorial there will be some examples that are better explained by displaying the result in the command line interface.

When this happens, The "Show Node.js" tool will show the result in a black screen on the right:

```javascript
console.log('This example is different!');console.log('The result is displayed in the Command Line Interface');
```

**Click on the "Run example" button to see how it works.**

* * *

## Node.js Built-in Modules

Node.js comes with many **built-in modules** to help you work with files, servers, paths, the operating system, and more.

You can use them by importing them with `require()`.

```javascript
const os = require('os');console.log(os.platform());
```

See the [full list of built-in modules](ref_modules.asp.html).

* * *

## What is npm?

**npm** is the package manager for Node.js.

It helps you install and manage third-party packages (libraries) to add more features to your apps.

```javascript
npm install express
```

This command installs the popular **Express** web framework.

You can then use it in your code:

```javascript
const express = require('express');const app = express();app.get('/', (req, res) => res.send('Hello World!'));app.listen(8080);
```

* * *

## Download Node.js

Download Node.js from the official Node.js web site: [https://nodejs.org](https://nodejs.org/)

* * *

## Node.js Exercises

Many chapters in this tutorial end with an exercise where you can check your level of knowledge.

[See all Node.js Exercises](nodejs_exercises.asp.html)

* * *

## Node.js Quiz

Test your Node.js skills with a quiz.

[Start Node.js Quiz](nodejs_quiz.asp.html)

* * *