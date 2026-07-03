# TypeScript Getting Started

* * *

## TypeScript Compiler

TypeScript is transpiled into JavaScript using a compiler.

TypeScript being converted into JavaScript means it runs anywhere that JavaScript runs!

* * *

## Installing the Compiler

TypeScript has an official compiler which can be installed through npm.

Learn more about npm, and how to get started here: [What is npm?](https://www.w3schools.com/whatis/whatis_npm.asp)

Within your npm project, run the following command to install the compiler:

```javascript
npm install typescript --save-dev
```

Which should give you an output similar to:

```javascript
added 1 package, and audited 2 packages in 2sfound 0 vulnerabilities
```

The compiler is installed in the `node_modules` directory and can be run with: `npx tsc`.

```javascript
npx tsc
```

Which should give you an output similar to:

```javascript
Version 4.5.5tsc: The TypeScript Compiler - Version 4.5.5
```

Followed by a list of all the Common Commands.

* * *

## Installing Globally

Installing TypeScript _globally_ means adding the `tsc` command to your system `PATH` so it is available from any folder.

```javascript
npm install -g typescript
```
```javascript
tsc -v
```

**Pros**

*   Quick access to `tsc` from any project or directory.
*   Useful for trying commands, learning, or one-off scripts.
*   Some editors or tools can discover a global compiler automatically.

**Cons**

*   Different machines (or teammates) may have different global versions.
*   Can drift from the version your project expects, causing subtle issues.
*   May require elevated permissions on some systems to install globally.

Best practice is to install TypeScript as a project `devDependency` and run it with `npx tsc` so the exact version is consistent across environments. A global install is optional and convenient for ad-hoc usage.

* * *

* * *

## Configuring the compiler

By default the TypeScript compiler will print a help message when run in an empty project.

The compiler can be configured using a `tsconfig.json` file.

You can have TypeScript create `tsconfig.json` with the recommended settings with:

```javascript
npx tsc --init
```

Which should give you an output similar to:

```javascript
Created a new tsconfig.json with:TS  target: es2016  module: commonjs  strict: true  esModuleInterop: true  skipLibCheck: true  forceConsistentCasingInFileNames: true
```

You can learn more at [TypeScript Config](typescript_config.php.html)

Here is an example of more things you could add to the `tsconfig.json` file:

```javascript
{  "include": ["src"],  "compilerOptions": {    "outDir": "./build"  }}
```

You can open the file in an editor to add those options.

This will configure the TypeScript compiler to transpile TypeScript files located in the `src/` directory of your project, into JavaScript files in the `build/` directory.

* * *

## Your First TypeScript Program

Let's create a simple "Hello, World!" program to verify your TypeScript setup.

1.  Create a new file named `hello.ts` with the following content:

```javascript
function greet(name: string): string {  return `Hello, ${name}!`;}const message: string = greet("World");console.log(message);
```

2.  Compile your TypeScript code:

```javascript
npx tsc hello.ts
```

This will generate a `hello.js` file in the same directory:

```javascript
function greet(name) {  return "Hello, ".concat(name, "!");}const message = greet("World");console.log(message);
```

3.  Run the compiled JavaScript:

```javascript
node hello.js
```

You should see the output:

```javascript
Hello, World!
```

**Note:** If you're using the `tsconfig.json` configuration mentioned earlier, you would place your TypeScript files in the `src` directory and the compiled JavaScript will appear in the `build` directory.

* * *

* * *