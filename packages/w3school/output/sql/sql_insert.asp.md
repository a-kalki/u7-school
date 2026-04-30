# SQL INSERT INTO Statement

* * *

## The SQL INSERT INTO Statement

The `INSERT INTO` statement is used to insert new records in a table.

It is possible to write the `INSERT INTO` statement in two ways:

### Syntax 1

Specify both the column names and the values to be inserted:

```javascript

```

### Syntax 2

If you insert values for ALL the columns of the table, you can omit the column names.

However, the order of the values must be in the same order as the columns in the table:

```javascript

```

* * *

## Demo Database

Below is a selection from the [**Customers**](https://www.w3schools.com/sql/trysql.asp?filename=trysql_customers) table used in the examples:

CustomerID

CustomerName

ContactName

Address

City

PostalCode

Country

89

White Clover Markets

Karl Jablonski

305 - 14th Ave. S. Suite 3B

Seattle

98128

USA

90  
  

Wilman Kala

Matti Karttunen

Keskuskatu 45

Helsinki

21240

Finland

91  
  

Wolski

Zbyszek

ul. Filtrowa 68

Walla

01-012

Poland

* * *

* * *

## INSERT INTO Example

Here we insert values for ALL the columns of the table, so we omit the column names.

The following SQL inserts a new record in the "Customers" table:

```javascript
INSERT INTO CustomersVALUES ('Cardinal', 'Tom B. Erichsen', 'Skagen 21', 'Stavanger', '4006', 'Norway');
```

The last record in the "Customers" table will now look like this:

CustomerID

CustomerName

ContactName

Address

City

PostalCode

Country

92

Cardinal

Tom B. Erichsen

Skagen 21

Stavanger

4006

Norway

**Notice that we did not insert any number into the CustomerID field!**

The CustomerID column is an [auto-increment](sql_autoincrement.asp.html) field and will be automatically generated when a new record is inserted.

* * *

## Insert Data Only in Specific Columns

Here we insert values only in some specific columns of the table.

The following SQL inserts a new record - but only inserts data in the "CustomerName", "City", and "Country" columns (CustomerID will be updated automatically):

```javascript
INSERT INTO Customers (CustomerName, City, Country)VALUES ('Cardinal', 'Stavanger', 'Norway');
```

The last record in the "Customers" table will now look like this:

CustomerID

CustomerName

ContactName

Address

City

PostalCode

Country

92

Cardinal

null

null

Stavanger

null

Norway

* * *

## Insert Multiple Rows

To insert multiple rows of data, we use the same `INSERT INTO` statement, but with multiple values:

The following SQL inserts three new records in the "Customers" table:

```javascript
INSERT INTO Customers (CustomerName, ContactName, Address, City, PostalCode, Country)VALUES('Cardinal', 'Tom B. Erichsen', 'Skagen 21', 'Stavanger', '4006', 'Norway'),('Greasy Burger', 'Per Olsen', 'Gateveien 15', 'Sandnes', '4306', 'Norway'),('Tasty Tee', 'Finn Egan', 'Streetroad 19B', 'Liverpool', 'L1 0AA', 'UK');
```

**Note:** Make sure you separate each set of values with a comma `,`.

The last three records in the "Customers" table will now look like this:

CustomerID

CustomerName

ContactName

Address

City

PostalCode

Country

92

Cardinal

Tom B. Erichsen

Skagen 21

Stavanger

4006

Norway

93

Greasy Burger

Per Olsen

Gateveien 15

Sandnes

4306

Norway

94

Tasty Tee

Finn Egan

Streetroad 19B

Liverpool

L1 0AA

UK

* * *

* * *

## Video: SQL INSERT INTO

  [![SQL Tutorial on YouTube](images/yt_logo_rgb_dark.png)

 ![SQL Tutorial on YouTube](images/img_sql_insert_into.png)](https://youtu.be/Dndsh1dcx-U&list=PLP9IO4UYNF0UQkBXlTMSw0CYsxv-GDkkI)

* * *