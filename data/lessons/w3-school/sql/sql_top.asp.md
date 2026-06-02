# SQL SELECT TOP, LIMIT and FETCH FIRST

* * *

## The SQL SELECT TOP Clause

The `SELECT TOP` clause is used to limit the number of records to return.

The `SELECT TOP` clause is useful on large tables with thousands of records. Returning a large number of records can impact performance.

The following SQL selects only the first 3 records of the "Customers" table:

```javascript
SELECT TOP 3 * FROM Customers;
```

**Note:** Not all database systems support the `SELECT TOP` clause. MySQL supports the `LIMIT` clause to select a limited number of records, while Oracle uses `FETCH FIRST _n_ ROWS ONLY`.

### Syntax for SQL Server / MS Access

```javascript

```

### Syntax for MySQL

```javascript

```

### Syntax for Oracle 12+

```javascript

```

* * *

## Demo Database

Below is a selection from the [**Customers**](https://www.w3schools.com/sql/trysql.asp?filename=trysql_customers) table used in the examples:

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

* * *

## MySQL - The LIMIT Clause

The following SQL shows the equivalent example for MySQL:

```javascript
SELECT * FROM CustomersLIMIT 3;
```

* * *

## Oracle - The FETCH FIRST Clause

The following SQL shows the equivalent example for Oracle:

```javascript
SELECT * FROM CustomersFETCH FIRST 3 ROWS ONLY;
```

* * *

## SQL TOP PERCENT Example

Here we will use the `SELECT TOP` clause with the percent syntax.

The following SQL selects the first 50% of the records from the "Customers" table (for SQL Server/MS Access):

```javascript
SELECT TOP 50 PERCENT * FROM Customers;
```

The following SQL shows the equivalent example for Oracle:

```javascript
SELECT * FROM CustomersFETCH FIRST 50 PERCENT ROWS ONLY;
```

* * *

## SELECT TOP with WHERE

The following SQL selects the first three records from the "Customers" table, where Country is "Germany" (for SQL Server/MS Access):

```javascript
SELECT TOP 3 * FROM CustomersWHERE Country = 'Germany';
```

The following SQL shows the equivalent example for MySQL:

```javascript
SELECT * FROM CustomersWHERE Country = 'Germany'LIMIT 3;
```

The following SQL shows the equivalent example for Oracle:

```javascript
SELECT * FROM CustomersWHERE Country = 'Germany'FETCH FIRST 3 ROWS ONLY;
```

* * *

## SELECT TOP and ORDER BY

Add the `ORDER BY` keyword when you want to sort the result, and return the first 3 records of the sorted result.

For SQL Server and MS Access:

```javascript
SELECT TOP 3 * FROM CustomersORDER BY CustomerName DESC;
```

The following SQL shows the equivalent example for MySQL:

```javascript
SELECT * FROM CustomersORDER BY CustomerName DESCLIMIT 3;
```

The following SQL shows the equivalent example for Oracle:

```javascript
SELECT * FROM CustomersORDER BY CustomerName DESCFETCH FIRST 3 ROWS ONLY;
```

* * *

* * *