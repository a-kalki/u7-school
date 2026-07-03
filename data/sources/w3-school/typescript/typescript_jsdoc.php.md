# TypeScript in JavaScript Projects (JSDoc)

* * *

JSDoc with TypeScript allows you to add type checking to JavaScript files without converting them to `.ts`.

This is perfect for gradual migration or when you want type safety in JavaScript projects.

* * *

## Getting Started

To enable TypeScript checking in JavaScript files, you need to:

1.  Create a `tsconfig.json` file (if you don't have one)
2.  Enable `checkJs` or use `// @ts-check` in individual files

```javascript
// @ts-check/*** Adds two numbers.* @param {number} a* @param {number} b* @returns {number}*/function add(a, b) {  return a + b;}
```

* * *

* * *

## Objects and Interfaces

```javascript
// @ts-check/*** @param {{ firstName: string, lastName: string, age?: number }} person*/function greet(person) {  return `Hello, ${person.firstName} ${person.lastName}`;}greet({ firstName: 'John', lastName: 'Doe' }); // OKgreet({ firstName: 'Jane' }); // Error: Property 'lastName' is missing
```
```javascript
// @ts-check/*** @typedef {Object} User* @property {number} id - The user ID* @property {string} username - The username* @property {string} [email] - Optional email address* @property {('admin'|'user'|'guest')} role - User role* @property {() => string} getFullName - Method that returns full name*//** @type {User} */const currentUser = {  id: 1,  username: 'johndoe',  role: 'admin',  getFullName() {    return 'John Doe';  }};// TypeScript will provide autocomplete for User propertiesconsole.log(currentUser.role);
```
```javascript
// @ts-check/** @typedef {{ x: number, y: number }} Point *//*** @typedef {Point & { z: number }} Point3D*//** @type {Point3D} */const point3d = { x: 1, y: 2, z: 3 };// @ts-expect-error - missing z propertyconst point2d = { x: 1, y: 2 };
```

* * *

## Function Types

```javascript
// @ts-check/*** Calculates the area of a rectangle* @param {number} width - The width of the rectangle* @param {number} height - The height of the rectangle* @returns {number} The calculated area*/function calculateArea(width, height) {  return width * height;}// TypeScript knows the parameter and return typesconst area = calculateArea(10, 20);
```
```javascript
// @ts-check/*** @callback StringProcessor* @param {string} input* @returns {string}*//*** @type {StringProcessor}*/const toUpperCase = (str) => str.toUpperCase();/*** @param {string[]} strings* @param {StringProcessor} processor* @returns {string[]}*/function processStrings(strings, processor) {  return strings.map(processor);}const result = processStrings(['hello', 'world'], toUpperCase);// result will be ['HELLO', 'WORLD']
```
```javascript
// @ts-check/*** @overload* @param {string} a* @param {string} b* @returns {string}*//*** @overload* @param {number} a* @param {number} b* @returns {number}*//*** @param {string | number} a* @param {string | number} b* @returns {string | number}*/function add(a, b) {  if (typeof a === 'string' || typeof b === 'string') {    return String(a) + String(b);  }  return a + b;}const strResult = add('Hello, ', 'World!'); // stringconst numResult = add(10, 20); // number
```

* * *

## Advanced Types

```javascript
// @ts-check/** @typedef {{ name: string, age: number }} Person *//** @typedef {Person & { employeeId: string }} Employee *//** @typedef {Person | { guestId: string, visitDate: Date }} Visitor *//** @type {Employee} */const employee = {  name: 'Alice',  age: 30,  employeeId: 'E123'};/** @type {Visitor} */const guest = {  guestId: 'G456',  visitDate: new Date()};/*** @param {Visitor} visitor* @returns {string}*/function getVisitorId(visitor) {  if ('guestId' in visitor) {    return visitor.guestId; // TypeScript knows this is a guest  }  return visitor.name; // TypeScript knows this is a Person}
```
```javascript
// @ts-check/** * @template T * @typedef {[K in keyof T]: T[K] extends Function ? K : never}[keyof T] MethodNames *//** * @template T * @typedef {{ *   [K in keyof T as `get${'<' }Capitalize<string & K>{'>'}`]: () => T[K] * }} Getters *//** @type {Getters<{ name: string, age: number }> } */const userGetters = {  getName: () => 'John',  getAge: () => 30};// TypeScript enforces the return typesconst name = userGetters.getName(); // stringconst age = userGetters.getAge(); // number
```

* * *

## Type Imports

```javascript
// @ts-check// Importing types from TypeScript files/** @typedef {import('./types').User} User */// Importing types from node_modules/** @typedef {import('express').Request} ExpressRequest */// Importing with renaming/** @typedef {import('./api').default as ApiClient} ApiClient */
```
```javascript
// types.d.tsdeclare module 'my-module' {  export interface Config {    apiKey: string;    timeout?: number;    retries?: number;  }    export function initialize(config: Config): void;  export function fetchData<T = any>(url: string): Promise<T>;}
```

* * *

## Best Practices

Follow these best practices when using JSDoc with TypeScript:

*   Enable `// @ts-check` at the top of files where you want type checking
*   Use `@typedef` for complex types that are used in multiple places
*   Document all function parameters and return types
*   Use `@template` for generic functions and types
*   Create declaration files (`.d.ts`) for third-party libraries without types
*   Use `@ts-expect-error` instead of `@ts-ignore` when you expect an error

* * *

## Common Pitfalls

Watch out for these common issues:

*   **Missing `// @ts-check`:** Type checking won't work without it
*   **Incorrect JSDoc syntax:** A single typo can disable type checking
*   **Type conflicts:** When types from different sources don't match
*   **Inference issues:** Sometimes TypeScript can't infer types correctly
*   **Performance:** Large JavaScript files with complex types can be slow to check

* * *

## Conclusion

Using JSDoc with TypeScript provides a powerful way to add type safety to your JavaScript projects without the need to convert files to TypeScript.

This approach is particularly useful for:

*   Gradually migrating JavaScript codebases to TypeScript
*   Adding type checking to existing JavaScript projects
*   Working in environments where `.ts` files aren't supported
*   Documenting JavaScript code with type information

By following the patterns and best practices outlined in this tutorial, you can enjoy many of the benefits of TypeScript while continuing to work with JavaScript.

**Remember:** While JSDoc provides excellent type checking, for new projects or complete migrations, consider using `.ts` files for the best TypeScript experience.

* * *

### Ready to try TypeScript with JSDoc?

Start by adding `// @ts-check` to your JavaScript files and gradually add type annotations using JSDoc.

The TypeScript compiler will help you catch errors before they reach production!

* * *

* * *