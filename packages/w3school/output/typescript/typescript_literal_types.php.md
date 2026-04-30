# TypeScript Literal Types

* * *

## Understanding Literal Types in TypeScript

Literal types in TypeScript allow you to specify exact values that variables can hold, providing more precision than broader types like `string` or `number`.

They are the building blocks for creating precise and type-safe applications.

* * *

### Key Concepts

*   **String Literals**: Exact string values like `"success" | "error"`
*   **Numeric Literals**: Specific numbers like `1 | 2 | 3`
*   **Boolean Literals**: Either `true` or `false`
*   **Template Literal Types**: String literal types built using template string syntax

### Common Use Cases

*   Defining specific sets of allowed values
*   Creating discriminated unions
*   Type-safe event handling
*   API response typing
*   Configuration objects

* * *

## String Literal Types

A string literal type represents a specific string value:

```javascript
// A variable with a string literal typelet direction: "north" | "south" | "east" | "west";// Valid assignmentsdirection = "north";direction = "south";// Invalid assignments would cause errors// direction = "northeast"; // Error: Type '"northeast"' is not assignable to type '"north" | "south" | "east" | "west"'// direction = "up"; // Error: Type '"up"' is not assignable to type '"north" | "south" | "east" | "west"'// Using string literal types in functionsfunction move(direction: "north" | "south" | "east" | "west") {  console.log(`Moving ${direction}`);}move("east"); // Valid// move("up"); // Error: Argument of type '"up"' is not assignable to parameter of type...
```

* * *

* * *

## Numeric Literal Types

Similar to string literals, numeric literal types represent specific numeric values:

```javascript
// A variable with a numeric literal typelet diceRoll: 1 | 2 | 3 | 4 | 5 | 6;// Valid assignmentsdiceRoll = 1;diceRoll = 6;// Invalid assignments would cause errors// diceRoll = 0; // Error: Type '0' is not assignable to type '1 | 2 | 3 | 4 | 5 | 6'// diceRoll = 7; // Error: Type '7' is not assignable to type '1 | 2 | 3 | 4 | 5 | 6'// diceRoll = 2.5; // Error: Type '2.5' is not assignable to type '1 | 2 | 3 | 4 | 5 | 6'// Using numeric literal types in functionsfunction rollDice(): 1 | 2 | 3 | 4 | 5 | 6 {  return Math.floor(Math.random() * 6) + 1 as 1 | 2 | 3 | 4 | 5 | 6;}const result = rollDice();console.log(`You rolled a ${result}`);
```

* * *

## Boolean Literal Types

Boolean literal types are less commonly used since there are only two boolean values, but they can be useful in specific scenarios:

```javascript
// A type that can only be the literal value 'true'type YesOnly = true;// A function that must return truefunction alwaysSucceed(): true {  // Always returns the literal value 'true'  return true;}// Boolean literal combined with other typestype SuccessFlag = true | "success" | 1;type FailureFlag = false | "failure" | 0;function processResult(result: SuccessFlag | FailureFlag) {  if (result === true || result === "success" || result === 1) {    console.log("Operation succeeded");  } else {    console.log("Operation failed");  }}processResult(true); // "Operation succeeded"processResult("success"); // "Operation succeeded"processResult(1); // "Operation succeeded"processResult(false); // "Operation failed"
```

* * *

## Literal Types with Objects

Literal types can be combined with object types to create very specific shapes:

```javascript
// Object with literal property valuestype HTTPSuccess = {  status: 200 | 201 | 204;  statusText: "OK" | "Created" | "No Content";  data: any;};type HTTPError = {  status: 400 | 401 | 403 | 404 | 500;  statusText: "Bad Request" | "Unauthorized" | "Forbidden" | "Not Found" | "Internal Server Error";  error: string;};type HTTPResponse = HTTPSuccess | HTTPError;function handleResponse(response: HTTPResponse) {  if (response.status >= 200 && response.status < 300) {    console.log(`Success: ${response.statusText}`);    console.log(response.data);  } else {    console.log(`Error ${response.status}: ${response.statusText}`);    console.log(`Message: ${response.error}`);  }}// Example usageconst successResponse: HTTPSuccess = {  status: 200,  statusText: "OK",  data: { username: "john_doe", email: "john@example.com" }};const errorResponse: HTTPError = {  status: 404,  statusText: "Not Found",  error: "User not found in database"};handleResponse(successResponse);handleResponse(errorResponse);
```

