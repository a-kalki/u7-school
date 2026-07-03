# PostgreSQL LIMIT

* * *

## The LIMIT Clause

The `LIMIT` clause is used to limit the maximum number of records to return.

```javascript
SELECT * FROM customersLIMIT 20;
```

* * *

## The OFFSET Clause

The `OFFSET` clause is used to specify where to start selecting the records to return.

If you want to return 20 records, but start at number 40, you can use both `LIMIT` and `OFFSET`.

**Note:** The first record is number `0`, so when you specify `OFFSET 40` it means starting at record number 41.

```javascript
SELECT * FROM customersLIMIT 20 OFFSET 40;
```

* * *

* * *

* * *