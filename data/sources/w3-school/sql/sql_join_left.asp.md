# SQL LEFT JOIN

* * *

## SQL LEFT JOIN

The `LEFT JOIN` returns **all rows from the left table** (table1), and only the matched rows from the right table (table2).

If there is no match in the right table, the result for the columns from the right table will be NULL.

The `LEFT JOIN` and `LEFT OUTER JOIN` keywords are equal - the `OUTER` keyword is optional.

![SQL LEFT JOIN](img_left_join.png)

### LEFT JOIN Syntax

```javascript
SELECT column_name(s)FROM table1LEFT JOIN table2ON table1.column_name = table2.column_name;
```

**Note:** The syntax combines two tables based on a **related column**, and the `ON` keyword is used to specify the matching condition.

* * *

## Demo Database

Below is a selection from the "Customers" table:

CustomerID

CustomerName

ContactName

Address

City

PostalCode

Country

1  
  

Alfreds Futterkiste

Maria Anders

Obere Str. 57

Berlin

12209

Germany

2

Ana Trujillo Emparedados y helados

Ana Trujillo

Avda. de la Constitución 2222

México D.F.

05021

Mexico

3

Antonio Moreno Taquería

Antonio Moreno

Mataderos 2312

México D.F.

05023

Mexico

And a selection from the "Orders" table:

OrderID

CustomerID

EmployeeID

OrderDate

ShipperID

10308

2

7

1996-09-18

3

10309

37

3

1996-09-19

1

10310

77

8

1996-09-20

2

Here we see that the **related column** between the two tables above, is the "CustomerID" column.

* * *

* * *

## SQL LEFT JOIN Examples

The following SQL returns all customers and their orders, including customers who have not placed any orders:

```javascript
SELECT Customers.CustomerName, Orders.OrderIDFROM CustomersLEFT JOIN Orders ON Customers.CustomerID = Orders.CustomerIDORDER BY Customers.CustomerName;
```

**Tip:** To find only the customers who have not placed any order, add a `WHERE` clause to filter for NULL values on the right table:

```javascript
SELECT Customers.CustomerName, Orders.OrderIDFROM CustomersLEFT JOIN OrdersON Customers.CustomerID = Orders.CustomerIDWHERE Orders.CustomerID IS NULL;
```

* * *

* * *