* * *

## Template Literal Types

TypeScript 4.1+ introduced template literal types, which allow you to create new string literal types by combining existing ones using template string syntax:

```javascript
// Basic template literalstype Direction = "north" | "south" | "east" | "west";type Distance = "1km" | "5km" | "10km";// Using template literals to combine themtype DirectionAndDistance = `${Direction}-${Distance}`;// "north-1km" | "north-5km" | "north-10km" | "south-1km" | ...let route: DirectionAndDistance;route = "north-5km"; // Validroute = "west-10km"; // Valid// route = "north-2km"; // Error// route = "5km-north"; // Error// Advanced string manipulationtype EventType = "click" | "hover" | "scroll";type EventTarget = "button" | "link" | "div";type EventName = `on${Capitalize<EventType>}${Capitalize<EventTarget>}`;// "onClickButton" | "onClickLink" | "onClickDiv" | ...// Dynamic property accesstype User = {  id: number;  name: string;  email: string;  createdAt: Date;};type GetterName<T> = `get${Capitalize<string & keyof T>}`;type UserGetters = {[K in keyof User as GetterName<User>]: () => User[K];};// { getId: () => number; getName: () => string; ... }// String pattern matchingtype ExtractRouteParams<T extends string> =  T extends `${string}:${infer Param}/${infer Rest}`    ? Param | ExtractRouteParams<Rest>    : T extends `${string}:${infer Param}`      ? Param    : never;type Params = ExtractRouteParams<"/users/:userId/posts/:postId">; // "userId" | "postId"// CSS units and valuestype CssUnit = 'px' | 'em' | 'rem' | '%' | 'vh' | 'vw';type CssValue = `${number}${CssUnit}`;let width: CssValue = '100px'; // Validlet height: CssValue = '50%'; // Valid// let margin: CssValue = '10'; // Error// let padding: CssValue = '2ex'; // Error// API versioningtype ApiVersion = 'v1' | 'v2' | 'v3';type Endpoint = 'users' | 'products' | 'orders';type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';type ApiUrl = `https://api.example.com/${ApiVersion}/${Endpoint}`;// Complex example: Dynamic SQL query buildertype Table = 'users' | 'products' | 'orders';type Column<T extends Table> =  T extends 'users' ? 'id' | 'name' | 'email' | 'created_at' :  T extends 'products' ? 'id' | 'name' | 'price' | 'in_stock' :  T extends 'orders' ? 'id' | 'user_id' | 'total' | 'status' : never;type WhereCondition<T extends Table> = {  [K in Column<T>]?: {    equals?: any;    notEquals?: any;    in?: any[];  };};function query<T extends Table>(  table: T,  where?: WhereCondition<T>): `SELECT * FROM ${T}${string}` {  // Implementation would build the query  return `SELECT * FROM ${table}` as const;}// Usageconst userQuery = query('users', {  name: { equals: 'John' },  created_at: { in: ['2023-01-01', '2023-12-31'] }});// Type: "SELECT * FROM users WHERE ..."
```

* * *

## Best Practices

### Do's and Don'ts

#### Do:

*   Use literal types for fixed sets of values (enums, configuration options)
*   Combine with union types for better type safety
*   Use template literal types for string pattern matching
*   Leverage type inference when possible
*   Document the meaning of literal types

#### Don't:

*   Overuse literal types when a more general type would be better
*   Create extremely large union types that hurt performance
*   Use string literals when an enum would be more appropriate

* * *

## Performance Considerations

### Type Checking Performance

*   Large union types can slow down type checking
*   Complex template literal types can increase compilation time
*   Consider using type aliases for complex literal types
*   Be mindful of TypeScript's recursion depth limits

* * *

* * *