# TypeScript Namespaces

* * *

## Understanding TypeScript Namespaces

TypeScript namespaces (previously known as "internal modules") provide a powerful way to organize code and prevent naming conflicts by creating a container for related functionality.

They help in structuring large codebases and managing scope in a clean, maintainable way.

* * *

### Key Concepts

*   **Logical Grouping**: Organize related code into named containers
*   **Scope Management**: Control the visibility of code elements
*   **Name Collision Prevention**: Avoid conflicts between similarly named components
*   **Code Organization**: Structure large applications in a hierarchical manner

### When to Use Namespaces

*   Organizing code in large legacy applications
*   Working with global libraries
*   When migrating from older JavaScript codebases
*   When working with code that needs to be available globally

**Note:** While namespaces are still fully supported in TypeScript, modern applications typically use ES modules (import/export) for better modularity and tree-shaking support.

However, understanding namespaces is valuable for maintaining legacy codebases and certain library development scenarios.

* * *

## Basic Namespace Syntax

### Creating and Using Namespaces

A namespace is defined using the `namespace` keyword:

```javascript
namespace Validation {  // Everything inside this block belongs to the Validation namespace  // Export things you want to make available outside the namespace  export interface StringValidator {    isValid(s: string): boolean;  }  // This is private to the namespace (not exported)  const lettersRegexp = /^[A-Za-z]+$/;  // Exported class - available outside the namespace  export class LettersValidator implements StringValidator {    isValid(s: string): boolean {      return lettersRegexp.test(s);    }  }  // Another exported class  export class ZipCodeValidator implements StringValidator {    isValid(s: string): boolean {      return /^[0-9]+$/.test(s) && s.length === 5;    }  }}// Using the namespace memberslet letterValidator = new Validation.LettersValidator();let zipCodeValidator = new Validation.ZipCodeValidator();console.log(letterValidator.isValid("Hello")); // trueconsole.log(letterValidator.isValid("Hello123")); // falseconsole.log(zipCodeValidator.isValid("12345")); // trueconsole.log(zipCodeValidator.isValid("1234")); // false - wrong length
```

* * *

* * *

## Advanced Namespace Features

### Nested Namespaces

Namespaces can be nested to create hierarchical organization:

```javascript
namespace App {  export namespace Utils {    export function log(msg: string): void {      console.log(`[LOG]: ${msg}`);    }    export function error(msg: string): void {      console.error(`[ERROR]: ${msg}`);    }  }  export namespace Models {    export interface User {      id: number;      name: string;      email: string;    }    export class UserService {      getUser(id: number): User {        return { id, name: "John Doe", email: "john@example.com" };      }    }  }}// Using nested namespacesApp.Utils.log("Application starting");const userService = new App.Models.UserService();const user = userService.getUser(1);App.Utils.log(`User loaded: ${user.name}`);// This would be a type error in TypeScript// App.log("directly accessing log"); // Error - log is not a direct member of App
```

* * *

### Namespace Aliases

You can create aliases for namespaces or their members to make long names more manageable:

```javascript
namespace VeryLongNamespace {  export namespace DeeplyNested {    export namespace Components {      export class Button {        display(): void {          console.log("Button displayed");        }      }      export class TextField {        display(): void {          console.log("TextField displayed");        }      }    }  }}// Without alias - very verboseconst button1 = new VeryLongNamespace.DeeplyNested.Components.Button();button1.display();// With namespace aliasimport Components = VeryLongNamespace.DeeplyNested.Components;const button2 = new Components.Button();button2.display();// With specific member aliasimport Button = VeryLongNamespace.DeeplyNested.Components.Button;const button3 = new Button();button3.display();
```

* * *

## Working with Multi-file Namespaces

### Splitting Namespaces Across Files

Large applications often require splitting code across multiple files.

TypeScript namespaces can be split across files and combined at compile time using reference comments:

### Using Reference Comments

Reference comments help TypeScript understand the relationship between files:

**validators.ts** file:

```javascript
namespace Validation {  export interface StringValidator {    isValid(s: string): boolean;  }}
```

**letters-validator.ts** file (extends Validation namespace):

```javascript
/// <reference path="validators.ts" />namespace Validation {  const lettersRegexp = /^[A-Za-z]+$/;  export class LettersValidator implements StringValidator {    isValid(s: string): boolean {      return lettersRegexp.test(s);    }  }}
```

**zipcode-validator.ts** file:

```javascript
/// <reference path="validators.ts" />namespace Validation {  const zipCodeRegexp = /^[0-9]+$/;  export class ZipCodeValidator implements StringValidator {    isValid(s: string): boolean {      return zipCodeRegexp.test(s) && s.length === 5;    }  }}
```

**main.ts** file:

```javascript
/// <reference path="validators.ts" />/// <reference path="letters-validator.ts" />/// <reference path="zipcode-validator.ts" />// Now you can use the validators from multiple fileslet validators: { [s: string]: Validation.StringValidator } = {};validators["letters"] = new Validation.LettersValidator();validators["zipcode"] = new Validation.ZipCodeValidator();// Some samples to validatelet strings = ["Hello", "98052", "101"];// Validate eachstrings.forEach(s => {  for (let name in validators) {    console.log(`"${s}" - ${validators[name].isValid(s) ? "matches" : "does not match"} ${name}`);  }});
```

