# SQL Comments

* * *

## SQL Comments

Comments are used to explain SQL code, or to temporarily prevent execution of SQL code (for debugging).

Comments are ignored by the database engine.

SQL supports single-line comments `--`, and multi-line comments `/* */`.

**Note:** Comments are not supported in Microsoft Access databases.

* * *

## SQL Single-line Comments

Single-line comments start with `--` and continue to the end of line.

Any text after `--` and to the end of the line will be ignored.

The following example uses a single-line comment as an explanation:

```javascript
-- Selects all German customersSELECT * FROM CustomersWHERE Country = 'Germany';
```

The following example uses a single-line comment to comment away the end of a line:

```javascript
SELECT * FROM Customers -- WHERE City='Berlin';
```

The following example uses a single-line comment to temporarily prevent execution of an SQL statement:

```javascript
-- SELECT * FROM Customers;SELECT * FROM Products;
```

* * *

* * *

## SQL Multi-line Comments

Multi-line comments start with `/*` and end with `*/`.

Any text between `/*` and `*/` will be ignored.

The following example uses a multi-line comment as an explanation:

```javascript
/* Selects all German customersfrom Berlin */SELECT * FROM CustomersWHERE Country = 'Germany' AND City = 'Berlin';
```

The following example uses a multi-line comment to ignore many SQL statements:

```javascript
/* SELECT * FROM Customers;SELECT * FROM Products;SELECT * FROM Orders;SELECT * FROM Categories; */SELECT * FROM Suppliers;
```

To ignore just a part of an SQL code, you can also use multi-line comment:

```javascript
SELECT CustomerName, /*City,*/ Country FROM Customers;
```

The following example uses a multi-line comment to ignore part of an SQL statement:

```javascript
SELECT * FROM Customers WHERE (CustomerName LIKE 'L%'OR CustomerName LIKE 'R%' /*OR CustomerName LIKE 'S%'OR CustomerName LIKE 'T%'*/ OR CustomerName LIKE 'W%')AND Country='USA'ORDER BY CustomerName;
```

* * *

* * *