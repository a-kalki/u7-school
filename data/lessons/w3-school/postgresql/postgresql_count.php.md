# PostgreSQL COUNT Function

* * *

## COUNT

The `COUNT()` function returns the number of rows that matches a specified criterion.

If the specified criterion is a column name, the `COUNT()` function returns the number of rows with that name.

```javascript
SELECT COUNT(customer_id)FROM customers;
```

**Note:** NULL values are not counted.

By specifying a `WHERE` clause, you can e.g. return the number of customers that comes from London:

```javascript
SELECT COUNT(customer_id)FROM customersWHERE city = 'London';
```

* * *

* * *

* * *