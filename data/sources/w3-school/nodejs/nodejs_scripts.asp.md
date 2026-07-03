# Node.js NPM Scripts

* * *

## What are NPM Scripts?

NPM scripts are commands you define in your **package.json** file to automate tasks like:

*   Running your app
*   Testing
*   Building
*   Cleaning up files

They make it easy to manage common tasks with simple commands.

* * *

## Defining Scripts in package.json

Inside **package.json**, the `scripts` section lets you name and define commands:

```javascript
{  "scripts": {    "start": "node index.js",    "test": "echo \"Running tests...\" && exit 0",    "dev": "nodemon index.js"  }}
```

Each script can be run from the command line using `npm run <script-name>`.

* * *

* * *

## Running NPM Scripts

To run a script, use:

```javascript
npm run dev
```

For the special **start** script, you can just use:

```javascript
npm start
```

And for **test**:

```javascript
npm test
```

* * *

## Common Uses for NPM Scripts

*   Start your app
*   Run tests
*   Use tools like nodemon or webpack
*   Build or bundle your code
*   Lint or format your code

* * *

## Summary

NPM scripts help automate and simplify project tasks.

Define them in **package.json** and run them easily with npm.

* * *

* * *