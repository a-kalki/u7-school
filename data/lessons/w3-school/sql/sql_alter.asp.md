# SQL ALTER TABLE Statement

* * *

## SQL ALTER TABLE Statement

The `ALTER TABLE` statement is used to add, delete, or modify columns in an existing table.

The `ALTER TABLE` statement is also used to add and drop various constraints on an existing table.

Common `ALTER TABLE` operations are:

*   Add column - Adds a new column to a table
*   Drop column - Deletes a column in a table
*   Rename column - Renames a column
*   Modify column - Changes the data type, size, or constraints of a column
*   Add constraint - Adds a new constraint
*   Rename table - Renames a table

* * *

## ALTER TABLE - ADD Column

To add a column in a table, use the following syntax:

### Syntax

```javascript
ALTER TABLE table_nameADD column_name datatype;
```

The following SQL adds an "Email" column to the "Customers" table:

```javascript
ALTER TABLE CustomersADD Email varchar(255);
```

* * *

## ALTER TABLE - DROP COLUMN

To delete a column in a table, use the following syntax (notice that some database systems don't allow deleting a column):

### Syntax

```javascript
ALTER TABLE table_nameDROP COLUMN column_name;
```

The following SQL deletes the "Email" column from the "Customers" table:

```javascript
ALTER TABLE CustomersDROP COLUMN Email;
```

* * *

## ALTER TABLE - RENAME COLUMN

To rename a column in a table, use the following syntax:

### Syntax

```javascript
ALTER TABLE table_nameRENAME COLUMN old_name to new_name;
```

To rename a column in a table in SQL Server, use the following syntax:

### Syntax for SQL Server:

```javascript
EXEC sp_rename 'table_name.old_name', 'new_name', 'COLUMN';
```

* * *

## ALTER TABLE - MODIFY Datatype

To modify the data type, size or constraints of a column in a table, use the following syntax:

### Syntax for SQL Server / MS Access:

```javascript
ALTER TABLE table_nameALTER COLUMN column_name new_datatype constraint;
```

### Syntax for MySQL / Oracle:

```javascript
ALTER TABLE table_nameMODIFY column_name new_datatype constraint;
```

The following SQL modifies the size of the "Email" column to varchar(100), and we also add a `[NOT NULL](sql_notnull.asp.html)` constraint:

```javascript
ALTER TABLE CustomersMODIFY Email varchar(100) NOT NULL;
```

* * *

## ALTER TABLE - ADD CONSTRAINT

To add a constraint to an existing table, use the following syntax:

### Syntax

```javascript
ALTER TABLE table_nameADD CONSTRAINT constraint_name constraint_definition;
```

The following SQL adds a constraint named "CHK\_Age" that is a `[CHECK](sql_check.asp.html)` constraint that ensures that the "Age" column has a value of 18 and above:

```javascript
ALTER TABLE MembersADD CONSTRAINT CHK_Age CHECK (Age >= 18);
```

* * *

## ALTER TABLE - Rename table

To rename a table, use the following syntax:

### Syntax

```javascript
ALTER TABLE table_nameRENAME TO new_table_name;
```

The following SQL renames the "Customers" table to "Clients":

```javascript
ALTER TABLE CustomersRENAME TO Clients;
```

* * *

* * *

## SQL ALTER TABLE Example

Assume we have a "Persons" table, that looks like this:

ID

LastName

FirstName

Address

City

1

Hansen

Ola

Timoteivn 10

Sandnes

2

Svendson

Tove

Borgvn 23

Sandnes

3

Pettersen

Kari

Storgt 20

Stavanger

Now we want to add a column named "DateOfBirth" in the "Persons" table.

We use the following SQL statement:

```javascript
ALTER TABLE PersonsADD DateOfBirth date;
```

Notice that the new column, "DateOfBirth", is of type date and is going to hold a date. The data type specifies what type of data the column can hold. For a complete reference of all the data types available in MS Access, MySQL, and SQL Server, go to our complete [Data Types reference](sql_datatypes.asp.html).

The "Persons" table will now look like this:

ID

LastName

FirstName

Address

City

DateOfBirth

1

Hansen

Ola

Timoteivn 10

Sandnes

 

2

Svendson

Tove

Borgvn 23

Sandnes

 

3

Pettersen

Kari

Storgt 20

Stavanger

 

* * *

## Change Data Type Example

Now we want to change the data type of the column named "DateOfBirth" in the "Persons" table.

We use the following SQL statement:

```javascript
ALTER TABLE PersonsALTER COLUMN DateOfBirth year;
```

Notice that the "DateOfBirth" column is now of type year and is going to hold a year in a two- or four-digit format.

* * *

## DROP COLUMN Example

Next, we want to delete the column named "DateOfBirth" in the "Persons" table.

We use the following SQL statement:

```javascript
ALTER TABLE PersonsDROP COLUMN DateOfBirth;
```

The "Persons" table will now look like this:

ID

LastName

FirstName

Address

City

1

Hansen

Ola

Timoteivn 10

Sandnes

2

Svendson

Tove

Borgvn 23

Sandnes

3

Pettersen

Kari

Storgt 20

Stavanger

* * *

* * *