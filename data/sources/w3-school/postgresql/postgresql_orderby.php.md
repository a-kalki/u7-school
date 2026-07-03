# PostgreSQL ORDER BY

* * *

## Sort Data

The `ORDER BY` keyword is used to sort the result in ascending or descending order.

The `ORDER BY` keyword sorts the records in ascending order by default. To sort the records in descending order, use the `DESC` keyword.

```javascript
SELECT * FROM productsORDER BY price;
```

* * *

## DESC

The `ORDER BY` keyword sorts the records in ascending order by default. To sort the records in descending order, use the `DESC` keyword.

```javascript
SELECT * FROM productsORDER BY price DESC;
```

* * *

## Sort Alphabetically

For string values the `ORDER BY` keyword will order alphabetically:

```javascript
SELECT * FROM productsORDER BY product_name;
```

* * *

* * *

## Alphabetically DESC

To sort the table reverse alphabetically, use the `DESC` keyword:

```javascript
SELECT * FROM productsORDER BY product_name DESC;
```

* * *

* * *