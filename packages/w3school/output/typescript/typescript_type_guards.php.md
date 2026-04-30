# TypeScript Type Guards

* * *

## Understanding Type Guards in TypeScript

TypeScript Type Guards are powerful constructs that allow you to narrow down the type of a variable within a specific scope.

They help TypeScript understand and enforce type safety by providing explicit checks that determine the specific type of a variable at runtime.

* * *

### Why Use Type Guards?

*   **Type Safety**: Ensure operations are only performed on appropriate types
*   **Code Clarity**: Make type checking explicit and self-documenting
*   **Better Tooling**: Get accurate IntelliSense and code completion
*   **Error Prevention**: Catch type-related errors at compile time
*   **Runtime Safety**: Add an extra layer of type checking at runtime

### Type Guard Patterns

*   `typeof` type guards
*   `instanceof` type guards
*   User-defined type guards with type predicates
*   Discriminated unions with literal types
*   `in` operator type guards
*   Type assertion functions

* * *

## `typeof` Type Guards

The `typeof` operator is a built-in type guard that checks the type of a primitive value at runtime.

It's particularly useful for narrowing primitive types like strings, numbers, booleans, etc.

### Basic Usage

Use `typeof` checks to narrow primitive unions inside conditional branches.

```javascript
// Simple type guard with typeoffunction formatValue(value: string | number): string {  if (typeof value === 'string') {    // TypeScript knows value is string here    return value.trim().toUpperCase();  } else {    // TypeScript knows value is number here    return value.toFixed(2);  }}// Example usageconst result1 = formatValue('  hello  ');  // "HELLO"const result2 = formatValue(42.1234);      // "42.12"
```

In the above example, TypeScript understands the type of `value` in different branches of the `if` statement.

* * *

* * *

## `instanceof` Type Guards

The `instanceof` operator checks if an object is an instance of a specific class or constructor function.

It's useful for narrowing types with custom classes or built-in objects.

### Class-based Type Guarding

Narrow unions of class instances by checking the constructor with `instanceof`.

```javascript
class Bird {  fly() {    console.log("Flying...");   }}class Fish {  swim() {    console.log("Swimming...");   }}function move(animal: Bird | Fish) {  if (animal instanceof Bird) {    // TypeScript knows animal is Bird here    animal.fly();  } else {    // TypeScript knows animal is Fish here    animal.swim();  }}
```

* * *

## User-Defined Type Guards

For more complex type checking, you can create custom type guard functions using type predicates.

These are functions that return a type predicate in the form `parameterName is Type`.

### Type Predicate Functions

Return a predicate like `value is Type` so TypeScript narrows on the true branch.

```javascript
interface Car {  make: string;  model: string;  year: number;}interface Motorcycle {  make: string;  model: string;  year: number;  type: "sport" | "cruiser";}// Type predicate functionfunction isCar(vehicle: Car | Motorcycle): vehicle is Car {  return (vehicle as Motorcycle).type === undefined;}function displayVehicleInfo(vehicle: Car | Motorcycle) {  console.log(`Make: ${vehicle.make}, Model: ${vehicle.model}, Year: ${vehicle.year}`);  if (isCar(vehicle)) {    // TypeScript knows vehicle is Car here    console.log("This is a car");  } else {    // TypeScript knows vehicle is Motorcycle here    console.log(`This is a ${vehicle.type} motorcycle`);  }}
```

The function signature `vehicle is Car` is a type predicate that tells TypeScript to narrow the type when the function returns true.

* * *

## Discriminated Unions

Discriminated unions (also known as tagged unions) use a common property (the discriminant) to distinguish between different object types in a union.

This pattern is particularly powerful when combined with type guards.

### Basic Discriminated Union

Use a shared literal property (like `kind`) to switch and narrow to the exact variant.

```javascript
interface Circle {  kind: "circle";  radius: number;}interface Square {  kind: "square";  sideLength: number;}type Shape = Circle | Square;function calculateArea(shape: Shape) {  switch (shape.kind) {    case "circle":      // TypeScript knows shape is Circle here      return Math.PI * shape.radius ** 2;    case "square":      // TypeScript knows shape is Square here      return shape.sideLength ** 2;  }}
```

The `kind` property is used as a discriminant to determine the type of the shape.

* * *

## The `in` Operator

The `in` operator checks for the existence of a property on an object.

It's particularly useful for narrowing union types where different types have distinct properties.

### Property Existence Checking

Narrow union members by testing whether a distinguishing property exists.

```javascript
interface Dog {  bark(): void;}interface Cat {  meow(): void;}function makeSound(animal: Dog | Cat) {  if ("bark" in animal) {    // TypeScript knows animal is Dog here    animal.bark();  } else {    // TypeScript knows animal is Cat here    animal.meow();  }}
```

* * *

## Type Assertion Functions

Type assertion functions are a special kind of type guard that can throw an error if the type assertion fails.

They're useful for validating data at runtime.

### Assertion Functions

Encode runtime checks that narrow types and throw on invalid input.

```javascript
// Type assertion functionfunction assertIsString(value: unknown): asserts value is string {  if (typeof value !== 'string') {    throw new Error('Value is not a string');  }}// Type assertion function with custom errorfunction assert(condition: unknown, message: string): asserts condition {  if (!condition) {    throw new Error(message);  }}// Usagefunction processInput(input: unknown) {  assertIsString(input);  // input is now typed as string  console.log(input.toUpperCase());}// With custom errorfunction processNumber(value: unknown): number {  assert(typeof value === 'number', 'Value must be a number');  // value is now typed as number  return value * 2;}
```

* * *

## Best Practices

### When to Use Each Type Guard

*   Use `typeof` for primitive types (string, number, boolean, etc.)
*   Use `instanceof` for class instances and built-in objects
*   Use user-defined type guards for complex validation logic
*   Use discriminated unions for related types with a common discriminant
*   Use the `in` operator for checking property existence
*   Use type assertion functions for runtime validation with errors

### Performance Considerations

*   `typeof` and `instanceof` are very fast
*   Avoid complex logic in user-defined type guards when performance is critical
*   Consider using type predicates for expensive checks that are used multiple times

* * *

* * *