# PostgreSQL EXISTS Operator

* * *

## EXISTS

The `EXISTS` operator is used to test for the existence of any record in a sub query.

The `EXISTS` operator returns TRUE if the sub query returns one or more records.

```javascript
SELECT customers.customer_nameFROM customersWHERE EXISTS (  SELECT order_id  FROM orders  WHERE customer_id = customers.customer_id);
```

The result in example above showed that 89 customers had at least one order in the `orders` table.

* * *

## NOT EXISTS

To check which customers that do not have any orders, we can use the `NOT` operator together with the `EXISTS` operator :

```javascript
SELECT customers.customer_nameFROM customersWHERE NOT EXISTS (  SELECT order_id  FROM orders  WHERE customer_id = customers.customer_id);
```

* * *

* * *

* * *