# SQL ANY Operator

* * *

## The SQL ANY Operator

The `ANY` operator is used to compare a value to every value returned by a subquery.

The `ANY` operator evaluates to TRUE if **at least one value** in the subquery result-set meet the condition.

### ANY Syntax

```javascript
SELECT column_name(s)FROM table_nameWHERE column_name operator ANY (subquery);
```

**Note:** The _operator_ must be a standard comparison operator (=, <>, !=, >, >=, <, or <=).

* * *

## Demo Database

Below is a selection from the **"Products"** table in the Northwind sample database:

ProductID

ProductName

Price

1

Chais

18.00

2

Chang

19.00

3

Aniseed Syrup

10.00

4

Chef Anton's Cajun Seasoning

22.00

And a selection from the **"OrderDetails"** table:

OrderDetailID

ProductID

Quantity

1

11

12

2

42

10

3

72

5

4

14

9

* * *

* * *

## SQL ANY Examples

The following SQL returns the ProductName if it finds ANY records in the "OrderDetails" table that has Quantity equal to 10 (this will return TRUE because the Quantity column has some values of 10):

```javascript
SELECT ProductName FROM ProductsWHERE ProductID = ANY (  SELECT ProductID  FROM OrderDetails  WHERE Quantity = 10);
```

The following SQL returns the ProductName if it finds ANY records in the "OrderDetails" table that has Quantity larger than 99 (this will return TRUE because the Quantity column has some values larger than 99):

```javascript
SELECT ProductName FROM ProductsWHERE ProductID = ANY (  SELECT ProductID  FROM OrderDetails  WHERE Quantity > 99);
```

The following SQL returns the ProductName if it finds ANY records in the "OrderDetails" table that has Quantity larger than 1000 (this will return FALSE because the Quantity column has no values larger than 1000):

```javascript
SELECT ProductName FROM ProductsWHERE ProductID = ANY (  SELECT ProductID  FROM OrderDetails  WHERE Quantity > 1000);
```