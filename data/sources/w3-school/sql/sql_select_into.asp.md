# SQL SELECT INTO Statement

* * *

## The SQL SELECT INTO Statement

The `SELECT INTO` statement is used to create a new table and fill it with data from an existing table.

The `SELECT INTO` statement is useful for creating backups or for creating a temporary table for analysis.

**Note:** The new table will be created with the same column names and data types as defined in the source table. However, primary keys, indexes, or NOT NULL constraints are not automatically transferred.

### SELECT INTO Syntax

Copy entire table into a new table:

```javascript
SELECT * INTO newtable [IN external_db]FROM sourcetableWHERE condition;
```

Copy only some columns into a new table:

```javascript
SELECT column1, column2, column3, ...INTO newtable [IN external_db]FROM sourcetableWHERE condition;
```

* * *

## SQL SELECT INTO Examples

The following SQL creates a backup copy of the "Customers" table:

```javascript
SELECT * INTO CustomersBackup2026FROM Customers;
```

The following SQL creates a backup copy of the "Customers" table in another database ('Backup.mdb'):

```javascript
SELECT * INTO CustomersBackup2026 IN 'Backup.mdb'FROM Customers;
```

The following SQL copies only a few columns from the "Customers" table into a new table:

```javascript
SELECT CustomerName, ContactName INTO Customers2FROM Customers;
```

The following SQL copies only the customers from USA in the "Customers" table, into a new table:

```javascript
SELECT * INTO US_CustomersFROM CustomersWHERE Country = 'USA';
```

The following SQL copies data from more than one table into a new table:

```javascript
SELECT Customers.CustomerName, Orders.OrderID INTO CustomersOrderFROM CustomersLEFT JOIN Orders ON Customers.CustomerID = Orders.CustomerID;
```

**Tip:** `SELECT INTO` can also be used to create a new, empty table using the schema of another. Just add a `WHERE` clause that causes the query to return no data:

```javascript
SELECT * INTO newtableFROM sourcetableWHERE 1 = 0;
```

* * *

* * *

* * *