To compile these files into a single JavaScript file, use:

```javascript
tsc --outFile sample.js main.ts
```

* * *

## Namespaces vs. Modules

### Key Differences

Understanding when to use namespaces versus modules is crucial for TypeScript development:

*   **Modules** are the preferred way to organize code in modern TypeScript applications
*   **Namespaces** are still useful for specific scenarios like declaration merging or working with legacy code
*   **Modules** have better tooling support and tree-shaking capabilities
*   **Namespaces** can be useful for creating global libraries

Here's a comparison of when to use namespaces versus ES modules:

### Comparison Table

Feature

Namespaces

ES Modules (import/export)

Recommended scope/scale

Simpler setups, small apps, legacy codebases

Modern apps of any size; preferred for new projects

Syntax and usage

Global access via dot notation (e.g., `MyNS.Member`)

Explicit `import`/`export` with file paths

Loading/bundling

No loader required; can emit single file via `--outFile`

Typically uses a bundler/loader (Vite, webpack, etc.)

Splitting across files

Possible via `/// <reference />` comments

Natural; each file is a module with explicit exports/imports

Tree-shaking

Limited; harder for bundlers to eliminate unused code

Excellent; designed for dead-code elimination

Global scope

Encourages globals (namespaced)

Avoids globals; explicit dependencies

Augmentation/merging

Strong support via declaration merging

Module augmentation possible, but more constrained

Tooling and ecosystem

Works, but less aligned with modern tooling

Best support across modern tooling and platforms

Best used for

Legacy libraries, global scripts, ambient types

All new development, libraries, and applications

* * *

## Advanced Namespace Patterns

```javascript
// Original namespacedeclare namespace Express {  interface Request {    user?: { id: number; name: string };  }  interface Response {    json(data: any): void;  }}// Later in your application (e.g., in a .d.ts file)declare namespace Express {  // Augment the Request interface  interface Request {    // Add custom properties    requestTime?: number;    // Add methods    log(message: string): void;  }  // Add new types  interface UserSession {    userId: number;    expires: Date;  }}// Usage in your applicationconst app = express();app.use((req: Express.Request, res: Express.Response, next) => {  // Augmented properties and methods are available  req.requestTime = Date.now();  req.log('Request started');  next();});
```

### Namespaces with Generics

```javascript
// Generic namespace examplenamespace DataStorage {  export interface Repository<T> {    getAll(): T[];    getById(id: number): T | undefined;    add(item: T): void;    update(id: number, item: T): boolean;    delete(id: number): boolean;  }  // Concrete implementation  export class InMemoryRepository<T> implements Repository<T> {    private items: T[] = [];    getAll(): T[] {      return [...this.items];    }    getById(id: number): T | undefined {      return this.items[id];    }    add(item: T): void {      this.items.push(item);    }    update(id: number, item: T): boolean {      if (id >= 0 && id < this.items.length) {        this.items[id] = item;        return true;      }      return false;    }    delete(id: number): boolean {      if (id >= 0 && id < this.items.length) {        this.items.splice(id, 1);        return true;      }      return false;    }  }}// Usageinterface User {  id: number;  name: string;  email: string;}const userRepo = new DataStorage.InMemoryRepository<User>();userRepo.add({ id: 1, name: 'John Doe', email: 'john@example.com' });const allUsers = userRepo.getAll();
```

* * *

## Best Practices

### Namespace Best Practices

#### Do:

*   Use meaningful, hierarchical namespace names
*   Export only what's needed from namespaces
*   Use `/// <reference />` for ordering in multi-file namespaces
*   Consider using modules for new projects
*   Use const enums within namespaces for better performance
*   Document your namespaces with JSDoc comments

#### Don't:

*   Create overly deep namespace hierarchies (more than 2-3 levels)
*   Pollute the global scope unnecessarily
*   Mix namespaces and modules in the same project without a clear strategy
*   Use namespaces for small applications - prefer modules

### Performance Considerations

*   Large namespaces can increase bundle size
*   Consider code splitting for large applications
*   Be mindful of circular dependencies in complex namespace structures
*   Use `const enum` for better performance with constant values

* * *

## Migrating from Namespaces to Modules

```javascript
// Before: Using namespacesnamespace MyApp {  export namespace Services {    export class UserService {      getUser(id: number) { /* ... */ }    }  }}// After: Using ES modules// services/UserService.tsexport class UserService {  getUser(id: number) { /* ... */ }}// app.tsimport { UserService } from './services/UserService';const userService = new UserService();
```

### Migration Steps

1.  Convert each namespace to a module file
2.  Replace `export` with ES module exports
3.  Update imports to use ES module syntax
4.  Configure your build system to handle modules
5.  Update tests to work with the new module structure
6.  Consider using a bundler like webpack or Rollup
7.  Update your `tsconfig.json` to use `"module": "ESNext"`

### Migration Tools

*   `ts-migrate` - Automated migration tool from Facebook
*   `tslint` with `no-namespace` rule to detect namespaces
*   TypeScript's built-in refactoring tools

* * *

* * *