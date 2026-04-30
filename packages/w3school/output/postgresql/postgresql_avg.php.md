# PostgreSQL AVG Function

* * *

## AVG

The `AVG()` function returns the average value of a numeric column.

```javascript
SELECT AVG(price)FROM products;
```

**Note:** NULL values are ignored.

## With 2 Decimals

The above example returned the average price of all products, the result was `28.8663636363636364`.

We can use the `::NUMERIC` operator to round the average price to a number with 2 decimals:

```javascript
SELECT AVG(price)::NUMERIC(10,2)FROM products;
```

* * *

* * *

* * *