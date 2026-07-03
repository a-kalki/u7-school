# SQL IN Operator

* * *

## The SQL IN Operator

The `IN` operator is used in the `WHERE` clause to check if a specified column's value matches any value within a provided list.

The `IN` operator functions as a shorthand for multiple `OR` conditions, making queries shorter and more readable.

The following SQL uses the `IN` operator to select all customers from Germany, France, or UK:

```javascript
SELECT * FROM CustomersWHERE Country IN ('Germany', 'France', 'UK');
```

The following SQL uses multiple `OR` conditions to select all customers from Germany, France, or UK (same result, but longer code):

```javascript
SELECT * FROM CustomersWHERE Country = 'Germany' OR Country = 'France' OR Country = 'UK';
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

* * *

## The NOT IN Operator

By using the `NOT IN` operator, you return all records that are NOT any of the values in the list.

```javascript
SELECT * FROM CustomersWHERE Country NOT IN ('Germany', 'France', 'UK');
```

* * *

## IN (SELECT)

You can also use `IN` with a subquery in the `WHERE` clause.

With a subquery you can return all records from the main query that are present in the result of the subquery.

The following SQL returns all customers who also have an order in the "Orders" table:

```javascript
SELECT * FROM CustomersWHERE CustomerID IN (SELECT CustomerID FROM Orders);
```

* * *

## NOT IN (SELECT)

The result in the example above returned 74 records, that means that there are 17 customers that haven't placed any orders.

Let us check if that is correct, by using the `NOT IN` operator.

The following SQL returns all customers who do NOT have any orders in the "Orders" table:

```javascript
SELECT * FROM CustomersWHERE CustomerID NOT IN (SELECT CustomerID FROM Orders);
```

* * *

* * *