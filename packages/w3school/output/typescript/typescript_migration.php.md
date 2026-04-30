# TypeScript Migration Guide

* * *

Migrating from JavaScript to TypeScript can significantly improve your codebase's maintainability and developer experience.

This guide will walk you through the process step by step.

* * *

## Preparation Phase

### Assess Your Codebase

Before starting the migration:

*   Identify the size and complexity of your codebase
*   Document the build process and dependencies
*   Check for any existing type definitions (`.d.ts` files)
*   Identify critical paths that need special attention

```javascript
# Create a new branch for the migrationgit checkout -b typescript-migration# Commit your current stategit add .git commit -m "Pre-TypeScript migration state"
```

* * *

## Configuration

```javascript
# Install TypeScript as a dev dependencynpm install --save-dev typescript @types/node
```
```javascript
{  "compilerOptions": {    "target": "ES2020",    "module": "commonjs",    "strict": true,    "esModuleInterop": true,    "skipLibCheck": true,    "forceConsistentCasingInFileNames": true,    "outDir": "./dist",    "rootDir": "./src"  },  "include": ["src/**/*"],  "exclude": ["node_modules"]}
```

* * *

* * *

## Migration Approaches

### Gradual Migration

Migrate one file at a time while keeping the rest as JavaScript.

{  
  "compilerOptions": {  
    "allowJs": true,  
    "checkJs": true  
  }  
}  

**Best for:** Large codebases, minimal disruption

### All-at-Once Migration

Rename all `.js` files to `.ts` and fix errors.

\# Rename all JS files to TS  
find src -name "\*.js" -exec sh -c 'mv "$0" "${0%.js}.ts"' {} \\;  

**Best for:** Small to medium projects, greenfield projects

#### Important Note

For large projects, we strongly recommend the gradual migration approach to minimize disruption and make the process more manageable.

* * *

## Step-by-Step Migration

```javascript
{  "compilerOptions": {    "target": "ES2020",    "module": "commonjs",    "strict": true,    "esModuleInterop": true,    "skipLibCheck": true,    "forceConsistentCasingInFileNames": true,    "outDir": "./dist",    "rootDir": "./src",    "allowJs": true,    "checkJs": true,    "noEmit": true  },  "include": ["src/**/*"],  "exclude": ["node_modules", "dist"]}
```
```javascript
// @ts-check/** @type {string} */const name = 'John';// TypeScript will catch this errorname = 42; // Error: Type '42' is not assignable to type 'string'
```
```javascript
# Rename a single filemv src/utils/helpers.js src/utils/helpers.ts# Or rename all files in a directory (use with caution)find src/utils -name "*.js" -exec sh -c 'mv "$0" "${0%.js}.ts"' {} \;
```
```javascript
// Beforefunction add(a, b) {  return a + b;}// Afterfunction add(a: number, b: number): number {  return a + b;}// With interfaceinterface User {  id: number;  name: string;  email?: string;}function getUser(id: number): User {  return { id, name: 'John Doe' };}
```
```javascript
{  "scripts": {    "build": "tsc",    "dev": "tsc --watch",    "test": "jest"  }}
```

* * *

## Migration Tools

### ts-migrate

Automated tool for migrating JavaScript to TypeScript

npx ts-migrate-full .  

[GitHub Repository](https://github.com/airbnb/ts-migrate)

### TypeStat

Converts JavaScript to TypeScript with type safety

npx typestat  

[GitHub Repository](https://github.com/JoshuaKGoldberg/TypeStat)

### @types Packages

Install type definitions for your dependencies

npm install --save-dev @types/react @types/node  

[TypeSearch](https://www.typescriptlang.org/dt/search)

* * *

## Best Practices for TypeScript Migration

### Start Small and Iterate

*   Begin with utility functions and non-UI components
*   Migrate one file or module at a time
*   Commit after each successful migration step

### Leverage TypeScript Features

```javascript
// Use type inference where possibleconst name = 'John'; // TypeScript infers 'string'const age = 30; // TypeScript infers 'number'// Use union types for flexibilitytype Status = 'active' | 'inactive' | 'pending';// Use type guards for runtime checksfunction isString(value: any): value is string {  return typeof value === 'string';}
```

### Handle Third-Party Libraries

*   Install `@types` packages for your dependencies
*   Create declaration files for libraries without types
*   Use `declare module` for global type extensions

* * *

## Common Challenges and Solutions

### Dynamic Properties

**Problem:** JavaScript often uses objects as dictionaries.

```javascript
// Beforeconst user = {};user.name = 'John'; // Error: Property 'name' does not exist
```

**Solution:** Use index signatures or type assertions.

```javascript
// Option 1: Index signatureinterface User {  [key: string]: any;}const user: User = {};user.name = 'John'; // OK// Option 2: Type assertionconst user = {} as { name: string };user.name = 'John'; // OK
```

### Handling `this` Context

**Problem:** `this` binding issues in callbacks.

```javascript
class Counter {  count = 0;  increment() {    setTimeout(function() {      this.count++; // Error: 'this' is not defined    }, 1000);  }}
```

**Solution:** Use arrow functions or bind `this`.

```javascript
// Solution 1: Arrow functionsetTimeout(() => {  this.count++; // 'this' is lexically scoped}, 1000);// Solution 2: Bind 'this'setTimeout(function(this: Counter) {  this.count++;}.bind(this), 1000);
```

* * *

## Conclusion

Migrating from JavaScript to TypeScript is a significant but rewarding investment in your codebase.

By following this guide, you can make the transition smoothly and incrementally.

#### Key Takeaways:

*   Start with a solid `tsconfig.json` configuration
*   Use `allowJs` and `checkJs` for gradual migration
*   Leverage TypeScript's type system to catch errors early
*   Update your build and test processes to support TypeScript
*   Address common challenges with the patterns shown above

Remember that migration is a process, not an event.

It's okay to have a mixed codebase during the transition period.

The important thing is to keep making progress while maintaining code quality.

### Ready to Start Your Migration?

Begin by setting up TypeScript in your project and gradually adding type annotations.

The TypeScript compiler will guide you through the process of making your code more robust and maintainable.

For more information, check out the [official TypeScript migration guide](https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html).

* * *

* * *