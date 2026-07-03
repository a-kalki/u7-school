# PostgreSQL UPDATE

* * *

## The UPDATE Statement

The `UPDATE` statement is used to modify the value(s) in existing records in a table.

```javascript
UPDATE carsSET color = 'red'WHERE brand = 'Volvo';
```
```javascript
UPDATE 1
```

Which means that `1` row was affected by the `UPDATE` statement.

**Note:** Be careful with the `WHERE` clause, in the example above ALL rows where brand = 'Volvo' gets updated.

* * *

## Display Table

To check the result we can display the table with this SQL statement:

```javascript
SELECT * FROM cars;
```

* * *

## Warning! Remember WHERE

Be careful when updating records. If you omit the `WHERE` clause, ALL records will be updated!

```javascript
UPDATE carsSET color = 'red';
```
```javascript
UPDATE 4
```

Which means that all `4` row was affected by the `UPDATE` statement.

* * *

* * *

## Display Table

To check the result we can display the table with this SQL statement:

```javascript
SELECT * FROM cars;
```

* * *

## Update Multiple Columns

To update more than one column, separate the name/value pairs with a comma `,`:

```javascript
UPDATE carsSET color = 'white', year = 1970WHERE brand = 'Toyota';
```
```javascript
UPDATE 1
```

Which means that `1` row was affected by the `UPDATE` statement.

* * *

## Display Table

To check the result we can display the table with this SQL statement:

```javascript
SELECT * FROM cars;
```

* * *

* * *