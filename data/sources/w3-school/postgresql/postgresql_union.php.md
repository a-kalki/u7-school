# PostgreSQL UNION Operator

* * *

## UNION

The `UNION` operator is used to combine the result-set of two or more queries.

The queries in the union must follow these rules:

*   They must have the same number of columns
*   The columns must have the same data types
*   The columns must be in the same order

```javascript
SELECT product_id, product_nameFROM productsUNIONSELECT testproduct_id, product_nameFROM testproductsORDER BY product_id;
```

* * *

## UNION vs UNION ALL

With the `UNION` operator, if some rows in the two queries returns the exact same result, only one row will be listed, because `UNION` selects only distinct values.

Use `UNION ALL` to return duplicate values.

Let's make some changes to the queries, so that we have duplicate values in the result:

```javascript
SELECT product_idFROM productsUNIONSELECT testproduct_idFROM testproductsORDER BY product_id;
```
```javascript
SELECT product_idFROM productsUNION ALLSELECT testproduct_idFROM testproductsORDER BY product_id;
```

* * *

* * *

* * *