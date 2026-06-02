# TypeScript Advanced Types

* * *

## Advanced TypeScript Types

TypeScript's advanced type system allows you to model complex type relationships with precision.

These features are particularly useful for building robust, maintainable applications with excellent type safety.

### Key Advanced Type Features

*   **Mapped Types**: Transform properties of existing types
*   **Conditional Types**: Create types based on conditions
*   **Template Literal Types**: Build types using string templates
*   **Utility Types**: Built-in type helpers for common transformations
*   **Recursive Types**: Self-referential types for tree-like structures
*   **Type Guards & Type Predicates**: Runtime type checking
*   **Type Inference**: Advanced pattern matching with `infer`

* * *

## Mapped Types

Mapped types allow you to create new types by transforming properties of existing types.

### Basic Mapped Type

Transform every property of an object type into a new type using a single template.

```javascript
// Convert all properties to booleantype Flags<T> = {  [K in keyof T]: boolean;};interface User {  id: number;  name: string;  email: string;}type UserFlags = Flags<User>;// Equivalent to:// {//   id: boolean;//   name: boolean;//   email: boolean;// }
```

* * *

### Mapped Type Modifiers

Add or remove property modifiers like `readonly` and `?` across all keys.

```javascript
// Make all properties optionalinterface Todo {  title: string;  description: string;  completed: boolean;}type OptionalTodo = {  [K in keyof Todo]?: Todo[K];};// Remove 'readonly' and '?' modifierstype Concrete<T> = {  -readonly [K in keyof T]-?: T[K];};// Add 'readonly' and 'required' to all propertiestype ReadonlyRequired<T> = {  +readonly [K in keyof T]-?: T[K];};
```

### Key Remapping

Rename or filter keys while mapping using `as`, string helpers, and conditional checks.

```javascript
// Add prefix to all property namestype Getters<T> = {  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];};type UserGetters = Getters<User>;// {//   getId: () => number;//   getName: () => string;//   getEmail: () => string;// }// Filter out propertiestype MethodsOnly<T> = {  [K in keyof T as T[K] extends Function ? K : never]: T[K];};
```

* * *

* * *

## Conditional Types

Conditional types allow you to define types that depend on a condition.

### Basic Conditional Types

Select between types based on a condition checked at the type level.

```javascript
type IsString<T> = T extends string ? true : false;type A = IsString<string>;    // truetype B = IsString<number>;    // falsetype C = IsString<'hello'>;    // truetype D = IsString<string | number>; // boolean// Extract array element typetype ArrayElement<T> = T extends (infer U)[] ? U : never;type Numbers = ArrayElement<number[]>; // number
```

### Infer Keyword

Capture a part of a type within a conditional type by introducing a new type variable with `infer`.

```javascript
// Get return type of a functiontype ReturnType<T> = T extends (...args: any[]) => infer R ? R : any;// Get parameter types as a tupletype Parameters<T> = T extends (...args: infer P) => any ? P : never;// Get constructor parameter typestype ConstructorParameters<T extends new (...args: any) => any> =  T extends new (...args: infer P) => any ? P : never;// Get instance type from a constructortype InstanceType<T extends new (...args: any) => any> =  T extends new (...args: any) => infer R ? R : any;
```

### Distributed Conditional Types

Understand how conditionals distribute over unions versus when they are wrapped to prevent distribution.

```javascript
// Without distributiontype ToArrayNonDist<T> = T extends any ? T[] : never;type StrOrNumArr = ToArrayNonDist<string | number>; // (string | number)[]// With distributiontype ToArray<T> = [T] extends [any] ? T[] : never;type StrOrNumArr2 = ToArray<string | number>; // string[] | number[]// Filter out non-string typestype FilterStrings<T> = T extends string ? T : never;type Letters = FilterStrings<'a' | 'b' | 1 | 2 | 'c'>; // 'a' | 'b' | 'c'
```

* * *

## Template Literal Types

Template literal types allow you to build types using template literal syntax.

### Basic Template Literal Types

Constrain strings to specific patterns using template literals and unions.

```javascript
type Greeting = `Hello, ${string}`;const validGreeting: Greeting = 'Hello, World!';const invalidGreeting: Greeting = 'Hi there!'; // Error// With unionstype Color = 'red' | 'green' | 'blue';type Size = 'small' | 'medium' | 'large';type Style = `${Color}-${Size}`;// 'red-small' | 'red-medium' | 'red-large' |// 'green-small' | 'green-medium' | 'green-large' |// 'blue-small' | 'blue-medium' | 'blue-large'
```

### String Manipulation Types

Apply built-in helpers to transform string literal types (uppercasing, capitalizing, etc.).

