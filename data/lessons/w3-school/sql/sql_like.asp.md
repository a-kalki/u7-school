# SQL LIKE Operator

* * *

## The SQL LIKE Operator

The `LIKE` operator is used in a `WHERE` clause to search for a specified pattern within a column's text data.

There are two wildcards often used in conjunction with the `LIKE` operator:

*   A percent sign `%` - represents zero, one, or multiple characters
*   A underscore sign `_` - represents a single character

The following SQL selects all customers that starts with the letter "a":

```javascript
SELECT * FROM CustomersWHERE CustomerName LIKE 'a%';
```

* * *

## Syntax

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

## The % Wildcard

The `%` wildcard represents any number of characters, even zero characters.

```javascript
SELECT * FROM CustomersWHERE city LIKE '%on%';
```

* * *

## The \_ Wildcard

The `_` wildcard represents one single character.

It can be any character or number, but each `_` represents one, and only one, character.

```javascript
SELECT * FROM CustomersWHERE city LIKE 'l_nd__';
```

* * *

* * *

## Starts With

To return records that starts with a specific letter or phrase, add the `%` at the end of the letter or phrase.

```javascript
SELECT * FROM CustomersWHERE CustomerName LIKE 'La%';
```

**Tip:** You can also combine any number of conditions using `AND` or `OR` operators.

```javascript
SELECT * FROM CustomersWHERE CustomerName LIKE 'a%' OR CustomerName LIKE 'b%';
```

* * *

## Ends With

To return records that ends with a specific letter or phrase, add the `%` at the beginning of the letter or phrase.

```javascript
SELECT * FROM CustomersWHERE CustomerName LIKE '%a';
```

**Tip:** You can also combine "starts with" and "ends with":

```javascript
SELECT * FROM CustomersWHERE CustomerName LIKE 'b%s';
```

* * *

## Contains

To return records that contains a specific letter or phrase, add the `%` both before and after the letter or phrase.

```javascript
SELECT * FROM CustomersWHERE CustomerName LIKE '%or%';
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

## Without Wildcards

If no wildcard is specified, the phrase has to have an exact match to return a result.

```javascript
SELECT * FROM CustomersWHERE Country LIKE 'Spain';
```

* * *

* * *