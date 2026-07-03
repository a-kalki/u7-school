# SQL UNION ALL Operator

* * *

## The SQL UNION ALL Operator

The `UNION ALL` operator is used to combine the result-set of two or more `SELECT` statements.

The `UNION ALL` operator includes all rows from each statement, **including any duplicates**.

Requirements for `UNION ALL`: 

*   Every `SELECT` statement within `UNION ALL` must have the same number of columns
*   The columns must also have similar data types
*   The columns in every `SELECT` statement must also be in the same order

### UNION ALL Syntax

```javascript
SELECT column_name(s) FROM table1UNION ALLSELECT column_name(s) FROM table2;
```

**Note:** The column names in the result-set are usually equal to the column names in the first `SELECT` statement.

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

And a selection from the "Suppliers" table:

SupplierID

SupplierName

ContactName

Address

City

PostalCode

Country

1

Exotic Liquid

Charlotte Cooper

49 Gilbert St.

London

EC1 4SD

UK

2

New Orleans Cajun Delights

Shelley Burke

P.O. Box 78934

New Orleans

70117

USA

3

Grandma Kelly's Homestead

Regina Murphy

707 Oxford Rd.

Ann Arbor

48104

USA

* * *

* * *

## SQL UNION ALL Example

The following SQL returns all the countries (also duplicate values) from both the "Customers" and the "Suppliers" table:

```javascript
SELECT Country FROM CustomersUNION ALLSELECT Country FROM SuppliersORDER BY Country;
```

* * *

## SQL UNION ALL With WHERE

Here we add a `WHERE` clause to return all the German cities from both the "Customers" and the "Suppliers" table:

```javascript
SELECT City, Country FROM CustomersWHERE Country='Germany'UNION ALLSELECT City, Country FROM SuppliersWHERE Country='Germany'ORDER BY City;
```

* * *

* * *