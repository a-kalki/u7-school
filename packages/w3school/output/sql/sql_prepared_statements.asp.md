# SQL Prepared Statements

* * *

## SQL Prepared Statements - Prevent SQL Injection

SQL prepared statements can be used to protect a web site from SQL injections.

Prepared statements seperates the query structure (the SQL) from the actual data (user input).

Prepared statements basically work like this:

1.  **Prepare:** An SQL query template with placeholders is sent to the server. The data values are not sent. Example: INSERT INTO MyGuests VALUES(?, ?, ?). Then, the server parses, compiles, and optimizes the SQL query template, without executing it
2.  **Execute:** At a later time, the application binds the values to the parameters, and the database executes the query. The application may execute the query as many times as it wants with different values

Prepared statements have four main advantages:

*   **Reduced parsing time** - as the preparation on the query is done only once (although the statement is executed multiple times)
*   **Minimize bandwidth** - Bound parameters minimize bandwidth to the server as you need send only the parameters each time, and not the whole query
*   **Security** - Prepared statements are very useful against SQL injections, because parameter values, which are transmitted later using a different protocol, need not be correctly escaped. If the original statement template is not derived from external input, SQL injection cannot occur
*   **Cleaner code** - by seperating data from SQL commands

* * *

## Prepared Statements in MySQL

The following example is taken from [PHP MySQL Prepared Statements](https://www.w3schools.com/php/php_mysql_prepared_statements.asp), and uses prepared statements in MySQL:

```javascript
<?php$servername = "localhost";$username = "username";$password = "password";$dbname = "myDB";// Create connection$conn = new mysqli($servername, $username, $password, $dbname);// Check connectionif ($conn->connect_error) {  die("Connection failed: " . $conn->connect_error);}// SQL query template$sql = "INSERT INTO MyGuests (firstname, lastname, email) VALUES (?, ?, ?)";// Prepare the SQL query templateif($stmt = $conn->prepare($sql)) {  // Bind parameters  $stmt->bind_param("sss", $firstname, $lastname, $email);  // Set parameters and execute  $firstname = "John";  $lastname = "Doe";  $email = "john@example.com";  $stmt->execute();  $firstname = "Mary";  $lastname = "Moe";  $email = "mary@example.com";  $stmt->execute();  $firstname = "Julie";  $lastname = "Dooley";  $email = "julie@example.com";  $stmt->execute();  echo "New records created successfully";} else {  echo "Error: " . $sql . "<br>" . $conn->error;}$stmt->close();$conn->close();?>
```

### Code Explanation

In the SQL, the question marks (?) are placeholders for _firstname_, _lastname_, and _email_ values: 

```javascript
"INSERT INTO MyGuests (firstname, lastname, email) VALUES (?, ?, ?)"
```

Now, look at the `bind_param()` function. This function bind variables to the placeholders in the SQL query. The placeholders (?) will be replaced by the actual values held in the variables at the time of execution. The "sss" argument lists the **type** of data each parameter is. The **s** character tells mysql that the parameter is a string. We must define one of these for EACH parameter. By telling mysql what type of data to expect, we minimize the risk of SQL injections:

```javascript
$stmt->bind_param("sss", $firstname, $lastname, $email);
```

The type argument can be one of four types:

*   **i** - integer (whole number)
*   **d** - double (floating point number)
*   **s** - string (text)
*   **b** - binary (image, PDF, etc.)

**Note:** If we want to insert data from external sources (like user input), it is very important that the data is sanitized and validated.

* * *

* * *