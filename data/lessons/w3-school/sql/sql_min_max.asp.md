# SQL MIN() Function

* * *

## The SQL MIN() Function

The `MIN()` function returns the smallest value of the selected column.

The `MIN()` function works with numeric, string, and date data types.

```javascript
SELECT MIN(Price)FROM Products;
```

* * *

## MIN() Syntax

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

When using `MIN()`, the returned column will not have a name.

Use the `AS` keyword to give the column a descriptive name:

```javascript
SELECT MIN(Price) AS SmallestPriceFROM Products;
```

* * *

## Use MIN() with Date Column

The following SQL returns the earliest BirthDate in the BirthDate column, in the [**Employees**](https://www.w3schools.com/sql/trysql.asp?filename=trysql_employees) table:

```javascript
SELECT MIN(BirthDate) AS EarliestBirthdateFROM Employees;
```

* * *

## Use MIN() with GROUP BY

Here we use the `MIN()` function and the `GROUP BY` clause, to return the smallest price for each category in the Products table:

```javascript
SELECT MIN(Price) AS SmallestPrice, CategoryIDFROM ProductsGROUP BY CategoryID;
```

You will learn more about the `[GROUP BY](sql_groupby.asp.html)` clause later in this tutorial.