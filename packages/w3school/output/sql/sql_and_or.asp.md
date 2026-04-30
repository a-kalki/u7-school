# SQL AND Operator

* * *

## The SQL AND Operator

The `WHERE` clause can contain one or many `AND` operators.

The `AND` operator is used to filter records based on more than one condition.

**Note:** The `AND` operator displays a record if **all** the conditions are TRUE.

The following SQL selects all customers from Spain that starts with the letter 'G':

```javascript
SELECT *FROM CustomersWHERE Country = 'Spain' AND CustomerName LIKE 'G%';
```

* * *

## AND Syntax

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

## All Conditions Must Be True

The following SQL selects all customers where Country is "Brazil" AND City is "Rio de Janeiro" AND CustomerID is higher than 50:

```javascript
SELECT * FROM CustomersWHERE Country = 'Brazil'AND City = 'Rio de Janeiro'AND CustomerID > 50;
```

* * *

## AND vs. OR

The `AND` operator displays a record if **all** the conditions are TRUE.

The `OR` operator displays a record if **any** of the conditions are TRUE.

* * *

## Combining AND and OR

You can also combine `AND` and `OR` operators.

The following SQL selects all customers from Spain that starts with a "G" or an "R" (make sure to use parenthesis to get the correct result):

```javascript
SELECT * FROM CustomersWHERE Country = 'Spain' AND (CustomerName LIKE 'G%' OR CustomerName LIKE 'R%');
```

Without parenthesis, the SQL above will return all customers from Spain that starts with a "G", _plus_ all customers that starts with an "R", regardless of the country value:

```javascript
SELECT * FROM CustomersWHERE Country = 'Spain' AND CustomerName LIKE 'G%' OR CustomerName LIKE 'R%';
```

* * *

* * *

## Video: SQL AND Operator

  [![SQL Tutorial on YouTube](images/yt_logo_rgb_dark.png)

 ![SQL Tutorial on YouTube](images/img_sql_and.png)](https://youtu.be/r1V39Iia4j0&list=PLP9IO4UYNF0UQkBXlTMSw0CYsxv-GDkkI)

* * *