# PostgreSQL GROUP BY Clause

* * *

## GROUP BY

The `GROUP BY` clause groups rows that have the same values into summary rows, like "find the number of customers in each country".

The `GROUP BY` clause is often used with aggregate functions like `COUNT()`, `MAX()`, `MIN()`, `SUM()`, `AVG()` to group the result-set by one or more columns.

```javascript
SELECT COUNT(customer_id), countryFROM customersGROUP BY country;
```

* * *

## GROUP BY With JOIN

The following SQL statement lists the number of orders made by each customer:

```javascript
SELECT customers.customer_name, COUNT(orders.order_id)FROM ordersLEFT JOIN customers ON orders.customer_id = customers.customer_idGROUP BY customer_name;
```

* * *

* * *

* * *