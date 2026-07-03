# PostgreSQL HAVING Clause

* * *

## HAVING

The `HAVING` clause was added to SQL because the `WHERE` clause cannot be used with aggregate functions.

Aggregate functions are often used with `GROUP BY` clauses, and by adding `HAVING` we can write condition like we do with `WHERE` clauses.

```javascript
SELECT COUNT(customer_id), countryFROM customersGROUP BY countryHAVING COUNT(customer_id) > 5;
```

* * *

## More HAVING Examples

The following SQL statement lists only orders with a total price of 400$ or more:

```javascript
SELECT order_id, SUM(order_details.quantity * products.price)FROM order_detailsLEFT JOIN products on products.product_id = order_details.product_idGROUP BY order_idHAVING SUM(order_details.quantity * products.price) > 400.00;
```

Lists customers that have ordered for 1000$ or more:

```javascript
SELECT customers.customer_name,SUM(order_details.quantity * products.price)FROM order_detailsINNER JOIN products ON order_details.product_id = products.product_idINNER JOIN orders ON order_details.order_id = orders.order_idINNER JOIN customers ON orders.customer_id = customers.customer_idGROUP BY customers.customer_id, customers.customer_nameHAVING SUM(order_details.quantity * products.price) >= 1000;
```

* * *

* * *

* * *