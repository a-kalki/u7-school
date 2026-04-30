# SQL UNIQUE Constraint

* * *

## SQL UNIQUE Constraint

The `UNIQUE` constraint ensures that all values in a column are unique.

Both the `UNIQUE` and `[PRIMARY KEY](sql_primarykey.asp.html)` constraints provide a guarantee for uniqueness for a column or set of columns. However, you can have many `UNIQUE` constraints per table, but only one `PRIMARY KEY` constraint per table.

* * *

## UNIQUE Constraint on CREATE TABLE

The following SQL defines a `UNIQUE` constraint for the "ID" column upon creation of the "Persons" table:

### SQL Server / Oracle / MS Access:

```javascript
CREATE TABLE Persons (    ID int NOT NULL UNIQUE,    LastName varchar(255) NOT NULL,    FirstName varchar(255),    Age int);
```

### MySQL:

```javascript
CREATE TABLE Persons (    ID int NOT NULL,    LastName varchar(255) NOT NULL,    FirstName varchar(255),    Age int,    UNIQUE (ID));
```

### Naming a Unique Constraint

To name a `UNIQUE` constraint, and to define a `UNIQUE` constraint on multiple columns, use the following SQL syntax:

```javascript
CREATE TABLE Persons (    ID int NOT NULL,    LastName varchar(255) NOT NULL,    FirstName varchar(255),    Age int,    CONSTRAINT UC_Person UNIQUE (ID,LastName));
```

* * *

* * *

## UNIQUE Constraint on ALTER TABLE

To create a `UNIQUE` constraint on the "ID" column when the table is already created, use the following SQL syntax:

```javascript
ALTER TABLE PersonsADD UNIQUE (ID);
```

### Naming a Unique Constraint

To name a `UNIQUE` constraint, and to define a `UNIQUE` constraint on multiple columns, use the following SQL syntax:

```javascript
ALTER TABLE PersonsADD CONSTRAINT UC_Person UNIQUE (ID,LastName);
```

* * *

## Drop a UNIQUE Constraint

To drop a `UNIQUE` constraint, use the following SQL:

### MySQL:

```javascript
ALTER TABLE PersonsDROP INDEX UC_Person;
```

### SQL Server / Oracle / MS Access:

```javascript
ALTER TABLE PersonsDROP CONSTRAINT UC_Person;
```

* * *

* * *