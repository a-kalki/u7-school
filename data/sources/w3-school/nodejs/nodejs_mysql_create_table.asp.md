# Node.js MySQL Create Table

* * *

## Creating a Table

To create a table in MySQL, use the "CREATE TABLE" statement.

Make sure you define the name of the database when you create the connection:

```javascript
let mysql = require('mysql');let con = mysql.createConnection({  host: "localhost",  user: "yourusername",  password: "yourpassword",  database: "mydb"});con.connect(function(err) {  if (err) throw err;  console.log("Connected!");  let sql = "CREATE TABLE customers (name VARCHAR(255), address VARCHAR(255))";  con.query(sql, function (err, result) {    if (err) throw err;    console.log("Table created");  });});
```

Save the code above in a file called "demo\_create\_table.js" and run the file:

```javascript
C:\Users\Your Name>node demo_create_table.js
```

Which will give you this result:

```javascript
Connected!Table created
```

* * *

* * *

## Primary Key

When creating a table, you should also create a column with a unique key for each record.

This can be done by defining a column as "INT AUTO\_INCREMENT PRIMARY KEY" which will insert a unique number for each record. Starting at 1, and increased by one for each record.

```javascript
let mysql = require('mysql');let con = mysql.createConnection({  host: "localhost",  user: "yourusername",  password: "yourpassword",  database: "mydb"});con.connect(function(err) {  if (err) throw err;  console.log("Connected!");  let sql = "CREATE TABLE customers (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), address VARCHAR(255))";  con.query(sql, function (err, result) {    if (err) throw err;    console.log("Table created");  });});
```

If the table already exists, use the ALTER TABLE keyword:

```javascript
let mysql = require('mysql');let con = mysql.createConnection({  host: "localhost",  user: "yourusername",  password: "yourpassword",  database: "mydb"});con.connect(function(err) {  if (err) throw err;  console.log("Connected!");  let sql = "ALTER TABLE customers ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY";  con.query(sql, function (err, result) {    if (err) throw err;    console.log("Table altered");  });});
```

* * *

* * *