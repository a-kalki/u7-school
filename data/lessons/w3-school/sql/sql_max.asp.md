# SQL MAX() Function

* * *

## The SQL MAX() Function

The `MAX()` function returns the largest value of the selected column.

The `MAX()` function works with numeric, string, and date data types.

```javascript
SELECT MAX(Price)FROM Products;
```

* * *

## MAX() Syntax

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

## Set Column Name (Alias)

When you use `MAX()`, the returned column will not have a name.

Use the `AS` keyword, to give the column a descriptive name:

```javascript
SELECT MAX(Price) AS HighestPriceFROM Products;
```

* * *

## Use MAX() with Date Column

The following SQL returns the latest BirthDate in the BirthDate column, in the [**Employees**](https://www.w3schools.com/sql/trysql.asp?filename=trysql_employees) table:

```javascript
SELECT MAX(BirthDate) AS LatestBirthdateFROM Employees;
```

* * *

## Use MAX() with GROUP BY

Here we use the `MAX()` function and the `GROUP BY` clause, to return the highest price for each category in the Products table:

```javascript
SELECT MAX(Price) AS HighestPrice, CategoryIDFROM ProductsGROUP BY CategoryID;
```

You will learn more about the `[GROUP BY](sql_groupby.asp.html)` clause later in this tutorial.

* * *

* * *