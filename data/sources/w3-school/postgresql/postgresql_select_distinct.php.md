# PostgreSQL SELECT DISTINCT

* * *

## The SELECT DISTINCT Statement

The `SELECT DISTINCT` statement is used to return only distinct (different) values.

Inside a table, a column often contains many duplicate values and sometimes you only want to list the different (distinct) values.

```javascript
SELECT DISTINCT country FROM customers;
```

Even though the customers table has 91 records, it only has 21 different countries, and that is what you get as a result when executing the `SELECT DISTINCT` statement above

* * *

## SELECT COUNT(DISTINCT)

We can also use the `DISTINCT` keyword in combination with the `COUNT` statement, which in the example below will return the number of different countries there are in the `customers` table.

```javascript
SELECT COUNT(DISTINCT country) FROM customers;
```

* * *

* * *

* * *