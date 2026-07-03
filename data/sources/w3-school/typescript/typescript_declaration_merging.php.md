# TypeScript Declaration Merging

* * *

## Understanding Declaration Merging

Declaration merging is a powerful TypeScript feature that allows you to combine multiple declarations with the same name into a single definition.

This enables you to build up complex types incrementally and extend existing types in a type-safe manner.

* * *

### Key Benefits

*   **Progressive Enhancement**: Build types incrementally across multiple declarations
*   **Extensibility**: Add new members to existing types without modifying original definitions
*   **Organization**: Split large type definitions into logical groupings
*   **Compatibility**: Extend third-party type definitions when needed

### Common Use Cases

*   Extending built-in types and third-party library types
*   Adding type information for JavaScript libraries
*   Organizing large interfaces across multiple files
*   Creating fluent APIs with method chaining
*   Implementing the module augmentation pattern

* * *

## Interface Merging

Interfaces with the same name are automatically merged:

```javascript
// First declarationinterface Person {  name: string;  age: number;}// Second declaration with the same nameinterface Person {  address: string;  email: string;}// TypeScript merges them into:// interface Person {// name: string;// age: number;// address: string;// email: string;// }const person: Person = {  name: "John",  age: 30,  address: "123 Main St",  email: "john@example.com"};console.log(person);
```

* * *

* * *

## Function Overloads with Merging

You can define multiple function declarations that later merge when implemented:

```javascript
// Function overloadsfunction processValue(value: string): string;function processValue(value: number): number;function processValue(value: boolean): boolean;// Implementation that handles all overloadsfunction processValue(value: string | number | boolean): string | number | boolean {  if (typeof value === "string") {    return value.toUpperCase();  } else if (typeof value === "number") {    return value * 2;  } else {    return !value;  }}// Using the function with different typesconsole.log(processValue("hello")); // "HELLO"console.log(processValue(10)); // 20console.log(processValue(true)); // false
```

* * *

## Namespace Merging

Namespaces with the same name are merged:

```javascript
namespace Validation {  export interface StringValidator {    isValid(s: string): boolean;  }}namespace Validation {  export interface NumberValidator {    isValid(n: number): boolean;  }  export class ZipCodeValidator implements StringValidator {    isValid(s: string): boolean {      return s.length === 5 && /^\d+$/.test(s);    }  }}// After merging:// namespace Validation {// export interface StringValidator { isValid(s: string): boolean; }// export interface NumberValidator { isValid(n: number): boolean; }// export class ZipCodeValidator implements StringValidator { ... }// }// Using the merged namespaceconst zipValidator = new Validation.ZipCodeValidator();console.log(zipValidator.isValid("12345")); // trueconsole.log(zipValidator.isValid("1234")); // falseconsole.log(zipValidator.isValid("abcde")); // false
```

* * *

## Class and Interface Merging

A class declaration can merge with an interface of the same name:

```javascript
// Interface declarationinterface Cart {  calculateTotal(): number;}// Class declaration with same nameclass Cart {  items: { name: string; price: number }[] = [];  addItem(name: string, price: number): void {    this.items.push({ name, price });  }   // Must implement the interface method   calculateTotal(): number {    return this.items.reduce((sum, item) => sum + item.price, 0);  }}// Using the merged class and interfaceconst cart = new Cart();cart.addItem("Book", 15.99);cart.addItem("Coffee Mug", 8.99);console.log(`Total: $${cart.calculateTotal().toFixed(2)}`);
```

* * *

## Enum Merging

Enum declarations with the same name are merged:

```javascript
// First part of the enumenum Direction {  North,  South}// Second part of the enumenum Direction {  East = 2,  West = 3}// After merging:// enum Direction {// North = 0,// South = 1,// East = 2,// West = 3// }console.log(Direction.North); // 0console.log(Direction.South); // 1console.log(Direction.East); // 2console.log(Direction.West); // 3// Can also access by valueconsole.log(Direction[0]); // "North"console.log(Direction[2]); // "East"
```

* * *

## Module Augmentation

You can extend existing modules or libraries by declaring additional types and functionality:

```javascript
// Original library definition// Imagine this comes from a third-party librarydeclare namespace LibraryModule {  export interface User {    id: number;    name: string;  }  export function getUser(id: number): User;}// Augmenting with additional functionality (your code)declare namespace LibraryModule {  // Add new interface  export interface UserPreferences {    theme: string;    notifications: boolean;  }  // Add new property to existing interface  export interface User {    preferences?: UserPreferences;  }  // Add new function  export function getUserPreferences(userId: number): UserPreferences;}// Using the augmented moduleconst user = LibraryModule.getUser(123);console.log(user.preferences?.theme);const prefs = LibraryModule.getUserPreferences(123);console.log(prefs.notifications);
```

* * *

## Best Practices

There are some rules to consider when using declaration merging:

*   **Order matters for function overloads**: The implementation signature should be the most general
*   **Non-function members must be compatible**: If two interfaces declare a property with the same name, the types must be identical or compatible
*   **Later interfaces take precedence**: If conflicts exist in merged interfaces, the last declaration wins
*   **Private and protected members**: Classes can't merge if they have private or protected members with the same name but different types
*   **Namespace exports**: Only exported declarations are visible outside the namespace after merging

* * *

## Performance Considerations

*   **Compilation Time**: Excessive declaration merging can increase compilation time
*   **Type Checking**: Complex merged types may impact IDE performance
*   **Bundle Size**: Declaration merging doesn't affect runtime performance or bundle size

#### Optimization Tips:

*   Keep merged interfaces focused and cohesive
*   Avoid deep nesting in merged types
*   Use `type` aliases for simple type combinations instead of merging

* * *

* * *