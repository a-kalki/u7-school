# PostgreSQL DROP TABLE

* * *

## The DROP TABLE Statement

The `DROP TABLE` statement is used to drop an existing table in a database.

**Note:** Be careful before dropping a table. Deleting a table will result in loss of all information stored in the table!

The following SQL statement drops the existing table `cars`:

```javascript
DROP TABLE cars;
```
```javascript
DROP TABLE
```

* * *

## Display Table

To check the result we can display the table with this SQL statement:

```javascript
SELECT * FROM cars;
```

Which will result in an error, because the `cars` table no longer exists:

```javascript
ERROR: relation "cars" does not existLINE 1: SELECT * FROM cars;                      ^
```

* * *

* * *

* * *