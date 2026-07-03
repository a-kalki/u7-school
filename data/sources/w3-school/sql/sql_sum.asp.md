# SQL SUM() Function

* * *

## The SQL SUM() Function

The `SUM()` function is used to calculate the total sum of values within a numeric column.

The `SUM()` function ignores NULL values in the column.

The following SQL returns the sum of the Quantity field in the "OrderDetails" table:

```javascript
SELECT SUM(Quantity)FROM OrderDetails;
```

* * *

## SUM() Syntax

```javascript

```

* * *

## Demo Database

Below is a selection from the [**OrderDetails**](https://www.w3schools.com/sql/trysql.asp?filename=trysql_orderdetails) table used in the examples:

OrderDetailID

OrderID

ProductID

Quantity

1

10248

11

12

2

10248

42

10

3

10248

72

5

4

10249

14

9

5

10249

51

40

* * *

* * *

## Add a WHERE Clause

You can add a `WHERE` clause to specify conditions.

The following SQL returns the sum of the Quantity field for the product with ProductID = 11, in the "OrderDetails" table:

```javascript
SELECT SUM(Quantity)FROM OrderDetailsWHERE ProductId = 11;
```

* * *

## Use an Alias

Give the summarized column a name by using the `AS` keyword.

```javascript
SELECT SUM(Quantity) AS totalFROM OrderDetails;
```

* * *

## Use SUM() with GROUP BY

Here we use the `SUM()` function and the `GROUP BY` clause, to return the Quantity for EACH OrderID in the "OrderDetails" table:

```javascript
SELECT OrderID, SUM(Quantity) AS [Total Quantity]FROM OrderDetailsGROUP BY OrderID;
```

You will learn more about the `[GROUP BY](sql_groupby.asp.html)` clause later in this tutorial.

* * *

## SUM() With an Expression

The parameter inside the `SUM()` function can also be an expression.

If we assume that each product in the "OrderDetails" table costs 10 dollars, we can find the total earnings in dollars by multiply each quantity with 10:

```javascript
SELECT SUM(Quantity * 10)FROM OrderDetails;
```

We can also join the "OrderDetails" table with the "Products" table to find the actual price, instead of assuming it is 10 dollars:

```javascript
SELECT SUM(Price * Quantity)FROM OrderDetailsLEFT JOIN Products ON OrderDetails.ProductID = Products.ProductID;
```

You will learn more about [Joins](sql_join.asp.html) later in this tutorial.

* * *

* * *