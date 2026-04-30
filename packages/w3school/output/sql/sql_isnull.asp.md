# SQL NULL Functions

* * *

## SQL COALESCE(), IFNULL(), ISNULL(), and NVL() Functions

Operations involving NULL values can sometimes lead to unexpected results.

SQL has some built-in functions to handle NULL values, and the most common functions are:

*   `COALESCE()` - The preferred standard. (Works in MySQL, SQL Server and Oracle)
*   `IFNULL()` - (MySQL)
*   `ISNULL()` - (SQL Server)
*   `NVL()` - (Oracle)
*   `IsNull()` - (MS Access)

**Note:** A `NULL` value represents an unknown or missing data in a database field. It is not a value itself, but a placeholder to indicate the absence of data.

* * *

## Demo Database

Assume we have the following "Products" table:

PId

ProductName

Price

InStock

InOrder

1

Jarlsberg

10.45

16

15

2

Mascarpone

32.56

23

_null_

3

Gorgonzola

15.67

9

20

The "InOrder" column is optional, and may contain NULL values.

Now look at the following SQL statement:

```javascript
SELECT ProductName, Price * (InStock + InOrder)FROM Products;
```

**Note: In the SQL above, if any of the "InOrder" values are NULL, the result will be NULL!**

* * *

* * *

## The COALESCE() Function

The `COALESCE()` function is the preferred standard for handling potential NULL values.

The `COALESCE()` function returns the first non-NULL value in a list of values.

The `COALESCE()` function works in [MySQL](func_mysql_coalesce.asp.html), [SQL Server](func_sqlserver_coalesce.asp.html), and Oracle (not in MS Access).

### Syntax

COALESCE(_val1_, _val2_, _...._, _val\_n_)

Here we use the `COALESCE()` function to replace NULL values with 0:

```javascript
SELECT ProductName, Price * (InStock + COALESCE(InOrder, 0))FROM Products;
```

* * *

## The IFNULL() Function (MySQL)

The MySQL `[IFNULL()](func_mysql_ifnull.asp.html)` function replaces NULL with a specified value.

### Syntax

IFNULL(_expr_, _alt_)

Here we replace NULL values with 0:

```javascript
SELECT ProductName, Price * (InStock + IFNULL(InOrder, 0))FROM Products;
```

* * *

## The ISNULL() Function (SQL Server)

The SQL Server `[ISNULL()](func_sqlserver_isnull.asp.html)` function replaces NULL with a specified value.

### Syntax

ISNULL(_expr_, _alt_)

Here we replace NULL values with 0:

```javascript
SELECT ProductName, Price * (InStock + ISNULL(InOrder, 0))FROM Products;
```

* * *

## The NVL() Function (Oracle)

The Oracle `NVL()` function replaces NULL with a specified value.

### Syntax

NVL(_expr_, _alt_)

Here we replace NULL values with 0:

```javascript
SELECT ProductName, Price * (InStock + NVL(InOrder, 0))FROM Products;
```

* * *

## The IsNull() Function (MS Access)

The MS Access `[IsNull()](func_msaccess_isnull.asp.html)` function returns TRUE if the expression is NULL, otherwise FALSE.

### Syntax

IsNull(_expr_)

The MS Access `IIf()` function returns one of two parts, depending on the evaluation of the expression.

### Syntax

IIf(_expr, truepart, falsepart_)

*   _expr_ - Required. The expression to evaluate
*   _truepart_ - Value to return if _expr_ is True
*   _falsepart_ - Value to return if _expr_ is False

Here we replace NULL values with 0:

```javascript
SELECT ProductName, Price * (InStock + IIf(IsNull(InOrder), 0, InOrder))FROM Products;
```

* * *

* * *