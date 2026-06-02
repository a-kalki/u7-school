# SQL DEFAULT Constraint

* * *

## SQL DEFAULT Constraint

The `DEFAULT` constraint is used to automatically insert a default value for a column, if no value is specified.

The default value will be added to all new records (if no other value is specified).

* * *

## DEFAULT Constraint on CREATE TABLE

The following SQL sets a `DEFAULT` value for the "City" column upon creation of the "Persons" table:

```javascript
CREATE TABLE Persons (    ID int PRIMARY KEY,    LastName varchar(255) NOT NULL,    FirstName varchar(255),    Age int,    City varchar(255) DEFAULT 'Sandnes');
```

The `DEFAULT` constraint can also be used to insert system values, by using functions like `[CURRENT_DATE()](func_mysql_current_date.asp.html)` to insert the current date:

### MySQL:

```javascript
CREATE TABLE Orders (    ID int PRIMARY KEY,    OrderNumber int NOT NULL,    OrderDate date DEFAULT CURRENT_DATE());
```

### SQL Server:

To achieve the same result in SQL Server use the following SQL (to insert the current date): 

```javascript
CREATE TABLE Orders (    ID int PRIMARY KEY,    OrderNumber int NOT NULL,    OrderDate date DEFAULT CAST(GETDATE() AS date));
```

* * *

* * *

## DEFAULT Constraint on ALTER TABLE

To define a `DEFAULT` constraint on the "City" column when the table is already created, use the following SQL:

### MySQL:

```javascript
ALTER TABLE PersonsALTER City SET DEFAULT 'Sandnes';
```

### SQL Server:

```javascript
ALTER TABLE PersonsADD CONSTRAINT df_City DEFAULT 'Sandnes' FOR City;
```

### MS Access:

```javascript
ALTER TABLE PersonsALTER COLUMN City SET DEFAULT 'Sandnes';
```

### Oracle:

```javascript
ALTER TABLE PersonsMODIFY City DEFAULT 'Sandnes';
```

* * *

## Drop a DEFAULT Constraint

To drop a `DEFAULT` constraint, use the following SQL:

### MySQL:

```javascript
ALTER TABLE PersonsALTER City DROP DEFAULT;
```

### SQL Server:

```javascript
ALTER TABLE PersonsDROP CONSTRAINT df_City;
```

### MS Access:

```javascript
ALTER TABLE PersonsALTER COLUMN City DROP DEFAULT;
```

### Oracle:

```javascript
ALTER TABLE PersonsMODIFY (City DEFAULT NULL);
```

* * *

* * *