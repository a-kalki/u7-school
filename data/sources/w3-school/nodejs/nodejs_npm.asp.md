# Node.js NPM

* * *

## What is NPM?

NPM is a package manager for Node.js packages, or modules if you like.

[www.npmjs.com](https://www.npmjs.com) hosts thousands of free packages to download and use.

The NPM program is installed on your computer when you install Node.js

If you installed Node.js, NPM is already ready to run on your computer!

* * *

## What is a Package?

A package in Node.js contains all the files you need for a module.

Modules are JavaScript libraries you can include in your project.

* * *

## Download a Package

Downloading a package is very easy.

Open the command line interface and tell NPM to download the package you want.

I want to download a package called "upper-case":

```javascript
C:\Users\Your Name>npm install upper-case
```

Now you have downloaded and installed your first package!

NPM creates a folder named "node\_modules", where the package will be placed.

All packages you install in the future will be placed in this folder.

My project now has a folder structure like this:

`C:\Users\_My Name_\node_modules\upper-case`

* * *

* * *

## Using a Package

Once the package is installed, it is ready to use.

Include the "upper-case" package the same way you include any other module:

```javascript
let uc = require('upper-case');
```

Create a Node.js file that will convert the output "Hello World!" into upper-case letters:

```javascript
let http = require('http');let uc = require('upper-case');http.createServer(function (req, res) {  res.writeHead(200, {'Content-Type': 'text/html'});  res.write(uc.upperCase("Hello World!"));  res.end();}).listen(8080);
```

Save the code above in a file called "demo\_uppercase.js", and initiate the file:

```javascript
C:\Users\Your Name>node demo_uppercase.js
```

If you have followed the same steps on your computer, you will see the same result as the example: [http://localhost:8080](http://localhost:8080)

* * *

## Global Packages

Packages can be installed globally, making them available as command-line tools anywhere on your system.

Global packages are typically used for CLI tools and utilities.

```javascript
npm install -g package-name
```
```javascript
npm install -g http-server
```

**Note:** On some systems, you might need administrator/root privileges to install packages globally.

On Unix-like systems, use `sudo` before the command.

* * *

## Updating Packages

To keep your packages up to date, you can update them using the following commands:

```javascript
npm update package-name
```
```javascript
npm update
```
```javascript
npm outdated
```

**Tip:** To update npm itself, run: `npm install -g npm@latest`

* * *

## Uninstalling a Package

To remove a package that you no longer need, you can use the uninstall command:

```javascript
npm uninstall package-name
```
```javascript
npm uninstall -g package-name
```
```javascript
npm uninstall --save package-name
```

**Note:** The `--save` flag updates your package.json file to remove the dependency.

For older versions of npm, you might need to use `--save-dev` for development dependencies.

* * *

* * *