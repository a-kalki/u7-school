# SQL FOREIGN KEY Constraint

* * *

## SQL FOREIGN KEY Constraint

The `FOREIGN KEY` constraint establishes a link between two tables, and prevents action that will destroy the link between them.

A `FOREIGN KEY` is a column in a table that refers to the `[PRIMARY KEY](sql_primarykey.asp.html)` in another table.

The table with the foreign key column is called the child table, and the table with the primary key column is called the referenced or parent table.

The `FOREIGN KEY` constraint prevents invalid data from being inserted into the foreign key column (in the child table), because the value has to exist in the parent table.

The `FOREIGN KEY` constraint also prevents you from deleting a record in the parent table, if related rows still exist in the child table. 

Assume we have two tables:

### Persons Table

PersonID

LastName

FirstName

Age

1

Hansen

Ola

30

2

Svendson

Tove

23

### Orders Table

OrderID

OrderNumber

PersonID

3

22456

2

4

24562

1

Here we see that the "PersonID" column in the "Orders" table points to the "PersonID" column in the "Persons" table.

The "PersonID" column in the "Persons" table is the `PRIMARY KEY` in the "Persons" table.

The "PersonID" column in the "Orders" table is the `FOREIGN KEY` in the "Orders" table.

* * *

* * *

## FOREIGN KEY on CREATE TABLE

The following SQL creates a `FOREIGN KEY` constraint on the "PersonID" column upon creation of the "Orders" table:

```javascript
CREATE TABLE Orders (    OrderID int PRIMARY KEY,    OrderNumber int NOT NULL,    PersonID int,    CONSTRAINT fk_Person    FOREIGN KEY (PersonID)    REFERENCES Persons(PersonID));
```

* * *

## FOREIGN KEY on ALTER TABLE

To create a `FOREIGN KEY` constraint on the "PersonID" column after the "Orders" table is created, use the following SQL:

```javascript
ALTER TABLE OrdersADD CONSTRAINT fk_PersonFOREIGN KEY (PersonID)REFERENCES Persons(PersonID);
```

* * *

## Drop a FOREIGN KEY Constraint

To drop a `FOREIGN KEY` constraint, use the following SQL:

### SQL Server / Oracle / MS Access:

```javascript
ALTER TABLE OrdersDROP CONSTRAINT fk_Person;
```

### MySQL:

```javascript
ALTER TABLE OrdersDROP FOREIGN KEY fk_Person;
```

* * *

* * *