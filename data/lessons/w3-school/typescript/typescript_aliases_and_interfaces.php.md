# TypeScript Type Aliases and Interfaces

* * *

TypeScript allows types to be defined separately from the variables that use them.

Aliases and Interfaces allows types to be easily shared between different variables/objects.

* * *

## Type Aliases

Type Aliases allow defining types with a custom name (an Alias).

Type Aliases can be used for primitives like `string` or more complex types such as `objects` and `arrays`:

```javascript
type CarYear = numbertype CarType = stringtype CarModel = stringtype Car = {  year: CarYear,  type: CarType,  model: CarModel}const carYear: CarYear = 2001const carType: CarType = "Toyota"const carModel: CarModel = "Corolla"const car: Car = {  year: carYear,  type: carType,  model: carModel};
```
```javascript
type Animal = { name: string };type Bear = Animal & { honey: boolean };const bear: Bear = { name: "Winnie", honey: true };type Status = "success" | "error";let response: Status = "success";
```

* * *

## Interfaces

Interfaces are similar to type aliases, except they **only** apply to `object` types.

```javascript
interface Rectangle {  height: number,  width: number}const rectangle: Rectangle = {  height: 20,  width: 10};
```
```javascript
interface Animal { name: string; } interface Animal { age: number; } const dog: Animal = { name: "Fido", age: 5 };
```

* * *

## Type vs Interface: Key Differences

*   **Extending:** Both can be extended, but interfaces support declaration merging.
*   **Unions/Intersections:** Only type aliases support union and intersection types.
*   **Implements:** Classes can implement either.
*   **Recommendation:** Use `interface` for objects, `type` for everything else.

**Best Practices:**

*   Use `interface` for defining object shapes and public APIs.
*   Use `type` for unions, intersections, and primitives.
*   Favor composition over inheritance for types.
*   Document your types and interfaces for clarity.

**Common Pitfalls:**

*   Using `type` when you need declaration merging (use `interface`).
*   Overcomplicating types-keep them simple and focused.
*   Forgetting to update types/interfaces as code evolves.

* * *

* * *

## Extending Interfaces

Interfaces can extend each other's definition.

**Extending** an interface means you are creating a new interface with the same properties as the original, plus something new.

```javascript
interface Rectangle {  height: number,  width: number}interface ColoredRectangle extends Rectangle {  color: string}const coloredRectangle: ColoredRectangle = {  height: 20,  width: 10,  color: "red"};
```

* * *

* * *