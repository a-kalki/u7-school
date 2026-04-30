# TypeScript Mapped Types

* * *

Mapped types in TypeScript allow you to create new types by transforming properties of existing types.

*   **Mapped types** = transform every property of a type
*   Common ones: `Partial`, `Readonly`, `Pick`, `Omit`, `Record`

```javascript
// Small exampletype Person = { name: string; age: number };type PartialPerson = { [P in keyof Person]?: Person[P] };type ReadonlyPerson = { readonly [P in keyof Person]: Person[P] };
```

* * *

* * *

## Basic Mapped Type Syntax

### Core Syntax

Mapped types use the syntax `{ [P in K]: T }` where:

*   `P` is the property name being iterated
*   `K` is a union of property names to iterate over
*   `T` is the resulting type for each property

```javascript
// Define an object typeinterface Person {  name: string;  age: number;  email: string;}// Create a mapped type that makes all properties optionaltype PartialPerson = {  [P in keyof Person]?: Person[P];};// Usageconst partialPerson: PartialPerson = {  name: "John"  // age and email are optional};// Create a mapped type that makes all properties readonlytype ReadonlyPerson = {  readonly [P in keyof Person]: Person[P];};// Usageconst readonlyPerson: ReadonlyPerson = {  name: "Alice",  age: 30,  email: "alice@example.com"};// readonlyPerson.age = 31; // Error: Cannot assign to 'age' because it is a read-only property
```

* * *

## Built-in Mapped Types

### Standard Library Utilities

TypeScript includes several useful built-in mapped types:

*   `Partial<T>`: make all props optional
*   `Readonly<T>`: make all props readonly
*   `Pick<T, K>`: select a subset of keys
*   `Omit<T, K>`: remove keys
*   `Record<K, V>`: map keys to a value type

```javascript
interface User {  id: number;  name: string;  email: string;  isAdmin: boolean;}// Partial<T> - Makes all properties optionaltype PartialUser = Partial<User>;// Equivalent to: { id?: number; name?: string; email?: string; isAdmin?: boolean; }// Required<T> - Makes all properties requiredtype RequiredUser = Required<Partial<User>>;// Equivalent to: { id: number; name: string; email: string; isAdmin: boolean; }// Readonly<T> - Makes all properties readonlytype ReadonlyUser = Readonly<User>;// Equivalent to: { readonly id: number; readonly name: string; ... }// Pick<T, K> - Creates a type with a subset of properties from Ttype UserCredentials = Pick<User, "email" | "id">;// Equivalent to: { email: string; id: number; }// Omit<T, K> - Creates a type by removing specified properties from Ttype PublicUser = Omit<User, "id" | "isAdmin">;// Equivalent to: { name: string; email: string; }// Record<K, T> - Creates a type with specified keys and value typestype UserRoles = Record<"admin" | "user" | "guest", string>;// Equivalent to: { admin: string; user: string; guest: string; }
```

* * *

## Creating Custom Mapped Types

### Basic Custom Mappers

You can create your own mapped types to transform types in specific ways:

```javascript
// Base interfaceinterface Product {  id: number;  name: string;  price: number;  inStock: boolean;}// Create a mapped type to convert all properties to string typetype StringifyProperties<T> = {  [P in keyof T]: string;};// Usagetype StringProduct = StringifyProperties<Product>;// Equivalent to: { id: string; name: string; price: string; inStock: string; }// Create a mapped type that adds validation functions for each propertytype Validator<T> = {  [P in keyof T]: (value: T[P]) => boolean;};// Usageconst productValidator: Validator<Product> = {  id: (id) => id > 0,  name: (name) => name.length > 0,  price: (price) => price >= 0,  inStock: (inStock) => typeof inStock === "boolean"};
```

* * *

## Modifying Property Modifiers

### Adding and Removing Modifiers

Mapped types also allow you to add or remove property modifiers like `readonly` and `?` (optional):

```javascript
// Base interface with some readonly and optional propertiesinterface Configuration {  readonly apiKey: string;  readonly apiUrl: string;  timeout?: number;  retries?: number;}// Remove readonly modifier from all propertiestype Mutable<T> = {  -readonly [P in keyof T]: T[P];};// Usagetype MutableConfig = Mutable<Configuration>;// Equivalent to: { apiKey: string; apiUrl: string; timeout?: number; retries?: number; }// Make all optional properties requiredtype RequiredProps<T> = {  [P in keyof T]-?: T[P];};// Usagetype RequiredConfig = RequiredProps<Configuration>;// Equivalent to: { readonly apiKey: string; readonly apiUrl: string; timeout: number; retries: number; }
```

* * *

## Advanced Mapped Types

### Combining with Conditional Types

Mapped types become even more powerful when combined with conditional types:

```javascript
// Base interfaceinterface ApiResponse {  data: unknown;  status: number;  message: string;  timestamp: number;}// Conditional mapped type: Convert each numeric property to a formatted stringtype FormattedResponse<T> = {  [P in keyof T]: T[P] extends number ? string : T[P];};// Usagetype FormattedApiResponse = FormattedResponse<ApiResponse>;// Equivalent to: { data: unknown; status: string; message: string; timestamp: string; }// Another example: Filter for only string propertiestype StringPropsOnly<T> = {  [P in keyof T as T[P] extends string ? P : never]: T[P];};// Usagetype ApiResponseStringProps = StringPropsOnly<ApiResponse>;// Equivalent to: { message: string; }
```

* * *

## Key Takeaways

Mapped types let you transform every property of a type in a consistent way.

### Key Concepts

*   **Type Transformation**: Modify property types in bulk
*   **Property Modifiers**: Add or remove `readonly` and `?` modifiers
*   **Key Remapping**: Rename or filter properties using `as` clauses
*   **Composition**: Combine with other TypeScript features

### Common Use Cases

*   Creating read-only versions of types
*   Making all properties optional or required
*   Transforming property types (e.g., to nullable or readonly)
*   Filtering properties based on their types
*   Creating type-safe utility functions

* * *

* * *