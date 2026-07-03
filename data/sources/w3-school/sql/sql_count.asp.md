# SQL COUNT() Function

* * *

## The SQL COUNT() Function

The `COUNT()` function returns the number of rows that matches a specified criterion.

### COUNT() Syntax

```javascript

```

The behavior of `COUNT()` depends on the argument used within the parentheses:

*   `COUNT(*)` - Counts the total number of rows in a table (including NULL values).
*   `COUNT(columnname)` - Counts all non-null values in the column.
*   `COUNT(DISTINCT columnname)` - Counts only the unique, non-null values in the column.

* * *

## Using COUNT(\*)

The following SQL uses `COUNT(*)`, and counts the total number of rows in the "Products" table (will include NULL values):

```javascript
SELECT COUNT(*)FROM Products;
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

## Using COUNT(column\_name)

The `COUNT(column_name)` counts all non-null values in the specified column.

The following SQL counts all non-null values of the "ProductName" column:

```javascript
SELECT COUNT(ProductName)FROM Products;
```

* * *

## Using COUNT(DISTINCT column\_name)

You can ignore duplicates by using the `DISTINCT` keyword.

The `COUNT(DISTINCT column_name)` counts only the unique, non-null values in the column.

If `DISTINCT` is specified, rows with the same value for the specified column will be counted as one.

The following SQL counts the unique, non-null values of the "Price" column:

```javascript
SELECT COUNT(DISTINCT Price)FROM Products;
```

* * *

## Add a WHERE Clause

You can add a `WHERE` clause to specify conditions:

```javascript
SELECT COUNT(ProductID)FROM ProductsWHERE Price > 20;
```

* * *

## Use an Alias

When using `COUNT()`, the returned column will not have a name. Use the `AS` keyword to give the column a descriptive name.

```javascript
SELECT COUNT(*) AS [Number of records]FROM Products;
```

* * *

## Use COUNT() with GROUP BY

Here we use the `COUNT()` function and the `GROUP BY` clause, to return the number of records for EACH category in the "Products" table:

```javascript
SELECT COUNT(*) AS [Number of records], CategoryIDFROM ProductsGROUP BY CategoryID;
```

You will learn more about the `[GROUP BY](sql_groupby.asp.html)` clause later in this tutorial.

* * *

* * *