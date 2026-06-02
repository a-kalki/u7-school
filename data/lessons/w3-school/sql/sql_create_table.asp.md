# SQL CREATE TABLE Statement

* * *

## The SQL CREATE TABLE Statement

The `CREATE TABLE` statement is used to create a new table in a database.

### Syntax

```javascript
CREATE TABLE table_name (  column1 datatype constraint,  column2 datatype constraint,  column3 datatype constraint,  ....);
```

The _table\_name_ parameter specifies the name of the new table.

The _column1_, _column2_, ... parameters specify the names of the columns within the table.

The _datatype_ parameter specifies the data type of each column (e.g. varchar, int, date, etc.).

The _constraint_ parameter is optional, and specifies rules for data integrity (e.g. primary key, not null, etc.).

**Tip:** Learn more about constraints in our [SQL Constraints](sql_constraints.asp.html) chapter.

**Tip:** For an overview of the available data types, go to our complete [Data Types Reference](sql_datatypes.asp.html).

* * *

## CREATE TABLE Example

The following example creates a table named "Persons" with five columns:

```javascript
CREATE TABLE Persons (  PersonID int PRIMARY KEY,  LastName varchar(255) NOT NULL,  FirstName varchar(255),  Address varchar(255),  City varchar(255));
```

### Example Explained:

*   **PersonID** - This column is of type integer (int). This is also the [PRIMARY KEY](sql_primarykey.asp.html) field, that uniquely identifies each row.
*   **LastName** - This column is a variable-length character string with a maximum length of 255 characters (varchar(255)). NOT NULL specifies that this column cannot be empty.
*   **FirstName, Address, City** - These columns are also variable-length character strings with a maximum length of 255 characters (varchar(255)). These columns allow NULL values by default.

The empty "Persons" table will now look like this:

PersonID

LastName

FirstName

Address

City

 

 

 

 

 

**Tip:** The empty "Persons" table can now be filled with data, with the SQL [INSERT INTO](sql_insert.asp.html) statement.

* * *

* * *

## Create New Table From Existing Table

The `CREATE TABLE` statement can also be used to create a new table that copies some/all data from an existing table.

If you create a new table from an existing table, the new table will be filled with the values from the existing table.

### Syntax

```javascript
CREATE TABLE new_table ASSELECT column1, column2,...FROM existing_tableWHERE ....;
```

The following SQL creates a new table called "GermanCustomers" (which is a copy of the "Customers" table): 

```javascript
CREATE TABLE GermanCustomers ASSELECT * FROM CustomersWHERE Country = 'Germany';
```

* * *

* * *