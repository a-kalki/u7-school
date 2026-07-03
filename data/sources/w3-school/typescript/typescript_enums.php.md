# TypeScript Enums

* * *

An **enum** is a special "class" that represents a group of constants (unchangeable variables).

Enums come in two flavors `string` and `numeric`.

Let's start with numeric.

* * *

## Numeric Enums - Default

By default, enums will initialize the first value to `0` and add 1 to each additional value:

```javascript
enum CardinalDirections {  North,  East,  South,  West}let currentDirection = CardinalDirections.North;// logs 0console.log(currentDirection);// throws error as 'North' is not a valid enumcurrentDirection = 'North'; // Error: "North" is not assignable to type 'CardinalDirections'.
```

* * *

* * *

## Numeric Enums - Initialized

You can set the value of the first numeric enum and have it auto increment from that:

```javascript
enum CardinalDirections {  North = 1,  East,  South,  West}// logs 1console.log(CardinalDirections.North);// logs 4console.log(CardinalDirections.West);
```

* * *

## Numeric Enums - Fully Initialized

You can assign unique number values for each enum value.

Then the values will not be incremented automatically:

```javascript
enum StatusCodes {  NotFound = 404,  Success = 200,  Accepted = 202,  BadRequest = 400}// logs 404console.log(StatusCodes.NotFound);// logs 200console.log(StatusCodes.Success);
```

* * *

## String Enums

Enums can also contain `strings`.

This is more common than numeric enums, because of their readability and intent.

```javascript
enum CardinalDirections {  North = 'North',  East = "East",  South = "South",  West = "West"};// logs "North"console.log(CardinalDirections.North);// logs "West"console.log(CardinalDirections.West);
```

Technically, you can mix and match string and numeric enum values, but it is recommended not to do so.

* * *

* * *