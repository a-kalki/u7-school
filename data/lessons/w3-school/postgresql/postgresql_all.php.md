# PostgreSQL ALL Operator

* * *

## ALL

The `ALL` operator:

*   returns a Boolean value as a result
*   returns TRUE if ALL of the sub query values meet the condition
*   is used with `SELECT`, `WHERE` and `HAVING` statements

`ALL` means that the condition will be true only if the operation is true for all values in the range.

```javascript
SELECT product_nameFROM productsWHERE product_id = ALL (  SELECT product_id  FROM order_details  WHERE quantity > 10);
```

* * *

* * *

* * *