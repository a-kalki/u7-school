# SQL CREATE INDEX Statement

* * *

## SQL CREATE INDEX Statement

The `CREATE INDEX` statement is used to create indexes on tables in databases, to speed up data retrieval.

The users cannot see the indexes, they are just used to speed up searches/queries.

**Note:** Updating tables with indexes are more time-consuming than tables without indexes (because the indexes must also be updated). So, only create indexes on columns that are frequently searched against.

* * *

## Types of Indexes: Non-unique and Unique

There are two types of indexes:

*   `CREATE INDEX` - Creates a non-unique index (duplicate values are allowed)
*   `CREATE UNIQUE INDEX` - Creates a unique index (duplicate values are not allowed)

### CREATE INDEX Syntax

```javascript
CREATE INDEX index_nameON table_name (column1, column2, ...);
```

### CREATE UNIQUE INDEX Syntax

```javascript
CREATE UNIQUE INDEX index_nameON table_name (column1, column2, ...);
```

**Note:** The syntax for creating indexes varies among different databases. Check the syntax for creating indexes in your database!

* * *

## CREATE INDEX Example

The following SQL creates a non-unique index named "idx\_lastname" on the "LastName" column in the "Persons" table:

```javascript
CREATE INDEX idx_lastnameON Persons (LastName);
```

If you want to create an index on a combination of columns, you can list the column names within the parentheses, separated by commas:

```javascript
CREATE INDEX idx_lname_fnameON Persons (LastName, FirstName);
```

* * *

* * *

## DROP INDEX Statement

The `DROP INDEX` statement is used to remove an index.

### SQL Server:

```javascript
DROP INDEX table_name.index_name;
```

### MySQL:

```javascript
ALTER TABLE table_nameDROP INDEX index_name;
```

### MS Access:

```javascript
DROP INDEX index_name ON table_name;
```

### DB2/Oracle:

```javascript
DROP INDEX index_name;
```

* * *

* * *