# PostgreSQL AS

* * *

## Aliases

SQL aliases are used to give a table, or a column in a table, a temporary name.

Aliases are often used to make column names more readable.

An alias only exists for the duration of that query.

An alias is created with the `AS` keyword.

```javascript
SELECT customer_id AS idFROM customers;
```

* * *

## AS is Optional

Actually, you can skip the `AS` keyword and get the same result:

```javascript
SELECT customer_id idFROM customers;
```

* * *

## Concatenate Columns

The `AS` keyword is often used when two or more fields are concatenated into one.

To concatenate two fields use `||`.

```javascript
SELECT product_name || unit AS productFROM products;
```

**Note:** In the result of the example above we are missing a space between product\_name and unit. To add a space when concatenating, use `|| ' ' ||`.

```javascript
SELECT product_name || ' ' || unit AS productFROM products;
```

* * *

* * *

## Using Aliases With a Space Character

If you want your alias to contain one or more spaces, like "`My Great Products`", surround your alias with double quotes.

```javascript
SELECT product_name AS "My Great Products"FROM products;
```

* * *

* * *