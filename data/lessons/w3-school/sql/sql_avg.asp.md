# SQL AVG() Function

* * *

## The SQL AVG() Function

The `AVG()` function returns the average value of a numeric column.

The `AVG()` function ignores NULL values in the column.

```javascript
SELECT AVG(Price)FROM Products;
```

**Note:** NULL values are ignored.

* * *

## AVG() Syntax

```javascript

```

* * *

## Demo Database

Below is a selection from the [**Products**](https://www.w3schools.com/sql/trysql.asp?filename=trysql_products) table used in the examples:

ProductID

ProductName

SupplierID

CategoryID

Unit

Price

1

Chais

1

1

10 boxes x 20 bags

18.00

2

Chang

1

1

24 - 12 oz bottles

19.00

3

Aniseed Syrup

1

2

12 - 550 ml bottles

10.00

4

Chef Anton's Cajun Seasoning

2

2

48 - 6 oz jars

22.00

5

Chef Anton's Gumbo Mix

2

2

36 boxes

21.35

* * *

* * *

## Add a WHERE Clause

You can add a `WHERE` clause to specify conditions:

```javascript
SELECT AVG(Price)FROM ProductsWHERE CategoryID = 1;
```

* * *

## Use an Alias

Give the AVG column a name by using the `AS` keyword.

```javascript
SELECT AVG(Price) AS [average price]FROM Products;
```

* * *

## Higher Than Average

To list all records with a higher price than average, we can use the `AVG()` function in a sub query:

```javascript
SELECT * FROM ProductsWHERE price > (SELECT AVG(price) FROM Products);
```

* * *

## Use AVG() with GROUP BY

Here we use the `AVG()` function and the `GROUP BY` clause, to return the average price for EACH category in the "Products" table:

```javascript
SELECT AVG(Price) AS AveragePrice, CategoryIDFROM ProductsGROUP BY CategoryID;
```

You will learn more about the `[GROUP BY](sql_groupby.asp.html)` clause later in this tutorial.

* * *

* * *