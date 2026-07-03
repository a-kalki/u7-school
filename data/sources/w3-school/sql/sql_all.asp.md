# SQL ALL Operator

* * *

## The SQL ALL Operator

The `ALL` operator is used to compare a value to every value returned by a subquery.

The `ALL` operator evaluates to TRUE if **every value** in the subquery result-set meet the condition.

The `ALL` operator is typically used with `WHERE` and `HAVING` statements.

### ALL Syntax

```javascript
SELECT column_name(s)FROM table_nameWHERE column_name operator ALL (subquery);
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

## SQL ALL Example

The following SQL returns the ProductName if ALL the records in the "OrderDetails" table has Quantity equal to 10. This will of course return FALSE because the Quantity column has many different values (not only the value of 10):

```javascript
SELECT ProductNameFROM ProductsWHERE ProductID = ALL (  SELECT ProductID  FROM OrderDetails  WHERE Quantity = 10);
```

* * *

* * *