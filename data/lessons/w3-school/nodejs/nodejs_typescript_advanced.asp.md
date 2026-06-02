# Node.js Advanced TypeScript

* * *

## Advanced TypeScript for Node.js

This guide dives into advanced TypeScript features and patterns specifically useful for Node.js applications.

For comprehensive TypeScript documentation, visit [TypeScript Tutorial](https://www.w3schools.com/typescript/index.php).

## Advanced Type System Features

TypeScript's type system provides powerful tools for creating robust and maintainable Node.js applications.

Here are the key features:

### 1\. Union and Intersection Types

```javascript
// Union typefunction formatId(id: string | number) {  return `ID: ${id}`;}// Intersection typetype User = { name: string } & { id: number };
```

### 2\. Type Guards

```javascript
type Fish = { swim: () => void };type Bird = { fly: () => void };function isFish(pet: Fish | Bird): pet is Fish {  return 'swim' in pet;}
```

### 3\. Advanced Generics

```javascript
// Generic function with constraintsfunction getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {  return obj[key];}// Generic interface with default typeinterface PaginatedResponse<T = any> {  data: T[];  total: number;  page: number;  limit: number;}// Using generic types with async/await in Node.jsasync function fetchData<T>(url: string): Promise<T> {  const response = await fetch(url);  return response.json();}
```

### 4\. Mapped and Conditional Types

```javascript
// Mapped typestype ReadonlyUser = {  readonly [K in keyof User]: User[K];};// Conditional typestype NonNullableUser = NonNullable<User | null | undefined>; // User// Type inference with conditional typestype GetReturnType<T> = T extends (...args: any[]) => infer R ? R : never;function getUser() {  return { id: 1, name: 'Alice' } as const;}type UserReturnType = GetReturnType<typeof getUser>; // { readonly id: 1; readonly name: "Alice"; }
```

### 5\. Type Inference and Type Guards

TypeScript's type inference and type guards help create type-safe code with minimal annotations:

```javascript
// Type inference with variablesconst name = 'Alice'; // TypeScript infers type: stringconst age = 30; // TypeScript infers type: numberconst active = true; // TypeScript infers type: boolean// Type inference with arraysconst numbers = [1, 2, 3]; // TypeScript infers type: number[]const mixed = [1, 'two', true]; // TypeScript infers type: (string | number | boolean)[]// Type inference with functionsfunction getUser() {  return { id: 1, name: 'Alice' }; // Return type inferred as { id: number; name: string; }}const user = getUser(); // user inferred as { id: number; name: string; }console.log(user.name); // Type checking works on inferred properties
```

* * *

* * *

## Advanced TypeScript Patterns for Node.js

These patterns help build more maintainable and type-safe Node.js applications:

### 1\. Advanced Decorators

```javascript
// Parameter decorator with metadatafunction validateParam(target: any, key: string, index: number) {  const params = Reflect.getMetadata('design:paramtypes', target, key) || [];  console.log(`Validating parameter ${index} of ${key} with type ${params[index]?.name}`);}// Method decorator with factoryfunction logExecutionTime(msThreshold = 0) {  return function (target: any, key: string, descriptor: PropertyDescriptor) {    const originalMethod = descriptor.value;    descriptor.value = async function (...args: any[]) {      const start = Date.now();      const result = await originalMethod.apply(this, args);      const duration = Date.now() - start;      if (duration > msThreshold) {        console.warn(`[Performance] ${key} took ${duration}ms`);      }      return result;    };  };}class ExampleService {  @logExecutionTime(100)  async fetchData(@validateParam url: string) {    // Implementation  }}
```

### 2\. Advanced Utility Types

```javascript
// Built-in utility types with examples interface User {  id: number;  name: string;  email?: string;  createdAt: Date;}// Create a type with specific properties as requiredtype AtLeast<T, K extends keyof T> = Partial<T> & Pick<T, K>;type UserCreateInput = AtLeast<User, 'name' | 'email'>; // Only name is required// Create a type that makes specific properties requiredWithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };type UserWithEmail = WithRequired<User, 'email'>;// Extract function return type as a typetype UserFromAPI = Awaited<ReturnType<typeof fetchUser>>;
```

### 3\. Type-Safe Event Emitters

```javascript
import { EventEmitter } from 'events';type EventMap = {  login: (userId: string) => void;  logout: (userId: string, reason: string) => void;  error: (error: Error) => void;};class TypedEventEmitter<T extends Record<string, (...args: any[]) => void>> {  private emitter = new EventEmitter();  on<K extends keyof T>(event: K, listener: T[K]): void {    this.emitter.on(event as string, listener as any);  }  emit<K extends keyof T>(    event: K,    ...args: Parameters<T[K]>  ): boolean {    return this.emitter.emit(event as string, ...args);  }}// Usageconst userEvents = new TypedEventEmitter<EventMap>();userEvents.on('login', (userId) => {  console.log(`User ${userId} logged in`);});// TypeScript will show an error for incorrect argument types// userEvents.emit('login', 123);// Error: Argument of type 'number' is not assignable to 'string'
```

* * *

## TypeScript Best Practices for Node.js

**Key Takeaways:**

*   Leverage TypeScript's advanced type system for better code safety and developer experience
*   Use generics to create flexible and reusable components without losing type safety
*   Implement decorators for cross-cutting concerns like logging, validation, and performance monitoring
*   Utilize utility types to transform and manipulate types without code duplication
*   Create type-safe abstractions for Node.js-specific patterns like event emitters and streams

**Performance Considerations:**

*   Be mindful of complex types that might impact compilation time
*   Use `type` over `interface` for complex type operations
*   Consider using `as const` for literal types when appropriate
*   Use `unknown` instead of `any` for type-safe dynamic typing

For comprehensive TypeScript documentation and examples, visit our [TypeScript Tutorial](https://www.w3schools.com/typescript/index.php).

* * *

* * *