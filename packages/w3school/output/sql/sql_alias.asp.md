# SQL Aliases

* * *

## SQL Aliases

An alias is created with the `AS` keyword, and is often used to make a column name more readable.

An alias only exists for the duration of that query.

* * *

## Alias for Columns

The following SQL creates two aliases, one for the CustomerID column and one for the CustomerName column:

```javascript
SELECT CustomerID AS ID, CustomerName AS CustomerFROM Customers;
```

* * *

## Syntax

Alias for column:

```javascript

```

Alias for table:

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

## Aliases with Spaces

If you want your alias to contain one or more spaces, like "My Great Products", surround the aliasname with square brackets or double quotes:

```javascript
SELECT ProductName AS [My Great Products]FROM Products;
```

OR:

```javascript
SELECT ProductName AS "My Great Products"FROM Products;
```

**Note:** Some database systems allows both \[\] and "", and some only allows one of them.

* * *

## Concatenate Columns

The following SQL creates an alias named "Address" that combine four columns (Address, PostalCode, City and Country):

```javascript
SELECT CustomerName, Address + ', ' + PostalCode + ' ' + City + ', ' + Country AS AddressFROM Customers;
```

**Note:** To get the SQL statement above to work in MySQL use the following:

```javascript
SELECT CustomerName, CONCAT(Address,', ',PostalCode,', ',City,', ',Country) AS AddressFROM Customers;
```

**Note:** To get the SQL statement above to work in Oracle use the following:

```javascript
SELECT CustomerName, (Address || ', ' || PostalCode || ' ' || City || ', ' || Country) AS AddressFROM Customers;
```

* * *

## Alias for Tables

The same rules applies when you want to use an alias for a table.

```javascript
SELECT * FROM Customers AS Persons;
```

It might seem useless to use aliases on tables, but when you are joining tables, it makes sense.

In the following example, c is the alias for customers and o is for orders, making the query shorter and easier to read:

```javascript
SELECT c.CustomerName, o.OrderIDFROM customers AS cJOIN orders AS o ON c.customerID = o.customerID;
```

You will learn more about [SQL Joins](sql_join.asp.html) in the next chapters.

Aliases are useful when:

*   There are more than one table involved in a query
*   Functions are used in the query
*   Column names are long or not very readable
*   Two or more columns are combined together

* * *

* * *