# PostgreSQL DELETE

* * *

## The DELETE Statement

The `DELETE` statement is used to delete existing records in a table.

**Note:** Be careful when deleting records in a table! Notice the `WHERE` clause in the `DELETE` statement. The `WHERE` clause specifies which record(s) should be deleted.

If you omit the `WHERE` clause,  
**all records in the table will be deleted**!.

To delete the record(s) where brand is 'Volvo', use this statement:

```javascript
DELETE FROM carsWHERE brand = 'Volvo';
```
```javascript
DELETE 1
```

Which means that `1` row was deleted.

* * *

## Display Table

To check the result we can display the table with this SQL statement:

```javascript
SELECT * FROM cars;
```

* * *

* * *

## Delete All Records

It is possible to delete all rows in a table without deleting the table. This means that the table structure, attributes, and indexes will be intact.

The following SQL statement deletes all rows in the `cars` table, without deleting the table:

```javascript
DELETE FROM cars;
```
```javascript
DELETE 3
```

Which means that all `3` rows were deleted.

* * *

## Display Table

To check the result we can display the table with this SQL statement:

```javascript
SELECT * FROM cars;
```

* * *

## TRUNCATE TABLE

Because we omit the `WHERE` clause in the `DELETE` statement above, all records will be deleted from the cars table.

The same would have been achieved by using the `TRUNCATE TABLE` statement:

```javascript
TRUNCATE TABLE cars;
```
```javascript
TRUNCATE TABLE
```

* * *

## Display Table

To check the result we can display the table with this SQL statement:

```javascript
SELECT * FROM cars;
```

* * *

* * *