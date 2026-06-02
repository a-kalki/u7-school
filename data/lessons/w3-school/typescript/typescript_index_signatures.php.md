# TypeScript Index Signatures

* * *

## Understanding Index Signatures in TypeScript

Index signatures in TypeScript provide a powerful way to define types for objects with dynamic property names while maintaining type safety.

They allow you to specify the types of values that can be accessed via bracket notation (`obj[key]`), even when the exact property names aren't known in advance.

* * *

### Key Concepts

*   **Dynamic Property Access**: Handle objects with arbitrary property names
*   **Type Safety**: Ensure consistent value types across dynamic properties
*   **Flexible Data Structures**: Model dictionaries, maps, and other dynamic data
*   **Runtime Safety**: Catch type-related errors at compile time

* * *

## Basic Index Signatures

### String Index Signatures

Index signatures in TypeScript allow you to define types for objects where you don't know the property names in advance, but you do know the shape of the values.

An index signature defines the types for properties accessed via an index like `obj[key]`.

```javascript
// This interface represents an object with string keys and string valuesinterface StringDictionary {  [key: string]: string;}// Creating a compliant objectconst names: StringDictionary = {  firstName: "Alice",  lastName: "Smith",  "100": "One Hundred"};// Accessing propertiesconsole.log(names["firstName"]); // "Alice"console.log(names["lastName"]); // "Smith"console.log(names["100"]); // "One Hundred"// Adding new properties dynamicallynames["age"] = "30";// This would cause an error// names["age"] = 30; // Error: Type 'number' is not assignable to type 'string'
```

The index signature syntax uses brackets `[key: type]` to describe the types of the property names (or keys) that are allowed, followed by the type of values these properties can have.

* * *

* * *

### Number Index Signatures

TypeScript supports both string and number index signatures:

```javascript
// Object with number indexesinterface NumberDictionary {  [index: number]: any;}const scores: NumberDictionary = {  0: "Zero",  1: 100,  2: true};console.log(scores[0]); // "Zero"console.log(scores[1]); // 100console.log(scores[2]); // true// Adding a complex objectscores[3] = { passed: true };
```

**Note:** In JavaScript, all object keys are stored as strings, even numeric ones.

However, TypeScript makes a distinction to help catch logical errors when using arrays vs objects.

* * *

## Advanced Index Signature Patterns

### Mixed Property Types

You can combine index signatures with explicit property declarations:

```javascript
interface UserInfo {  name: string; // Required property with specific name  age: number;  // Required property with specific name  [key: string]: string | number; // All other properties must be string or number}const user: UserInfo = {  name: "Alice", // Required  age: 30,      // Required  address: "123 Main St", // Optional  zipCode: 12345 // Optional};// This would cause an error// const invalidUser: UserInfo = {//  name: "Bob",//  age: "thirty", // Error: Type 'string' is not assignable to type 'number'//  isAdmin: true  // Error: Type 'boolean' is not assignable to type 'string | number'// };
```

**Important:** When combining explicit properties with an index signature, the types of explicit properties must be assignable to the index signature's value type.

* * *

### ReadOnly Index Signatures

You can make index signatures read-only to prevent modification after creation:

```javascript
interface ReadOnlyStringArray {  readonly [index: number]: string;}const names: ReadOnlyStringArray = ["Alice", "Bob", "Charlie"];console.log(names[0]); // "Alice"// This would cause an error// names[0] = "Andrew"; // Error: Index signature in type 'ReadOnlyStringArray' only permits reading
```

* * *

For constraining key sets and transforming shapes, see [Mapped Types](typescript_mapped_types.php.html).

* * *

## Real-World Examples

### API Response Handling

```javascript
// Type for API responses with dynamic keysinterface ApiResponse<T> {  data: {    [resourceType: string]: T[];  // e.g., { "users": User[], "posts": Post[] }  };  meta: {    page: number;    total: number;    [key: string]: any;  // Allow additional metadata  };}// Example usage with a users APIinterface User {  id: number;  name: string;  email: string;}// Mock API responseconst apiResponse: ApiResponse<User> = {  data: {    users: [      { id: 1, name: "Alice", email: "alice@example.com" },      { id: 2, name: "Bob", email: "bob@example.com" }    ]  },  meta: {    page: 1,    total: 2,    timestamp: "2023-01-01T00:00:00Z"  }};// Accessing the dataconst users = apiResponse.data.users;console.log(users[0].name);  // "Alice"
```

* * *

## Best Practices

### Do's and Don'ts

#### Do:

*   Use index signatures for collections with dynamic keys
*   Combine with explicit properties for known fields
*   Keep value types specific (avoid `any`)
*   Use `readonly` when mutation isn't needed

#### Don't:

*   Prefer fixed interfaces when keys are known
*   Forget that all properties must conform to the index signature type
*   Reinvent mapped types-use the dedicated page for transformations

* * *

## Common Pitfalls

```javascript
interface ConflictingTypes {  [key: string]: number;  name: string; // Error: not assignable to string index type 'number'}interface FixedTypes {  [key: string]: number | string;  name: string;  // OK  age: number;   // OK}
```

* * *

## Index Signatures vs. Record<K, T>

Use an index signature for flexible/dynamic keys and when mixing with other properties.

Use `Record<K, T>` for concise simple mappings.

// Index signature  
interface StringMap {  
  \[key: string\]: string;  
}  
  
// Record  
type StringRecord = Record<string, string>;

* * *

## Conclusion

Use index signatures when keys are dynamic but value shapes are consistent.

Combine with explicit properties where possible, and see [Mapped Types](typescript_mapped_types.php.html) and [Utility Types](typescript_utility_types.php.html) for advanced transformations.

* * *

* * *