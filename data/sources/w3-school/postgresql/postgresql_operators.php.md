# PostgreSQL Operators

* * *

## Operators in the WHERE clause

We can operate with different operators in the `WHERE` clause:

`=`

Equal to

`<`

Less than

`>`

Greater than

`<=`

Less than or equal to

`>=`

Greater than or equal to

`<>`

Not equal to

`!=`

Not equal to

`LIKE`

Check if a value matches a pattern (case sensitive)

`ILIKE`

Check if a value matches a pattern (case insensitive)

`AND`

Logical AND

`OR`

Logical OR

`IN`

Check if a value matches any value within a provided list

`BETWEEN`

Check if a value is within a specified range

`IS NULL`

Check if a value is NULL

`NOT`

Makes a negative result e.g. `NOT LIKE`, `NOT IN`, `NOT BETWEEN`

* * *

## Equal To

The `=` operator is used when you want to return all records where a column is equal to a specified value:

```javascript
SELECT * FROM carsWHERE brand = 'Volvo';
```

* * *

## Less Than

The `<` operator is used when you want to return all records where a column is less than a specified value.

```javascript
SELECT * FROM carsWHERE year < 1975;
```

* * *

* * *

## Greater Than

The `>` operator is used when you want to return all records where a columns is greater than a specified value.

```javascript
SELECT * FROM carsWHERE year > 1975;
```

* * *

## Less Than or Equal To

The `<=` operator is used when you want to return all records where a column is less than, or equal to, a specified value.

```javascript
SELECT * FROM carsWHERE year <= 1975;
```

* * *

## Greater Than or Equal to

The `>=` operator is used when you want to return all records where a columns is greater than, or equal to, a specified value.

```javascript
SELECT * FROM carsWHERE year >= 1975;
```

* * *

## Not Equal To

The `<>` operator is used when you want to return all records where a column is NOT equal to a specified value:

```javascript
SELECT * FROM carsWHERE brand <> 'Volvo';
```

You will get the same result with the `!=` operator:

```javascript
SELECT * FROM carsWHERE brand != 'Volvo';
```

* * *

## LIKE

The `LIKE` operator is used when you want to return all records where a column is equal to a specified pattern.

The pattern can be an absolute value like 'Volvo', or with a wildcard that has a special meaning.

There are two wildcards often used in conjunction with the LIKE operator:

*   The percent sign `%`, represents zero, one, or multiple characters.
*   The underscore sign `_`, represents one single character.

```javascript
SELECT * FROM carsWHERE model LIKE 'M%';
```

The `LIKE` operator is case sensitive.

* * *

## ILIKE

Same as the `LIKE` operator, but `ILIKE` is case insensitive.

```javascript
SELECT * FROM carsWHERE model ILIKE 'm%';
```

* * *

## AND

The logical `AND` operator is used when you want to check more that one condition:

```javascript
SELECT * FROM carsWHERE brand = 'Volvo' AND year = 1968;
```

* * *

## OR

The logical `OR` operator is used when you can accept that only one of many conditions is true:

```javascript
SELECT * FROM carsWHERE brand = 'Volvo' OR year = 1975;
```

* * *

## IN

The `IN` operator is used when a column's value matches any of the values in a list:

```javascript
SELECT * FROM carsWHERE brand IN ('Volvo', 'Mercedes', 'Ford');
```

* * *

## BETWEEN

The `BETWEEN` operator is used to check if a column's value is between a specified range of values:

```javascript
SELECT * FROM carsWHERE year BETWEEN 1970 AND 1980;
```

The `BETWEEN` operator includes the `_from_` and `_to_` values, meaning that in the above example, the result would include cars made in 1970 and 1980 as well.

* * *

## IS NULL

The `IS NULL` operator is used to check if a column's value is NULL:

```javascript
SELECT * FROM carsWHERE model IS NULL;
```

* * *

## NOT

The `NOT` operator can be used together with `LIKE`, `ILIKE`, `IN`, `BETWEEN`, and `NULL` operators to reverse the truth of the operator.

```javascript
SELECT * FROM carsWHERE brand NOT LIKE 'B%';
```
```javascript
SELECT * FROM carsWHERE brand NOT ILIKE 'b%';
```
```javascript
SELECT * FROM carsWHERE brand NOT IN ('Volvo', 'Mercedes', 'Ford');
```
```javascript
SELECT * FROM carsWHERE year NOT BETWEEN 1970 AND 1980;
```

The `NOT BETWEEN` operator excludes the `_from_` and `_to_` values, meaning that in the above example, the result would not include cars made in 1970 and 1980.

```javascript
SELECT * FROM carsWHERE model IS NOT NULL;
```

The `cars` table has no columns with NULL values, so the example above will return all 4 rows.

* * *

* * *