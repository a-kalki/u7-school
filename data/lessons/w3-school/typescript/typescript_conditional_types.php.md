# TypeScript Conditional Types

* * *

## Understanding Conditional Types in TypeScript

Conditional types in TypeScript enable you to create types that depend on other types, similar to how if-else statements work in JavaScript.

They're a powerful feature that allows for sophisticated type transformations and type-level programming.

* * *

### Key Concepts

*   **Type-level logic**: Perform conditional checks on types
*   **Type inference**: Extract and manipulate types using `infer`
*   **Composition**: Combine with other TypeScript features
*   **Utility types**: Build powerful type utilities

### Common Use Cases

*   Type-safe function overloading
*   API response type transformations
*   Complex type validations
*   Building reusable type utilities
*   Advanced type inference

* * *

## Basic Conditional Type Syntax

Conditional types use the form `T extends U ? X : Y`, which means:

"if type `T` extends (or is assignable to) type `U`, use type `X`, otherwise use type `Y`".

```javascript
type IsString<T> = T extends string ? true : false;// Usage examplestype Result1 = IsString<string>; // truetype Result2 = IsString<number>; // falsetype Result3 = IsString<"hello">; // true (literal types extend their base types)// We can use this with variables toolet a: IsString<string>; // a has type 'true'let b: IsString<number>; // b has type 'false'
```

* * *

* * *

## Conditional Types with Unions

### Distributive Conditional Types

Conditional types are particularly useful with union types, where they're automatically distributed over union members:

```javascript
type ToArray<T> = T extends any ? T[] : never;// When used with a union type, it applies to each member of the uniontype StringOrNumberArray = ToArray<string | number>;// This becomes ToArray<string> | ToArray<number>// Which becomes string[] | number[]// We can also extract specific types from a uniontype ExtractString<T> = T extends string ? T : never;type StringsOnly = ExtractString<string | number | boolean | "hello">;// Result: string | "hello"
```

* * *

## Type Inference with `infer`

### Extracting Types from Complex Structures

The `infer` keyword allows you to declare a type variable within the condition part of a conditional type and then use it in the true branch of the condition:

```javascript
// Extract the return type of a function typetype ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;// Examplesfunction greet() { return "Hello, world!"; }function getNumber() { return 42; }type GreetReturnType = ReturnType<typeof greet>; // stringtype NumberReturnType = ReturnType<typeof getNumber>; // number// Extract element type from arraytype ElementType<T> = T extends (infer U)[] ? U : never;type NumberArrayElement = ElementType<number[]>; // numbertype StringArrayElement = ElementType<string[]>; // string
```

* * *

## Built-in Conditional Types

### Standard Library Utilities

TypeScript includes several built-in conditional types in its standard library:

```javascript
// Extract<T, U> - Extracts types from T that are assignable to Utype OnlyStrings = Extract<string | number | boolean, string>; // string// Exclude<T, U> - Excludes types from T that are assignable to Utype NoStrings = Exclude<string | number | boolean, string>; // number | boolean// NonNullable<T> - Removes null and undefined from Ttype NotNull = NonNullable<string | null | undefined>; // string// Parameters<T> - Extracts parameter types from a function typetype Params = Parameters<(a: string, b: number) => void>; // [string, number]// ReturnType<T> - Extracts the return type from a function typetype Return = ReturnType<() => string>; // string
```

* * *

## Advanced Patterns and Techniques

### Recursive Conditional Types

Conditional types can be used recursively to create complex type transformations:

```javascript
// Deeply unwrap Promise typestype UnwrapPromise<T> = T extends Promise<infer U> ? UnwrapPromise<U> : T;// Examplestype A = UnwrapPromise<Promise<string>>; // stringtype B = UnwrapPromise<Promise<Promise<number>>>; // numbertype C = UnwrapPromise<boolean>; // boolean
```

### Type-Level If-Else Chains

Chain multiple conditions together for complex type logic:

```javascript
type TypeName<T> =  T extends string ? "string" :  T extends number ? "number" :  T extends boolean ? "boolean" :  T extends undefined ? "undefined" :  T extends Function ? "function" :  "object";// Usagetype T0 = TypeName<string>; // "string"type T1 = TypeName<42>; // "number"type T2 = TypeName<true>; // "boolean"type T3 = TypeName<() => void>; // "function"type T4 = TypeName<Date[]>; // "object"
```

Conditional types are powerful when creating generic utilities and type-safe libraries:

```javascript
// A function that returns different types based on input typefunction processValue<T>(value: T): T extends string  ? string  : T extends number  ? number  : T extends boolean  ? boolean  : never {  if (typeof value === "string") {    return value.toUpperCase() as any; // Type assertion needed due to limitations  } else if (typeof value === "number") {    return (value * 2) as any;  } else if (typeof value === "boolean") {    return (!value) as any;  } else {    throw new Error("Unsupported type");  }}// Usageconst stringResult = processValue("hello"); // Returns "HELLO" (type is string)const numberResult = processValue(10); // Returns 20 (type is number)const boolResult = processValue(true); // Returns false (type is boolean)
```

* * *

## Best Practices

### Do:

*   Use conditional types for complex type transformations
*   Combine with `infer` for type extraction
*   Create reusable type utilities
*   Document complex conditional types
*   Test edge cases in your type definitions

### Don't:

*   Overuse complex conditional types when simple types would suffice
*   Create deeply nested conditional types that are hard to understand
*   Forget about performance implications with very complex types
*   Use conditional types for runtime logic

### Performance Considerations

*   Deeply nested conditional types can increase compile times
*   Consider using type aliases for intermediate results
*   Be mindful of TypeScript's recursion depth limits

* * *

* * *