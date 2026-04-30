# SQL INSERT INTO SELECT Statement

* * *

## The SQL INSERT INTO SELECT Statement

The `INSERT INTO SELECT` statement is used to copy data from an existing table and insert it into another existing table.

The `INSERT INTO SELECT` statement requires that the data types in source and target tables match.

**Note:** The existing records in the target table are unaffected.

### INSERT INTO SELECT Syntax

Copy all columns from one table to another table:

```javascript
INSERT INTO target_tableSELECT * FROM source_tableWHERE condition;
```

**Note:** If you omit the column names, the number and order of columns in the source and target tables must be exactly the same!

Copy only some columns from one table to another table:

```javascript
INSERT INTO target_table (column1, column2, column3, ...)SELECT column1, column2, column3, ...FROM source_tableWHERE condition;
```

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

Postal Code

Country

1

Exotic Liquid

Charlotte Cooper

49 Gilbert St.

Londona

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

## SQL INSERT INTO SELECT Examples

```javascript
INSERT INTO Customers (CustomerName, City, Country)SELECT SupplierName, City, Country FROM Suppliers;
```
```javascript
INSERT INTO CustomersSELECT * FROM Suppliers;
```
```javascript
INSERT INTO Customers (CustomerName, City, Country)SELECT SupplierName, City, Country FROM SuppliersWHERE Country='Germany';
```

* * *

* * *