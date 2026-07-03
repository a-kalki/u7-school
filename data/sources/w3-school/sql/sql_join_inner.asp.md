# SQL INNER JOIN

* * *

## SQL INNER JOIN

The `INNER JOIN` returns only rows that have **matching values** in both tables.

**Tip:** You can use just `JOIN` instead of `INNER JOIN`, as `INNER` is the default join type.

![SQL INNER JOIN](img_inner_join.png)

### INNER JOIN Syntax

```javascript

```

**Note:** The syntax combines two tables based on a **related column**, and the `ON` keyword is used to specify the matching condition.

* * *

## INNER JOIN Example

Look at a product in the [**Products**](https://www.w3schools.com/sql/trysql.asp?filename=trysql_products) table:

ProductID

ProductName

CategoryID

Price

3

Aniseed Syrup

2

10.00

And look at a row in the [**Categories**](https://www.w3schools.com/sql/trysql.asp?filename=trysql_categories) table:

CategoryID

CategoryName

Description

2

Condiments

Sweet and savory sauces, relishes, spreads, and seasonings

Here we see that the **related column** between the two tables above, is the "CategoryID" column.

Now we create an `INNER JOIN` on the "Products" table and the "Categories" table, via the CategoryID field:

```javascript
SELECT ProductID, ProductName, CategoryNameFROM ProductsINNER JOIN Categories ON Products.CategoryID = Categories.CategoryID;
```

**Note:** `INNER JOIN` returns only rows with a match in both tables. This means that if there is a product with no CategoryID, or with a CategoryID not present in the Categories table, that row will not be returned in the result.

* * *

* * *

## Naming the Columns

It is a good practice to also include the table name when specifying columns in SQL joins:

```javascript
SELECT Products.ProductID, Products.ProductName, Categories.CategoryNameFROM ProductsINNER JOIN Categories ON Products.CategoryID = Categories.CategoryID;
```

The example above works without specifying table names, because none of the specified column names are present in both tables. However, if you add the CategoryID column in the `SELECT` statement, an error occurs, if you do not specify the table name. This is because the CategoryID column is present in both tables.

* * *

## JOIN or INNER JOIN

`JOIN` and `INNER JOIN` will return the same result.

`INNER` is the default join type for `JOIN`, so when you write `JOIN` the parser actually writes `INNER JOIN`.

```javascript
SELECT Products.ProductID, Products.ProductName, Categories.CategoryNameFROM ProductsJOIN Categories ON Products.CategoryID = Categories.CategoryID;
```

* * *

## JOIN Multiple Tables

You can join more than two tables by adding multiple `INNER JOIN` clauses in your query.

The following SQL selects all orders with customer and shipper information:

```javascript
SELECT Orders.OrderID, Customers.CustomerName, Shippers.ShipperNameFROM OrdersINNER JOIN Customers ON Orders.CustomerID = Customers.CustomerIDINNER JOIN Shippers ON Orders.ShipperID = Shippers.ShipperID;
```

Here is the [**Shippers**](https://www.w3schools.com/sql/trysql.asp?filename=trysql_shippers) table:

ShipperID

ShipperName

Phone

1

Speedy Express

(503) 555-9831

2

United Package

(503) 555-3199

3

Federal Shipping

(503) 555-9931

* * *

* * *