# SQL ORDER BY Keyword

* * *

## The SQL ORDER BY

The `ORDER BY` keyword is used to sort the result-set in ascending or descending order.

The `ORDER BY` keyword sorts the result-set in ascending order (ASC) by default.

```javascript
SELECT * FROM ProductsORDER BY Price;
```

* * *

## ORDER BY Syntax

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

18

2

Chang

1

1

24 - 12 oz bottles

19

3

Aniseed Syrup

1

2

12 - 550 ml bottles

10

4

Chef Anton's Cajun Seasoning

2

2

48 - 6 oz jars

22

5

Chef Anton's Gumbo Mix

2

2

36 boxes

21.35

* * *

* * *

## ORDER BY DESC

 To sort the records in descending order, use the `DESC` keyword.

```javascript
SELECT * FROM ProductsORDER BY Price DESC;
```

* * *

## Order Alphabetically

For string values, the `ORDER BY` keyword will sort the values in the column alphabetically:

```javascript
SELECT * FROM ProductsORDER BY ProductName;
```

* * *

## Alphabetically DESC

To sort the text values in a column in a descending order, use the `DESC` keyword:

```javascript
SELECT * FROM ProductsORDER BY ProductName DESC;
```

* * *

## ORDER BY Several Columns

The following SQL statement selects all customers from the "Customers" table - and sorts it by the "Country" and the "CustomerName" column.

This means that it sorts it first by Country, and if some records have the same Country, it sorts them by CustomerName:

```javascript
SELECT * FROM CustomersORDER BY Country, CustomerName;
```

* * *

## Combine ASC and DESC

The following SQL statement selects all customers from the "Customers" table, and sorts it ASCENDING by the "Country" and DESCENDING by the "CustomerName" column:

```javascript
SELECT * FROM CustomersORDER BY Country ASC, CustomerName DESC;
```

* * *

* * *

## Video: SQL ORDER BY Keyword

  [![SQL Tutorial on YouTube](images/yt_logo_rgb_dark.png)

 ![SQL Tutorial on YouTube](images/img_sql_order_by.png)](https://youtu.be/uUO-ynRJKo0&list=PLP9IO4UYNF0UQkBXlTMSw0CYsxv-GDkkI)

* * *