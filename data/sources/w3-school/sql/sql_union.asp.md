# SQL UNION Operator

* * *

## The SQL UNION Operator

The `UNION` operator is used to combine the result-set of two or more `SELECT` statements.

The `UNION` operator automatically **removes duplicate rows** from the result set.

Requirements for `UNION`:

*   Every `SELECT` statement within `UNION` must have the same number of columns
*   The columns must also have similar data types
*   The columns in every `SELECT` statement must also be in the same order

### UNION Syntax

```javascript
SELECT column_name(s) FROM table1UNIONSELECT column_name(s) FROM table2;
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

## SQL UNION Example

The following SQL returns the unique (distinct) countries from both the "Customers" and the "Suppliers" table:

```javascript
SELECT Country FROM CustomersUNIONSELECT Country FROM SuppliersORDER BY Country;
```

**Note:** If some customers or suppliers have the same country, each country will only be listed once, because `UNION` selects only distinct values. Use `[UNION ALL](sql_union_all.asp.html)` to also select duplicate values!

* * *

## SQL UNION With WHERE

Here we add a `WHERE` clause to only return the unique German cities from both the "Customers" and the "Suppliers" table:

```javascript
SELECT City, Country FROM CustomersWHERE Country='Germany'UNIONSELECT City, Country FROM SuppliersWHERE Country='Germany'ORDER BY City;
```

* * *

## Another UNION Example

The following SQL lists all customers and suppliers:

```javascript
SELECT 'Customer' AS Type, ContactName, City, CountryFROM CustomersUNIONSELECT 'Supplier', ContactName, City, CountryFROM Suppliers;
```

Notice the "AS Type" above - it is an alias. [Aliases](sql_alias.asp.html) are used to give a column a temporary name. So, here we have created a temporary column named "Type", that list whether the contact person is a "Customer" or a "Supplier".

* * *