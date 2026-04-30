# Node.js Get Started

* * *

## Download and Install Node.js

1.  Go to [https://nodejs.org](https://nodejs.org)
2.  Download the **LTS (Long Term Support)** version
3.  Run the installer and follow the instructions

### Verify Installation

Open your terminal/command prompt and type:

```javascript
node --versionnpm --version
```

You should see version numbers for both Node.js and npm (Node Package Manager).

* * *

## Troubleshooting

If the commands don't work:

*   Restart your terminal/command prompt
*   Make sure Node.js was added to your system's PATH during installation
*   On Windows, you might need to restart your computer

* * *

## Getting Started

Once you have installed Node.js, let's create your first server that says "Hello World!" in a web browser.

Create a file called `myfirst.js` and add this code:

```javascript
let http = require('http');http.createServer(function (req, res) {  res.writeHead(200, {'Content-Type': 'text/html'});  res.end('Hello World!');}).listen(8080);
```

Save the file on your computer, for example: `C:\Users\_Your Name_\myfirst.js`

This code creates a simple web server.

When someone visits your computer on port 8080, it will show "Hello World!".

* * *

## Command Line Interface

Node.js files must be initiated in the "Command Line Interface" program of your computer.

How to open the command line interface on your computer depends on the operating system.

For Windows users, press the start button and look for "Command Prompt", or simply write "cmd" in the search field.

Navigate to the folder that contains the file "myfirst.js", the command line interface window should look something like this:

```javascript
C:\Users\Your Name>_
```

* * *

* * *

## Initiate the Node.js File

The file you have just created must be initiated by Node.js before any action can take place.

Start your command line interface, write `node myfirst.js` and hit enter:

```javascript
C:\Users\Your Name>node myfirst.js
```

Now, your computer works as a server!

If anyone tries to access your computer on port 8080, they will get a "Hello World!" message in return!

Start your internet browser, and type in the address: [http://localhost:8080](http://localhost:8080)

* * *

* * *