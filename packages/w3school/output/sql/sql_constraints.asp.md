# SQL Constraints

* * *

## SQL Constraints

SQL constraints are rules for data in a table.

Constraints are used to prevent insertion of invalid data in a table, and ensures the accuracy and reliability of the data in the table. If there is any violation between the constraint and the data action, the action is aborted.

Constraints can be specified in two ways:

*   When a table is created (through the `[CREATE TABLE](sql_create_table.asp.html)` statement)
*   After a table is created (through the `[ALTER TABLE](sql_alter.asp.html)` statement)

* * *

## SQL Constraint Types

The following constraints are commonly used in SQL:

*   `[NOT NULL](sql_notnull.asp.html)` - Ensures that a column cannot have a NULL value
*   `[UNIQUE](sql_unique.asp.html)` - Ensures that all values in a column are unique
*   `[PRIMARY KEY](sql_primarykey.asp.html)` - Uniquely identifies each row in a table (a combination of a `NOT NULL` and `UNIQUE`)
*   `[FOREIGN KEY](sql_foreignkey.asp.html)` - Establishes a link between data in two tables, and prevents action that will destroy the link between them
*   `[CHECK](sql_check.asp.html)` - Ensures that the values in a column satisfies a specific condition
*   `[DEFAULT](sql_default.asp.html)` - Sets a default value for a column if no value is specified
*   `[CREATE INDEX](sql_create_index.asp.html)` - Creates indexes on columns to retrieve data from the database faster

* * *

* * *

* * *