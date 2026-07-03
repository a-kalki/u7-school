# SQL HAVING Clause

* * *

## The SQL HAVING Clause

The `HAVING` clause is used to filter the results of a `GROUP BY` query based on aggregate functions.

Unlike the `WHERE` clause, which filters individual rows before grouping, the `HAVING` clause filters groups **after** the aggregation has been performed.

### HAVING Syntax

```javascript
SELECT column1, aggregate_function(column2), column3, ...FROM table_nameWHERE conditionGROUP BY column1, column3HAVING condition -- The condition on grouped dataORDER BY column_name;
```

* * *

## Demo Database

Below is a selection from the "Customers" table in the Northwind sample database:

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

4  
  

Around the Horn

Thomas Hardy

120 Hanover Sq.

London

WA1 1DP

UK

5

Berglunds snabbköp

Christina Berglund

Berguvsvägen 8

Luleå

S-958 22

Sweden

* * *

## SQL HAVING Examples

The following SQL returns the number of customers in each country - but only include countries with more than 5 customers:

```javascript
SELECT Country, COUNT(CustomerID) AS [Number of Customers]FROM CustomersGROUP BY CountryHAVING COUNT(CustomerID) > 5;
```

The following SQL returns the number of customers in each country, sorted from high to low (and only include countries with more than 5 customers):

```javascript
SELECT Country, COUNT(CustomerID) AS [Number of Customers]FROM CustomersGROUP BY CountryHAVING COUNT(CustomerID) > 5ORDER BY COUNT(CustomerID) DESC;
```

* * *

* * *

## Demo Database

Below is a selection from the "Orders" table in the Northwind sample database:

OrderID

CustomerID

EmployeeID

OrderDate

ShipperID

10248

90

5

1996-07-04

3

10249

81

6

1996-07-05

1

10250

34

4

1996-07-08

2

And a selection from the "Employees" table:

EmployeeID

LastName

FirstName

BirthDate

Photo

Notes

1

Davolio

Nancy

1968-12-08

EmpID1.pic

Education includes a BA....

2

Fuller

Andrew

1952-02-19

EmpID2.pic

Andrew received his BTS....

3

Leverling

Janet

1963-08-30

EmpID3.pic

Janet has a BS degree....

* * *

## More HAVING Examples

The following SQL returns the employees that have registered more than 10 orders:

```javascript
SELECT Employees.LastName, COUNT(Orders.OrderID) AS NumberOfOrdersFROM OrdersINNER JOIN Employees ON Orders.EmployeeID = Employees.EmployeeIDGROUP BY LastNameHAVING COUNT(Orders.OrderID) > 10;
```

The following SQL returns if the employees "Davolio" or "Fuller" have registered more than 25 orders:

```javascript
SELECT Employees.LastName, COUNT(Orders.OrderID) AS NumberOfOrdersFROM OrdersINNER JOIN Employees ON Orders.EmployeeID = Employees.EmployeeIDWHERE LastName = 'Davolio' OR LastName = 'Fuller'GROUP BY LastNameHAVING COUNT(Orders.OrderID) > 25;
```

* * *

* * *