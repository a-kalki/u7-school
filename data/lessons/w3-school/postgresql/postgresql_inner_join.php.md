# PostgreSQL INNER JOIN

* * *

## INNER JOIN

The `INNER JOIN` keyword selects records that have matching values in both tables.

Let's look at an example using our dummy `testproducts` table:

```javascript
testproduct_id |      product_name      | category_id----------------+------------------------+-------------              1 | Johns Fruit Cake       |           3              2 | Marys Healthy Mix      |           9              3 | Peters Scary Stuff     |          10              4 | Jims Secret Recipe     |          11              5 | Elisabeths Best Apples |          12              6 | Janes Favorite Cheese  |           4              7 | Billys Home Made Pizza |          13              8 | Ellas Special Salmon   |           8              9 | Roberts Rich Spaghetti |           5            10 | Mias Popular Ice        |          14(10 rows)
```

We will try to join the `testproducts` table with the `categories` table:

```javascript
category_id | category_name  |                       description-------------+----------------+------------------------------------------------------------           1 | Beverages      | Soft drinks, coffees, teas, beers, and ales           2 | Condiments     | Sweet and savory sauces, relishes, spreads, and seasonings           3 | Confections    | Desserts, candies, and sweet breads           4 | Dairy Products | Cheeses           5 | Grains/Cereals | Breads, crackers, pasta, and cereal           6 | Meat/Poultry   | Prepared meats           7 | Produce        | Dried fruit and bean curd           8 | Seafood        | Seaweed and fish(8 rows)
```

Notice that many of the products in `testproducts` have a `category_id` that does not match any of the categories in the `categories` table.

By using `INNER JOIN` we will not get the records where there is not a match, we will only get the records that matches _both_ tables:

```javascript
SELECT testproduct_id, product_name, category_nameFROM testproductsINNER JOIN categories ON testproducts.category_id = categories.category_id;
```
```javascript
testproduct_id |      product_name      | category_name----------------+------------------------+----------------              1 | Johns Fruit Cake       | Confections              6 | Janes Favorite Cheese  | Dairy Products              8 | Ellas Special Salmon   | Seafood              9 | Roberts Rich Spaghetti | Grains/Cereals(4 rows)
```

**Note:** `JOIN` and `INNER JOIN` will give the same result.

`INNER` is the default join type for `JOIN`, so when you write `JOIN` the parser actually writes `INNER JOIN`.

* * *

* * *

* * *