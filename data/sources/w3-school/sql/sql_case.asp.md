# SQL CASE Expression

* * *

## The SQL CASE Expression

The `CASE` expression is used to define different results based on specified conditions in an SQL statement.

The `CASE` expression goes through the conditions and stops at the first match (like an if-then-else statement). So, once a condition is true, it will stop processing and return the result. If no conditions are true, it returns the value in the `ELSE` clause. If there is no `ELSE` clause and no conditions are true, it returns NULL.

## CASE Syntax

```javascript
CASE  WHEN condition1 THEN result1  WHEN condition2 THEN result2  WHEN conditionN THEN resultN  ELSE default_resultEND;
```

* * *

## SQL CASE Example

Here we use the `CASE` expression to categorize data (Price) and we create a new column (PriceCategory) that shows in which price category each product is:

```javascript
SELECT ProductName, Price,CASE  WHEN Price < 20 THEN 'Low Cost'  WHEN Price BETWEEN 20 AND 50 THEN 'Medium Cost'  ELSE 'High Cost'END AS PriceCategoryFROM Products;
```

* * *

* * *

* * *