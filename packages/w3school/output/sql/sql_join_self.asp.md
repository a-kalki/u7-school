# SQL Self Join

* * *

## SQL Self Join

A self join is a regular join, but the table is joined with itself.

### Self Join Syntax

```javascript
SELECT column_name(s)FROM table1 T1, table1 T2WHERE condition;
```

_T1_ and _T2_ are different table aliases for the same table.

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

* * *

* * *

## SQL Self Join Example

The following SQL statement matches customers that are from the same city:

```javascript
SELECT A.CustomerName AS CustomerName1, B.CustomerName AS CustomerName2, A.CityFROM Customers A, Customers BWHERE A.CustomerID <> B.CustomerIDAND A.City = B.CityORDER BY A.City;
```

* * *

* * *