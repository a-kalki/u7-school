# SQL RIGHT JOIN

* * *

## SQL RIGHT JOIN

The `RIGHT JOIN` returns **all rows from the right table** (table2), and only the matched rows from the left table (table1).

If there is no match in the left table, the result for the columns from the left table will be NULL.

The `RIGHT JOIN` and `RIGHT OUTER JOIN` keywords are equal - the `OUTER` keyword is optional.

![SQL RIGHT JOIN](img_right_join.png)

### RIGHT JOIN Syntax

```javascript
SELECT column_name(s)FROM table1RIGHT JOIN table2ON table1.column_name = table2.column_name;
```

**Note:** The syntax combines two tables based on a **related column**, and the `ON` keyword is used to specify the matching condition.

* * *

## Demo Database

Below is a selection from the "Orders" table:

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

And a selection from the "Employees" table:

EmployeeID

LastName

FirstName

BirthDate

Photo

1

Davolio

Nancy

1968-12-08

EmpID1.pic

2

Fuller

Andrew

1952-02-19

EmpID2.pic

3

Leverling

Janet

1963-08-30

EmpID3.pic

Here we see that the related column between the two tables above, is the "EmployeeID" column.

* * *

* * *

## SQL RIGHT JOIN Example

The following SQL will return all employees, and any orders they might have placed:

```javascript
SELECT Orders.OrderID, Employees.LastName, Employees.FirstNameFROM OrdersRIGHT JOIN Employees ON Orders.EmployeeID = Employees.EmployeeIDORDER BY Orders.OrderID;
```

**Note:** The `RIGHT JOIN` keyword returns all records from the right table (Employees), even if there are no matches in the left table (Orders).

* * *

* * *