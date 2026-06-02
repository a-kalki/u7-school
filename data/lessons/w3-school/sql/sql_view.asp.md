# SQL Views

* * *

## SQL CREATE VIEW Statement

An SQL view is a virtual table based on the result-set of an SQL statement. An SQL view contains rows and columns, just like a real table. The fields in the view are fields from one or more real tables in the database.

You can add SQL statements and functions to a view and present the data as if it were coming from one single table.

A view is created with the `CREATE VIEW` statement.

### CREATE VIEW Syntax

```javascript
CREATE VIEW view_name ASSELECT column1, column2, ...FROM table_nameWHERE condition;
```

**Note:** A view always shows real-time data! The database engine only stores the view's definition (the SELECT statement), not a copy of the data.

* * *

## CREATE VIEW Examples

The following SQL creates a view named "Brazil Customers", that shows all customers from Brazil:

```javascript
CREATE VIEW [Brazil Customers] ASSELECT CustomerName, ContactNameFROM CustomersWHERE Country = 'Brazil';
```

To query the view above, use the following SQL syntax:

```javascript
SELECT * FROM [Brazil Customers];
```

The following SQL creates a view named "Products Above Average Price", that selects all products in the "Products" table with a Price higher than the average price:

```javascript
CREATE VIEW [Products Above Average Price] ASSELECT ProductName, PriceFROM ProductsWHERE Price > (SELECT AVG(Price) FROM Products);
```

To query the view above, use the following SQL syntax:

```javascript
SELECT * FROM [Products Above Average Price];
```

* * *

* * *

## ALTER VIEW Statement (SQL Server)

In SQL Server, a view can be updated with the `ALTER VIEW` statement.

### ALTER VIEW Syntax

```javascript
ALTER VIEW view_name ASSELECT column1, column2, ...FROM table_nameWHERE condition;
```

The following SQL adds the "City" column to the "Brazil Customers" view:

```javascript
ALTER VIEW [Brazil Customers] ASSELECT CustomerName, ContactName, CityFROM CustomersWHERE Country = 'Brazil';
```

* * *

## CREATE OR REPLACE VIEW Statement (MySQL and Oracle)

In MySQL and Oracle, a view can be updated with the `CREATE OR REPLACE VIEW` statement.

### CREATE OR REPLACE VIEW Syntax

```javascript
CREATE OR REPLACE VIEW view_name ASSELECT column1, column2, ...FROM table_nameWHERE condition;
```

The following SQL adds the "City" column to the "Brazil Customers" view:

```javascript
CREATE OR REPLACE VIEW [Brazil Customers] ASSELECT CustomerName, ContactName, CityFROM CustomersWHERE Country = 'Brazil';
```

* * *

## DROP VIEW Statement

A view is deleted with the `DROP VIEW` statement.

###  DROP VIEW Syntax

```javascript
DROP VIEW view_name;
```

The following SQL deletes the "Brazil Customers" view:

```javascript
DROP VIEW [Brazil Customers];
```

* * *

* * *