# SQL CHECK Constraint

* * *

## SQL CHECK Constraint

The `CHECK` constraint is used to ensure that the values in a column satisfies a specific condition.

The `CHECK` constraint evaluates the data to TRUE or FALSE. If the data evaluates to TRUE, the operation is ok. If the data evaluates to FALSE, the entire INSERT or UPDATE operation is aborted, and an error is raised.

* * *

## CHECK Constraint on CREATE TABLE

The following SQL creates a `CHECK` constraint on the "Age" column upon creation of the "Persons" table.

Here, the `CHECK` constraint ensures that the "Age" column must have a value of 18, or above:

```javascript
CREATE TABLE Persons (    ID int PRIMARY KEY,    LastName varchar(255) NOT NULL,    FirstName varchar(255),    Age int CHECK (Age >= 18));
```

### Naming a CHECK Constraint

To name a `CHECK` constraint, and to define a `CHECK` constraint on multiple columns, use the following SQL syntax:

```javascript
CREATE TABLE Persons (    ID int PRIMARY KEY,    LastName varchar(255) NOT NULL,    FirstName varchar(255),    Age int,    City varchar(255),    CONSTRAINT chk_PersonAge CHECK (Age >= 18 AND City = 'Sandnes'));
```

* * *

* * *

## CHECK Constraint on ALTER TABLE

To create a `CHECK` constraint on the "Age" column when the table is already created, use the following SQL:

```javascript
ALTER TABLE PersonsADD CHECK (Age >= 18);
```

### Naming a CHECK Constraint

To name a `CHECK` constraint, and to define a `CHECK` constraint on multiple columns, use the following SQL syntax:

```javascript
ALTER TABLE PersonsADD CONSTRAINT chk_PersonAge CHECK (Age >= 18 AND City = 'Sandnes');
```

* * *

## Drop a CHECK Constraint

To drop a `CHECK` constraint, use the following SQL:

### SQL Server / Oracle / MS Access:

```javascript
ALTER TABLE PersonsDROP CONSTRAINT chk_PersonAge;
```

### MySQL:

```javascript
ALTER TABLE PersonsDROP CHECK chk_PersonAge;
```

* * *

* * *