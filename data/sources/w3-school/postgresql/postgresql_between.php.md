# PostgreSQL BETWEEN Operator

* * *

## BETWEEN

The `BETWEEN` operator selects values within a given range. The values can be numbers, text, or dates.

The `BETWEEN` operator is inclusive: begin and end values are included.

```javascript
SELECT * FROM ProductsWHERE Price BETWEEN 10 AND 15;
```

* * *

## BETWEEN Text Values

The `BETWEEN` operator can also be used on text values.

The result returns all records that are _alphabetically_ between the specified values.

```javascript
SELECT * FROM ProductsWHERE product_name BETWEEN 'Pavlova' AND 'Tofu';
```

If we add an `ORDER BY` clause to the example above, it will be a bit easier to read:

```javascript
SELECT * FROM ProductsWHERE product_name BETWEEN 'Pavlova' AND 'Tofu'ORDER BY product_name;
```

* * *

* * *

## BETWEEN Date Values

The `BETWEEN` operator can also be used on date values.

```javascript
SELECT * FROM ordersWHERE order_date BETWEEN '2023-04-12' AND '2023-05-05';
```

* * *

* * *