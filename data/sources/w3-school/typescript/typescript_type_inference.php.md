# TypeScript Type Inference

* * *

## Understanding Type Inference in TypeScript

Type inference is TypeScript's ability to automatically determine and assign types to variables, function returns, and expressions based on their usage and context, without requiring explicit type annotations.

This powerful feature reduces verbosity while maintaining type safety.

### Key Concepts

*   **Type inference**: Automatic type detection from assigned values
*   **Contextual typing**: Types inferred from surrounding context
*   **Best common type**: Algorithm for finding a compatible type
*   **Widening/Narrowing**: Types expand or get constrained by usage
*   **When it happens**: variable init, returns, default params, callbacks, literals

```javascript
// TypeScript infers these variable typeslet name = "Alice"; // inferred as stringlet age = 30; // inferred as numberlet isActive = true; // inferred as booleanlet numbers = [1, 2, 3]; // inferred as number[]let mixed = [1, "two", true]; // inferred as (string | number | boolean)[]// Using the inferred typesname.toUpperCase(); // Works because name is inferred as stringage.toFixed(2); // Works because age is inferred as number// name.toFixed(2); // Error: Property 'toFixed' does not exist on type 'string'
```

* * *

* * *

## Function Return Type Inference

TypeScript can infer the return type of a function based on its return statements:

```javascript
// Return type is inferred as stringfunction greet(name: string) {  return `Hello, ${name}!`;}// Return type is inferred as numberfunction add(a: number, b: number) {  return a + b;}// Return type is inferred as string | numberfunction getValue(key: string) {   if (key === "name") {    return "Alice";   } else {    return 42;   }}// Using the inferred return typeslet greeting = greet("Bob"); // inferred as stringlet sum = add(5, 3); // inferred as numberlet value = getValue("age"); // inferred as string | number
```

* * *

## Contextual Typing

TypeScript can infer types based on the context in which expressions occur:

```javascript
// The type of the callback parameter is inferred from the array method contextconst names = ["Alice", "Bob", "Charlie"];// Parameter 'name' is inferred as stringnames.forEach(name => {  console.log(name.toUpperCase());});// Parameter 'name' is inferred as string, and the return type is inferred as numberconst nameLengths = names.map(name => {  return name.length;});// nameLengths is inferred as number[]// Parameter types in event handlers are also inferreddocument.addEventListener("click", event => {  // 'event' is inferred as MouseEvent  console.log(event.clientX, event.clientY);});
```

* * *

## Type Inference in Object Literals

When working with object literals, TypeScript infers the types of properties:

```javascript
// TypeScript infers the type of this objectconst user = {  id: 1,  name: "Alice",  email: "alice@example.com",  active: true,  details: {    age: 30,    address: {      city: "New York",      country: "USA"    }  }};// Accessing inferred propertiesconsole.log(user.name.toUpperCase());console.log(user.details.age.toFixed(0));console.log(user.details.address.city.toLowerCase());// Type errors would be caught// console.log(user.age); // Error: Property 'age' does not exist on type '...'// console.log(user.details.name); // Error: Property 'name' does not exist on type '...'// console.log(user.details.address.zip); // Error: Property 'zip' does not exist on type '...'
```

* * *

## Advanced Patterns

### Const Assertions

```javascript
// Regular type inference (widens to string)let name = "Alice";  // type: string// Const assertion (narrows to literal type)const nameConst = "Alice" as const;  // type: "Alice"// With objectsconst user = {  id: 1,  name: "Alice",  roles: ["admin", "user"] as const  // readonly tuple} as const;// user.name = "Bob";  // Error: Cannot assign to 'name' because it is a read-only property
```

### Type Guards and Control Flow Analysis

```javascript
function processValue(value: string | number) {  // Type is narrowed to string in this block  if (typeof value === "string") {    console.log(value.toUpperCase());  }  // Type is narrowed to number here  else {    console.log(value.toFixed(2));  }}// Discriminated unionsinterface Circle { kind: "circle"; radius: number; }interface Square { kind: "square"; size: number; }type Shape = Circle | Square;function area(shape: Shape) {  // Type is narrowed based on 'kind' property  switch (shape.kind) {    case "circle":      return Math.PI * shape.radius ** 2;    case "square":      return shape.size ** 2;  }}
```

* * *

## Best Practices

Here are some best practices for working with TypeScript's type inference:

```javascript
// 1. Let TypeScript infer simple typeslet message = "Hello"; // Good: no need for explicit type here// 2. Provide explicit types for function parametersfunction formatName(firstName: string, lastName: string) {  return `${firstName} ${lastName}`;}// 3. Consider adding return type annotations for complex functionsfunction processData(input: string[]): { count: number; items: string[] } {  return {    count: input.length,    items: input.map(item => item.trim())  };}// 4. Use explicit type annotations for empty arrays or objectsconst emptyArray: string[] = []; // Without annotation, inferred as any[]const configOptions: Record<string, unknown> = {}; // Without annotation, inferred as {}// 5. Use type assertions when TypeScript cannot infer correctlyconst canvas = document.getElementById("main-canvas") as HTMLCanvasElement;
```

* * *

## When to Use Explicit Types

While type inference is powerful, there are situations where explicit type annotations are recommended:

### Recommended for Explicit Types

*   **Public API Contracts**: Function parameters and return types in library code
*   **Complex Types**: When the inferred type is too broad or complex
*   **Documentation**: To make the code more self-documenting
*   **Type Safety**: When you need to enforce specific constraints
*   **Empty Collections**: Empty arrays or objects that will be populated later

### Performance Considerations

```javascript
// Good: Explicit type for complex return valuesfunction processData(input: string[]): { results: string[]; count: number } {  return {    results: input.map(processItem),    count: input.length  };}// Good: Explicit type for empty arraysconst items: Array<{ id: number; name: string }> = [];// Good: Explicit type for configuration objectsconst config: {  apiUrl: string;  retries: number;  timeout: number;} = {  apiUrl: "https://api.example.com",  retries: 3,  timeout: 5000};
```

* * *

* * *