# SQL SELECT DISTINCT Statement

* * *

## The SQL SELECT DISTINCT Statement

The `SELECT DISTINCT` statement is used to return only distinct (unique) values.

In a table, a column may contain several duplicate values - and sometimes you want to list only the unique values.

```javascript
SELECT DISTINCT Country FROM Customers;
```

* * *

## SELECT DISTINCT Syntax

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

## SELECT Example Without DISTINCT

If you omit the `DISTINCT` keyword, the SQL statement returns the "Country" value from all the records of the "Customers" table:

```javascript
SELECT Country FROM Customers;
```

* * *

* * *

## Count Distinct Values

By using the `COUNT()` function with the `DISTINCT` keyword, we can count the number of unique countries.

```javascript
SELECT COUNT(DISTINCT Country) FROM Customers;
```

**Note:** The COUNT(DISTINCT _column\_name_) is not supported in Microsoft Access databases.

Here is a workaround for MS Access:

```javascript
SELECT Count(*) AS DistinctCountriesFROM (SELECT DISTINCT Country FROM Customers);
```

You will learn more about the `COUNT()` function later in this tutorial.

* * *

* * *

## Video: SQL SELECT DISTINCT Statement

  [![SQL Tutorial on YouTube](images/yt_logo_rgb_dark.png)

 ![SQL Tutorial on YouTube](images/img_sql_select_distinct.png)](https://youtu.be/yuYKEx6VDPE&list=PLP9IO4UYNF0UQkBXlTMSw0CYsxv-GDkkI)

* * *