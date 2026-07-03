# SQL Parameters

* * *

## SQL Parameters - Prevent SQL Injection

SQL parameters (Parameterized Queries) can be used to protect a web site from SQL injections.

A parameterized query is a SQL statement that uses placeholders instead of directly adding the input values into the query text. The placeholders get replaced with the actual values when the query executes. This makes the queries more safe and more reusable.

Most databases support parameterized queries, but the syntax varies:

*   MySQL use ? for parameters
*   SQL Server uses @ for parameters
*   PostgreSQL uses $ for parameters

SQL parameters are added to an SQL query at execution time, in a controlled manner.

```javascript
userid = getRequestString("UserId");query = "SELECT * FROM Users WHERE UserId = @userid";db.Execute(query, userid);
```

Note that parameters in SQL Server are presented by a @ marker.

The SQL engine checks each parameter to ensure that it is correct for its column and are treated literally, and not as part of the SQL to be executed.

```javascript
cname = getRequestString("CustomerName");caddress = getRequestString("Address");ccity = getRequestString("City");query = "INSERT INTO Customers (CustomerName, Address, City) Values(@cname, @caddress, @ccity)";db.Execute(query, cname, caddress, ccity);
```

* * *

* * *

## Examples

The following examples shows how to build parameterized queries in some common web languages.

SELECT STATEMENT IN ASP.NET:

```javascript
userid = getRequestString("UserId");query = "SELECT * FROM Customers WHERE CustomerId = @userid";cmd = new SqlCommand(query);cmd.Parameters.AddWithValue("@userid", userid);cmd.ExecuteReader();
```

INSERT INTO STATEMENT IN ASP.NET:

```javascript
cname = getRequestString("CustomerName");caddress = getRequestString("Address");ccity = getRequestString("City");query = "INSERT INTO Customers (CustomerName, Address, City) Values(@cname, @caddress, @ccity)";cmd = new SqlCommand(query);cmd.Parameters.AddWithValue("@cname", cname);cmd.Parameters.AddWithValue("@caddress", caddress);cmd.Parameters.AddWithValue("@ccity", ccity);cmd.ExecuteNonQuery();
```

* * *

* * *