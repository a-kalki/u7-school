# SQL AUTO INCREMENT Field

* * *

## SQL AUTO INCREMENT Field

An auto-increment field is a numeric column that automatically generates a unique number, when a new record is inserted into a table.

The auto-increment field is typically the `[PRIMARY KEY](sql_primarykey.asp.html)` field that we want to automatically be assigned a unique number, every time a new record is inserted.

* * *

## Syntax for MySQL

MySQL uses the `AUTO_INCREMENT` keyword to perform an auto-increment feature.

The following SQL defines the "Personid" column to be an auto-increment primary key field in the "Persons" table:

```javascript
CREATE TABLE Persons (    Personid int AUTO_INCREMENT PRIMARY KEY,    LastName varchar(255) NOT NULL,    FirstName varchar(255),    Age int);
```

The default starting value for `AUTO_INCREMENT` is 1, and it will increment by 1 for each new record.

To let `AUTO_INCREMENT` start with another value, use the following SQL statement:

```javascript
ALTER TABLE Persons AUTO_INCREMENT = 100;
```

When we insert a new record into the "Persons" table, we will NOT have to specify a value for the "Personid" column (a unique value will be added automatically):

```javascript
INSERT INTO Persons (FirstName, LastName)VALUES ('Lars', 'Monsen');
```

The SQL above inserts a new record into the "Persons" table, and the "Personid" column will automatically be assigned the next unique number.

* * *

## Syntax for SQL Server

The SQL Server uses the `IDENTITY` keyword to perform an auto-increment feature.

The following SQL defines the "Personid" column to be an auto-increment primary key field in the "Persons" table:

```javascript
CREATE TABLE Persons (    Personid int IDENTITY(1,1) PRIMARY KEY,    LastName varchar(255) NOT NULL,    FirstName varchar(255),    Age int);
```

In the example above, the starting value for `IDENTITY` is 1, and it will increment by 1 for each new record.

**Tip:** To specify that the "Personid" column should start at value 10 and increment by 5, change it to `IDENTITY(10,5)`.

When we insert a new record into the "Persons" table, we will NOT have to specify a value for the "Personid" column (a unique value will be added automatically):

```javascript
INSERT INTO Persons (FirstName, LastName)VALUES ('Lars', 'Monsen');
```

The SQL above inserts a new record into the "Persons" table, and the "Personid" column will automatically be assigned the next unique number.

* * *

* * *

## Syntax for MS Access

The MS Access uses the `AUTOINCREMENT` keyword to perform an auto-increment feature.

The following SQL statement defines the "Personid" column to be an auto-increment primary key field in the "Persons" table:

```javascript
CREATE TABLE Persons (    Personid AUTOINCREMENT PRIMARY KEY,    LastName varchar(255) NOT NULL,    FirstName varchar(255),    Age int);
```

The default starting value for `AUTOINCREMENT` is 1, and it will increment by 1 for each new record.

**Tip:** To specify that the "Personid" column should start at value 10 and increment by 5, change the autoincrement to `AUTOINCREMENT(10,5)`.

When we insert a new record into the "Persons" table, we will NOT have to specify a value for the "Personid" column (a unique value will be added automatically):

```javascript
INSERT INTO Persons (FirstName, LastName)VALUES ('Lars', 'Monsen');
```

The SQL above inserts a new record into the "Persons" table, and the "Personid" column will automatically be assigned the next unique number.

* * *

## Syntax for Oracle

In Oracle, you have to create an auto-increment field with the `SEQUENCE` object (this object generates a number sequence).

Here is the `CREATE SEQUENCE` syntax:

```javascript
CREATE SEQUENCE seq_personMINVALUE 1START WITH 1INCREMENT BY 1CACHE 10;
```

The code above creates a `SEQUENCE` object called seq\_person, that starts with 1 and will increment by 1. It will also cache up to 10 values for performance. The cache option specifies how many sequence values will be stored in memory for faster access.

When we insert a new record into the "Persons" table, we will have to use the nextval function (this function retrieves the next value from seq\_person sequence):

```javascript
INSERT INTO Persons (Personid, FirstName, LastName)VALUES (seq_person.nextval, 'Lars', 'Monsen');
```

The SQL above inserts a new record into the "Persons" table, and the "Personid" column would be assigned the next unique number from the seq\_person sequence.

* * *

* * *