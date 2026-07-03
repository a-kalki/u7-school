# SQL Joins

* * *

## The SQL JOIN Clause

The `JOIN` clause is used to combine rows from two or more tables, based on a related column between them.

Here are the different types of JOINs in SQL:

*   `(INNER) JOIN`: Returns only rows that have **matching values** in both tables
*   `LEFT (OUTER) JOIN`: Returns **all rows from the left table**, and only the matched rows from the right table
*   `RIGHT (OUTER) JOIN`: Returns **all rows from the right table**, and only the matched rows from the left table
*   `FULL (OUTER) JOIN`: Returns **all rows** when there is a match in either the left or right table

Look at an order in "Orders" table:

OrderID

CustomerID

OrderDate

10308

2

1996-09-18

Then, look at a customer in the "Customers" table:

CustomerID

CustomerName

ContactName

Country

2

Ana Trujillo Emparedados y helados

Ana Trujillo

Mexico

Here we see that the "CustomerID" column in the "Orders" table refers to the "CustomerID" in the "Customers" table. The relationship between the two tables above is the "CustomerID" column.

Then, we can create the following SQL statement (that contains an `INNER JOIN`), that selects records that have matching values in both tables:

```javascript
SELECT Orders.OrderID, Customers.CustomerName, Orders.OrderDateFROM OrdersINNER JOIN Customers ON Orders.CustomerID=Customers.CustomerID;
```

and it will produce something like this:

OrderID

CustomerName

OrderDate

10308

Ana Trujillo Emparedados y helados

1996-09-18

10365

Antonio Moreno Taquería

1996-11-27

10383

Around the Horn

1996-11-15

10355

Around the Horn

1996-12-16

10278

Berglunds snabbköp

1996-12-16

* * *

* * *

* * *