# SQL Wildcards

* * *

## SQL Wildcard Characters

A wildcard character is used to substitute one or more characters in a string.

Wildcard characters are used with the `[LIKE](sql_like.asp.html)` operator. The `LIKE` operator is used in a `WHERE` clause to search for a specified pattern in a column.

```javascript
SELECT * FROM CustomersWHERE CustomerName LIKE 'a%';
```

* * *

## Wildcard Characters

Symbol

Description

%

Represents zero or more characters

\_

Represents a single character

\[\]

Represents any single character within the brackets \*

^

Represents any character not in the brackets \*

\-

Represents any single character within the specified range \*

{}

Represents any escaped character \*\*

\* Not supported in PostgreSQL and MySQL databases.

\*\* Supported only in Oracle databases.

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

## Using the % Wildcard

The `%` wildcard represents any number of characters, even zero characters.

```javascript
SELECT * FROM CustomersWHERE CustomerName LIKE '%es';
```
```javascript
SELECT * FROM CustomersWHERE CustomerName LIKE '%mer%';
```

* * *

## Using the \_ Wildcard

The `_` wildcard represents a single character.

It can be any character or number, but each `_` represents one, and only one, character.

```javascript
SELECT * FROM CustomersWHERE City LIKE '_ondon';
```
```javascript
SELECT * FROM CustomersWHERE City LIKE 'L___on';
```

* * *

## Using the \[\] Wildcard

The `[]` wildcard returns a result if _any_ of the characters inside gets a match.

```javascript
SELECT * FROM CustomersWHERE CustomerName LIKE '[bsp]%';
```

* * *

## Using the - Wildcard

The `-` wildcard allows you to specify a range of characters inside the `[]` wildcard.

```javascript
SELECT * FROM CustomersWHERE CustomerName LIKE '[a-f]%';
```

* * *

## Combine Wildcards

Any wildcard, like `%` and `_` , can be used in combination with other wildcards.

```javascript
SELECT * FROM CustomersWHERE CustomerName LIKE 'a__%';
```
```javascript
SELECT * FROM CustomersWHERE CustomerName LIKE '_r%';
```

* * *

## Without Wildcard

If no wildcard is specified, the phrase has to have an exact match to return a result.

```javascript
SELECT * FROM CustomersWHERE Country LIKE 'Spain';
```

* * *

## Microsoft Access Wildcards

The Microsoft Access Database has some other wildcards:

Symbol

Description

Example

\*

Represents zero or more characters

bl\* finds bl, black, blue, and blob

?

Represents a single character

h?t finds hot, hat, and hit

\[\]

Represents any single character within the brackets

h\[oa\]t finds hot and hat, but not hit

!

Represents any character not in the brackets

h\[!oa\]t finds hit, but not hot and hat

\-

Represents any single character within the specified range

c\[a-b\]t finds cat and cbt

#

Represents any single numeric character

2#5 finds 205, 215, 225, 235, 245, 255, 265, 275, 285, and 295

* * *

* * *