# PostgreSQL RIGHT JOIN

* * *

## RIGHT JOIN

The `RIGHT JOIN` keyword selects ALL records from the "right" table, and the matching records from the "left" table. The result is 0 records from the left side if there is no match.

Let's look at an example using our dummy `testproducts` table:

```javascript
testproduct_id |      product_name      | category_id----------------+------------------------+-------------              1 | Johns Fruit Cake       |           3              2 | Marys Healthy Mix      |           9              3 | Peters Scary Stuff     |          10              4 | Jims Secret Recipe     |          11              5 | Elisabeths Best Apples |          12              6 | Janes Favorite Cheese  |           4              7 | Billys Home Made Pizza |          13              8 | Ellas Special Salmon   |           8              9 | Roberts Rich Spaghetti |           5             10 | Mias Popular Ice       |          14(10 rows)
```

We will try to join the `testproducts` table with the `categories` table:

```javascript
category_id | category_name  |                       description-------------+----------------+------------------------------------------------------------           1 | Beverages      | Soft drinks, coffees, teas, beers, and ales           2 | Condiments     | Sweet and savory sauces, relishes, spreads, and seasonings           3 | Confections    | Desserts, candies, and sweet breads           4 | Dairy Products | Cheeses           5 | Grains/Cereals | Breads, crackers, pasta, and cereal           6 | Meat/Poultry   | Prepared meats           7 | Produce        | Dried fruit and bean curd           8 | Seafood        | Seaweed and fish(8 rows)
```

**Note:** Many of the products in `testproducts` have a `category_id` that does not match any of the categories in the `categories` table.

By using `RIGHT JOIN` we will get all records from `categories`, even the ones with no match in the `testproducts` table:

```javascript
SELECT testproduct_id, product_name, category_nameFROM testproductsRIGHT JOIN categories ON testproducts.category_id = categories.category_id;
```
```javascript
testproduct_id |      product_name      | category_name----------------+------------------------+----------------              1 | Johns Fruit Cake       | Confections              6 | Janes Favorite Cheese  | Dairy Products              8 | Ellas Special Salmon   | Seafood              9 | Roberts Rich Spaghetti | Grains/Cereals                |                        | Condiments                |                        | Meat/Poultry                |                        | Beverages                |                        | Produce(8 rows)
```

**Note:** `RIGHT JOIN` and `RIGHT OUTER JOIN` will give the same result.

`OUTER` is the default join type for `RIGHT JOIN`, so when you write `RIGHT JOIN` the parser actually writes `RIGHT OUTER JOIN`.

* * *

* * *

* * *