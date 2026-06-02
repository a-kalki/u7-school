# SQL DELETE Statement

* * *

## The SQL DELETE Statement

The `DELETE` statement is used to delete existing records in a table.

### DELETE Syntax

```javascript

```

**Note:** Be careful when deleting records in a table! Notice the `WHERE` clause in the `DELETE` statement. The `WHERE` clause specifies which record(s) should be deleted. If you omit the `WHERE` clause, all records in the table will be deleted!

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

## SQL DELETE Example

The following SQL deletes the customer "Alfreds Futterkiste" from the "Customers" table:

```javascript
DELETE FROM Customers WHERE CustomerName='Alfreds Futterkiste';
```

The selection from the "Customers" table will now look like this:

CustomerID

CustomerName

ContactName

Address

City

PostalCode

Country

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

## Delete All Records

It is possible to delete all records in a table, without deleting the table. This means that the table structure, attributes, and indexes will be intact.

### Syntax

```javascript

```

The following SQL deletes ALL records in the "Customers" table, without deleting the table:

```javascript
DELETE FROM Customers;
```

* * *

## Delete a Table

To delete the table completely, use the `DROP TABLE` statement:

### Syntax

```javascript

```

The following SQL drops the entire "Customers" table:

```javascript
DROP TABLE Customers;
```

* * *

* * *