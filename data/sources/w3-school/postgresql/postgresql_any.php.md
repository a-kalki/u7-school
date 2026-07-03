# PostgreSQL ANY Operator

* * *

## ANY

The `ANY` operator allows you to perform a comparison between a single column value and a range of other values.

The `ANY` operator:

*   returns a Boolean value as a result
*   returns TRUE if ANY of the sub query values meet the condition

`ANY` means that the condition will be true if the operation is true for any of the values in the range.

```javascript
SELECT product_nameFROM productsWHERE product_id = ANY (  SELECT product_id  FROM order_details  WHERE quantity > 120);
```

* * *

* * *

* * *