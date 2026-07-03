# Node.js TypeScript

* * *

## What is TypeScript?

**TypeScript** is a superset of JavaScript that adds optional static typing.

It helps you catch errors early and write safer, more maintainable code.

Take a look at our [TypeScript tutorial](https://www.w3schools.com/typescript/index.php) for more details.

* * *

## Using TypeScript with Node.js

To use TypeScript in Node.js projects, you need to install TypeScript and a type definition manager:

```javascript
npm install -g typescriptnpm install --save-dev @types/node
```

Write your code in `.ts` files and compile them to JavaScript with:

```javascript
tsc yourfile.ts
```

* * *

## Setting Up a TypeScript Project

```javascript
npm init -y
```
```javascript
npm install --save-dev typescript @types/node
```
```javascript
npx tsc --init
```

* * *

## TypeScript Basics

```javascript
// Primitive typeslet isDone: boolean = false;let count: number = 10;let name: string = 'TypeScript';// Arrayslet numbers: number[] = [1, 2, 3];let names: Array<string> = ['Alice', 'Bob'];// Tupleslet user: [string, number] = ['Alice', 25];// Enumsenum Color {Red, Green, Blue}let color: Color = Color.Green;
```
```javascript
// Interface interface User {  id: number;  name: string;  email?: string; // Optional property}// Type aliastype Point = {  x: number;  y: number;};// Using the interfacefunction printUser(user: User) {  console.log(`User: ${user.name}`);}
```

* * *

* * *

## TypeScript with Node.js

```javascript
// server.tsimport http from 'http';const server = http.createServer((req, res) => {  res.statusCode = 200;  res.setHeader('Content-Type', 'text/plain');  res.end('Hello, TypeScript!');});const PORT = process.env.PORT || 3000;server.listen(PORT, () => {  console.log(`Server running on port ${PORT}`);});
```
```javascript
# Install required packagesnpm install expressnpm install --save-dev @types/express
```

* * *

## TypeScript Configuration

```javascript
{  "compilerOptions": {    "target": "es2018",    "module": "commonjs",    "outDir": "./dist",    "rootDir": "./src",    "strict": true,    "esModuleInterop": true,    "skipLibCheck": true,    "forceConsistentCasingInFileNames": true  },  "include": ["src/**/*"],  "exclude": ["node_modules"]}
```

**Key Compiler Options:**

*   `target`: Specify ECMAScript target version
*   `module`: Specify module code generation
*   `strict`: Enable all strict type checking options
*   `outDir`: Redirect output structure to the directory
*   `rootDir`: Specify the root directory of input files

* * *

## Why Use TypeScript with Node.js?

**Benefits of TypeScript:**

*   **Type Safety**: Catch errors at compile time rather than runtime
*   **Better IDE Support**: Superior autocompletion and code navigation
*   **Self-Documenting Code**: Types serve as documentation
*   **Easier Refactoring**: Safely rename variables and update code
*   **Gradual Adoption**: Add types incrementally to existing JavaScript code

**When to Use TypeScript:**

*   Large codebases with multiple developers
*   APIs where type safety is critical
*   Projects that will be maintained long-term
*   When working with complex data structures

* * *