```javascript
// Built-in string manipulation typestype T1 = Uppercase<'hello'>;  // 'HELLO'type T2 = Lowercase<'WORLD'>;  // 'world'type T3 = Capitalize<'typescript'>;  // 'Typescript'type T4 = Uncapitalize<'TypeScript'>;  // 'typeScript'// Create an event handler typetype EventType = 'click' | 'change' | 'keydown';type EventHandler = `on${Capitalize<EventType>}`;// 'onClick' | 'onChange' | 'onKeydown'
```

### Advanced Patterns

Compose templates with inference and key remapping to extract metadata and generate APIs.

```javascript
// Extract route parameterstype ExtractRouteParams<T> =  T extends `${string}:${infer Param}/${infer Rest}`    ? { [K in Param | keyof ExtractRouteParams<`${Rest}`>]: string }    : T extends `${string}:${infer Param}`    ? { [K in Param]: string }    : {};type Params = ExtractRouteParams<'/users/:userId/posts/:postId'>;// { userId: string; postId: string; }// Create a type-safe event emittertype EventMap = {  click: { x: number; y: number };  change: string;  keydown: { key: string; code: number };};type EventHandlers = {  [K in keyof EventMap as `on${Capitalize<K>}`]: (event: EventMap[K]) => void;};
```

* * *

## Utility Types

TypeScript provides several built-in utility types for common type transformations.

### Common Utility Types

Use built-ins like `Partial`, `Pick`, and `Omit` for common transformations.

```javascript
// Basic typesinterface User {  id: number;  name: string;  email: string;  createdAt: Date;}// Make all properties optionaltype PartialUser = Partial<User>;// make all properties requiredtype RequiredUser = Required<PartialUser>;// make all properties read-onlytype ReadonlyUser = Readonly<User>;// pick specific propertiestype UserPreview = Pick<User, 'id' | 'name'>;// omit specific propertiestype UserWithoutEmail = Omit<User, 'email'>;// extract property typestype UserId = User['id']; // numbertype UserKeys = keyof User; // 'id' | 'name' | 'email' | 'createdAt'
```

### Advanced Utility Types

Exclude or extract members from unions and create custom mapped helpers.

```javascript
// Create a type that excludes null and undefinedtype NonNullable<T> = T extends null | undefined ? never : T;// Exclude types from a uniontype Numbers = 1 | 2 | 3 | 'a' | 'b';type JustNumbers = Exclude<Numbers, string>; // 1 | 2 | 3// Extract types from a uniontype JustStrings = Extract<Numbers, string>; // 'a' | 'b'// Get the type that is not in the second typetype A = { a: string; b: number; c: boolean };type B = { a: string; b: number };type C = Omit<A, keyof B>; // { c: boolean }// Create a type with all properties as mutabletype Mutable<T> = {  -readonly [K in keyof T]: T[K];};
```

* * *

## Recursive Types

Recursive types are useful for modeling tree-like data structures where a type can reference itself.

### Basic Recursive Type

Model self-referential structures like trees and nested JSON.

```javascript
// Simple binary treetype BinaryTree<T> = {  value: T;  left?: BinaryTree<T>;  right?: BinaryTree<T>;};// JSON-like data structuretype JSONValue =  | string  | number  | boolean  | null  | JSONValue[]  | { [key: string]: JSONValue };// Nested commentstype Comment = {  id: number;  content: string;  replies: Comment[];  createdAt: Date;};
```

### Advanced Recursive Types

Express linked lists, directory trees, and recursive state machines.

```javascript
// Type for a linked listtype LinkedList<T> = {  value: T;  next: LinkedList<T> | null;};// Type for a directory structuretype File = {  type: 'file';  name: string;  size: number;};type Directory = {  type: 'directory';  name: string;  children: (File | Directory)[];};// Type for a state machinetype State = {  value: string;  transitions: {    [event: string]: State;  };};// Type for a recursive functiontype RecursiveFunction<T> = (x: T | RecursiveFunction<T>) => void;
```

* * *

## Best Practices

### When to Use Advanced Types

*   Use **mapped types** when you need to transform multiple properties of an object type
*   Use **conditional types** when your type depends on another type
*   Use **template literal types** for string manipulation and pattern matching
*   Use **utility types** for common transformations (prefer built-in ones when possible)
*   Use **recursive types** for tree-like or nested data structures

### Performance Considerations

*   Deeply nested recursive types can slow down the TypeScript compiler
*   Very large union types (100+ members) can cause performance issues
*   Use type aliases to break down complex types

* * *

## Common Pitfalls

### Type Inference Issues

*   Conditional types distribute over union types, which can be surprising
*   Type inference with `infer` works differently in different contexts
*   Some utility types don't work well with `any` or `unknown`

### Maintainability

*   Overusing complex types can make code hard to understand
*   Document complex type transformations with comments
*   Consider using type assertions or helper functions for very complex types

* * *