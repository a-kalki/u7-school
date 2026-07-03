# SQL NOT Operator

* * *

## The NOT Operator

The `NOT` operator is used in the `WHERE` clause to return all records that DO NOT match the specified criteria. It reverses the result of a condition from true to false and vice-versa.

The following SQL selects all customers that are NOT from Spain:

```javascript
SELECT * FROM CustomersWHERE NOT Country = 'Spain';
```

In the example above, the `NOT` operator is used in combination with the `=` operator.

The `NOT` operator is also used in combination with other operators to exclude data, such as:

*   `NOT LIKE`
*   `NOT BETWEEN`
*   `NOT IN`
*   `IS NOT NULL`
*   `NOT EXISTS`

* * *

## NOT Syntax

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

## The NOT LIKE Operator

The `NOT LIKE` operator is used in the `WHERE` clause to exclude rows that match a specified character pattern.

There are two wildcards often used in conjunction with the `NOT LIKE` operator:

*   A percent sign `%` - represents zero, one, or multiple characters
*   A underscore sign `_` - represents a single character

The following SQL selects all customers that do NOT start with the letter "A":

```javascript
SELECT * FROM CustomersWHERE CustomerName NOT LIKE 'A%';
```

* * *

## The NOT BETWEEN Operator

The `NOT BETWEEN` operator is used in the `WHERE` clause to select rows where a value falls outside a specified inclusive range.

The `NOT BETWEEN` operator can be used with numeric, text, or date values.

The following SQL selects all customers with a CustomerID NOT between 10 and 60:

```javascript
SELECT * FROM CustomersWHERE CustomerID NOT BETWEEN 10 AND 60;
```

* * *

## The NOT IN Operator

The `NOT IN` operator is used in the `WHERE` clause to exclude rows that match any value in a specified list or a subquery result set.

The following SQL selects all customers with City NOT IN "Paris" or "London":

```javascript
SELECT * FROM CustomersWHERE City NOT IN ('Paris', 'London');
```

* * *

## NOT Greater Than

In SQL, the "NOT Greater Than" condition is most often expressed with the standard greater than or equal to (>=) operator.

The following SQL selects all customers with a CustomerID not greater than 50:

```javascript
SELECT * FROM CustomersWHERE NOT CustomerID > 50;
```

* * *

## NOT Less Than

In SQL, the "NOT Less Than" condition is most often expressed with the standard less than or equal to (<=) operator.

The following SQL selects all customers with a CustomerID not less than 50:

```javascript
SELECT * FROM CustomersWHERE NOT CustomerId < 50;
```

* * *

* * *

## Video: SQL NOT Operator

  [![SQL Tutorial on YouTube](images/yt_logo_rgb_dark.png)

 ![SQL Tutorial on YouTube](images/img_sql_not.png)](https://youtu.be/CJRl5kBWlgI&list=PLP9IO4UYNF0UQkBXlTMSw0CYsxv-GDkkI)

* * *