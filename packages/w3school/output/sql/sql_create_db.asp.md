# SQL CREATE DATABASE Statement

* * *

## The SQL CREATE DATABASE Statement

The `CREATE DATABASE` statement is used to create a new SQL database.

**Tip:** You need administrative privileges to create a new database.

### Syntax

```javascript
CREATE DATABASE database_name;
```

* * *

## CREATE DATABASE Example

The following SQL statement creates a database called "testDB":

```javascript
CREATE DATABASE testDB;
```

* * *

## Show Databases

Once a database is created, you can check it in the list of databases with the following SQL command:

### Syntax for SQL Server

```javascript
SELECT name FROM sys.databases;
```

### Syntax for MySQL

```javascript
SHOW DATABASES;
```

* * *

* * *

* * *