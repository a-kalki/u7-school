# TypeScript Explicit Types and Inference

* * *

## Type Annotations and Inference

TypeScript offers two ways to work with types:

1.  **Explicit Typing**: You explicitly declare the type of a variable
2.  **Type Inference**: TypeScript automatically determines the type based on the assigned value

### When to Use Each Approach

*   Use **explicit types** for:
    *   Function parameters and return types
    *   Object literals
    *   When the initial value might not be the final type
*   Use **type inference** for:
    *   Simple variable declarations with immediate assignment
    *   When the type is obvious from the context

* * *

## Explicit Type Annotations

Explicit typing means you tell TypeScript exactly what type a variable should be:

```javascript
// Stringgreeting: string = "Hello, TypeScript!";// NumberuserCount: number = 42;// BooleanisLoading: boolean = true;// Array of numbersscores: number[] = [100, 95, 98];
```

**Best Practice:** Use explicit types for function parameters and return types to make your code more maintainable and self-documenting.

```javascript
// Function with explicit parameter and return typesfunction greet(name: string): string {return `Hello, ${name}!`;}// TypeScript will ensure you pass the correct argument typegreet("Alice"); // OKgreet(42);     // Error: Argument of type '42' is not assignable to parameter of type 'string'
```

* * *

## Type Inference

TypeScript can automatically determine (infer) the type of a variable based on its initial value:

```javascript
// TypeScript infers 'string'let username = "alice";// TypeScript infers 'number'let score = 100;// TypeScript infers 'boolean[]'let flags = [true, false, true];// TypeScript infers return type as 'number'function add(a: number, b: number) {return a + b;}
```

**Note:** Type inference works best when variables are initialized at declaration.

Uninitialized variables have type 'any' by default unless you enable `strictNullChecks` in your tsconfig.json.

### When Inference Shines

```javascript
// TypeScript infers the shape of the objectconst user = {name: "Alice",age: 30,isAdmin: true};// TypeScript knows these properties existconsole.log(user.name);  // OKconsole.log(user.email); // Error: Property 'email' does not exist
```

**Watch Out:** While type inference is convenient, being explicit with types can make your code more maintainable, especially in larger codebases or public APIs.

* * *

* * *

## Type Safety in Action

One of TypeScript's main benefits is catching type-related errors during development.

Let's look at how TypeScript helps prevent common mistakes.

### Type Mismatch Errors

```javascript
let username: string = "alice";username = 42; // Error: Type 'number' is not assignable to type 'string'
```
```javascript
let score = 100;  // TypeScript infers 'number'score = "high";  // Error: Type 'string' is not assignable to type 'number'
```

### JavaScript vs TypeScript

In JavaScript, the following code would run without errors, potentially causing bugs:

```javascript
// This is valid JavaScript but can lead to bugsfunction add(a, b) {return a + b;}console.log(add("5", 3)); // Returns "53" (string concatenation)
```

TypeScript catches these issues at compile time:

```javascript
function add(a: number, b: number): number {return a + b;}console.log(add("5", 3)); // Error: Argument of type 'string' is not assignable to parameter of type 'number'
```

* * *

## When TypeScript Can't Infer Types

While TypeScript's type inference is powerful, there are cases where it can't determine the correct type.

In these situations, TypeScript falls back to the `any` type, which disables type checking.

**Note:** `any` and other Special Types are covered in more detail in the next chapter.

```javascript
// 1. JSON.parse returns 'any' because the structure isn't known at compile timeconst data = JSON.parse('{ "name": "Alice", "age": 30 }');// 2. Variables declared without initializationlet something;  // Type is 'any'something = 'hello';something = 42;  // No error
```

#### Avoid `any` When Possible

Using `any` disables TypeScript's type checking.

Instead, consider these alternatives:

*   Use type annotations
*   Create interfaces for complex objects
*   Use type guards for runtime type checking
*   Enable `noImplicitAny` in your `tsconfig.json`

* * *

* * *