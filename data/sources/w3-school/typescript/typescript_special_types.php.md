# TypeScript Special Types

* * *

TypeScript includes several special types that have specific behaviors in the type system.

These types are used in various scenarios to handle cases where the type might not be known in advance or when you need to work with JavaScript primitives in a type-safe way.

**Note:** These special types are part of TypeScript's type system and help make your code more type-safe and self-documenting.

* * *

## Type: any

The `any` type is the most flexible type in TypeScript.

It essentially tells the compiler to skip type checking for a particular variable.

While this can be useful in certain situations, it should be used sparingly as it bypasses TypeScript's type safety features.

**When to use `any`:**

*   When migrating JavaScript code to TypeScript
*   When working with dynamic content where the type is unknown
*   When you need to opt out of type checking for a specific case

The example below does not use `any` and will throw an error:

```javascript
let u = true;u = "string"; // Error: Type 'string' is not assignable to type 'boolean'.Math.round(u); // Error: Argument of type 'boolean' is not assignable to parameter of type 'number'.
```

Setting a variable to the special type `any` disables type checking:

```javascript
let v: any = true;v = "string"; // no error as it can be "any" typeMath.round(v); // no error as it can be "any" type
```

`any` can be a useful way to get past errors since it disables type checking, but TypeScript will not be able to provide type safety, and tools which rely on type data, such as auto completion, will not work.

Remember, it should be avoided at "any" cost...

* * *

* * *

## Type: unknown

The `unknown` type is a type-safe counterpart of `any`.

It's the type-safe way to say "this could be anything, so you must perform some type of checking before you use it".

**Key differences between `unknown` and `any`:**

*   `unknown` must be type-checked before use
*   You can't access properties on an `unknown` type without type assertion
*   You can't call or construct values of type `unknown`

TypeScript will prevent `unknown` types from being used without proper type checking, as shown in the example below:

```javascript
let w: unknown = 1;w = "string"; // no errorw = {  runANonExistentMethod: () => {    console.log("I think therefore I am");  }} as { runANonExistentMethod: () => void}// How can we avoid the error for the code commented out below when we don't know the type?// w.runANonExistentMethod(); // Error: Object is of type 'unknown'.if(typeof w === 'object' && w !== null) {  (w as { runANonExistentMethod: Function }).runANonExistentMethod();}// Although we have to cast multiple times we can do a check in the if to secure our type and have a safer casting
```

**When to use `unknown`:**

*   When working with data from external sources (APIs, user input, etc.)
*   When you want to ensure type safety while still allowing flexibility
*   When migrating from JavaScript to TypeScript in a type-safe way

**Type narrowing with `unknown`:**

You can narrow down the type of an `unknown` value using type guards:

function processValue(value: unknown) {  
  if (typeof value === 'string') {  
    // value is now treated as string  
    console.log(value.toUpperCase());  
  } else if (Array.isArray(value)) {  
    // value is now treated as any\[\]  
    console.log(value.length);  
  }  
}

## Type: never

The `never` type represents the type of values that never occur.

It's used to indicate that something never happens or should never happen.

**Common use cases for `never`:**

*   Functions that never return (always throw an error or enter an infinite loop)
*   Type guards that never pass type checking
*   Exhaustiveness checking in discriminated unions

### Examples of `never` in action:

```javascript
function throwError(message: string): never {  throw new Error(message);}
```
```javascript
type Shape = Circle | Square | Triangle;function getArea(shape: Shape): number {  switch (shape.kind) {    case 'circle':      return Math.PI * shape.radius ** 2;    case 'square':      return shape.sideLength ** 2;    default:      // TypeScript knows this should never happen      const _exhaustiveCheck: never = shape;      return _exhaustiveCheck;  }}
```
```javascript
let x: never = true; // Error: Type 'boolean' is not assignable to type 'never'.
```

**When to use `never`:**

*   For functions that will never return a value
*   In type guards that should never match
*   For exhaustive type checking in switch statements
*   In generic types to indicate certain cases are impossible

* * *

## Type: undefined & null

In TypeScript, both `undefined` and `null` have their own types, just like `string` or `number`.

By default, these types can be assigned to any other type, but this can be changed with TypeScript's strict null checks.

**Key points about `undefined` and `null`:**

*   `undefined` means a variable has been declared but not assigned a value
*   `null` is an explicit assignment that represents no value or no object
*   In TypeScript, both have their own types: `undefined` and `null` respectively
*   With `strictNullChecks` enabled, you must explicitly handle these types

### Basic Usage

```javascript
let y: undefined = undefined;let z: null = null;
```

### Optional Parameters and Properties

```javascript
// Optional parameter (implicitly `string | undefined`)function greet(name?: string) {  return `Hello, ${name || 'stranger'}`;}// Optional property in an interfaceinterface User {  name: string;  age?: number; // Same as `number | undefined`}
```

### Nullish Coalescing and Optional Chaining

```javascript
// Nullish coalescing (??) - only uses default if value is null or undefinedconst value = input ?? 'default';// Optional chaining (?.) - safely access nested propertiesconst street = user?.address?.street;
```

**Important:** These types are most useful when `strictNullChecks` is enabled in your `tsconfig.json` file.

This ensures that `null` and `undefined` are only assignable to themselves and `any`.

To enable strict null checks, add this to your `tsconfig.json`:

{  
  "compilerOptions": {  
    "strictNullChecks": true  
  }  
}

* * *

* * *