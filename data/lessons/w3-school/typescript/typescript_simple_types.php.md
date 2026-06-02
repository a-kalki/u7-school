# TypeScript Simple Types

* * *

TypeScript enhances JavaScript by adding static types.

* * *

## JavaScript and TypeScript Primitives

The most basic types in TypeScript are called **primitives**.

These types form the building blocks of more complex types in your applications.

TypeScript includes all JavaScript primitives plus additional type features.

Here are the five primitive types you'll use most often:

* * *

## Boolean

Represents true/false values.

Used for flags, toggles, and conditions.

```javascript
let isActive: boolean = true;let hasPermission = false; // TypeScript infers 'boolean' type
```

* * *

## Number

Represents both integers and floating-point numbers.

TypeScript uses the same number type for all numeric values.

```javascript
let decimal: number = 6;let hex: number = 0xf00d;       // Hexadecimallet binary: number = 0b1010;     // Binarylet octal: number = 0o744;      // Octallet float: number = 3.14;      // Floating point
```

* * *

## String

Represents text data.

Can use single quotes ('), double quotes ("), or backticks (\`) for template literals.

```javascript
let color: string = "blue";let fullName: string = 'John Doe';let age: number = 30;let sentence: string = `Hello, my name is ${fullName} and I'll be ${age + 1} next year.`;
```

* * *

* * *

## BigInt (ES2020+)

Represents whole numbers larger than 253 - 1.

```javascript
const hugeNumber = BigInt(9007199254740991);
```

* * *

## Symbol

Creates unique identifiers.

Useful for creating unique property keys and constants.

```javascript
const uniqueKey: symbol = Symbol('description');const obj = {  [uniqueKey]: 'This is a unique property'};console.log(obj[uniqueKey]); // "This is a unique property"
```

* * *

* * *