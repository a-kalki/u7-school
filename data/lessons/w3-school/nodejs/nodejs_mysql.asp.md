# Node.js MySQL

* * *

Node.js can be used in database applications.

One of the most popular databases is MySQL.

* * *

## MySQL Database

To be able to experiment with the code examples, you should have MySQL installed on your computer.

You can download a free MySQL database at [https://www.mysql.com/downloads/](https://www.mysql.com/downloads/).

* * *

## Install MySQL Driver

Once you have MySQL up and running on your computer, you can access it by using Node.js.

To access a MySQL database with Node.js, you need a MySQL driver. This tutorial will use the "mysql" module, downloaded from NPM.

To download and install the "mysql" module, open the Command Terminal and execute the following:

```javascript
C:\Users\Your Name>npm install mysql
```

Now you have downloaded and installed a mysql database driver.

Node.js can use this module to manipulate the MySQL database:

```javascript
let mysql = require('mysql');
```

* * *

* * *

## Create Connection

Start by creating a connection to the database.

Use the username and password from your MySQL database.

```javascript
let mysql = require('mysql');let con = mysql.createConnection({  host: "localhost",  user: "yourusername",  password: "yourpassword"});con.connect(function(err) {  if (err) throw err;  console.log("Connected!");});
```

Save the code above in a file called "demo\_db\_connection.js" and run the file:

```javascript
C:\Users\Your Name>node demo_db_connection.js
```

Which will give you this result:

```javascript
Connected!
```

Now you can start querying the database using SQL statements.

* * *

## Query a Database

Use SQL statements to read from (or write to) a MySQL database. This is also called "to query" the database.

The connection object created in the example above, has a method for querying the database:

```javascript
con.connect(function(err) {  if (err) throw err;  console.log("Connected!");  con.query(sql, function (err, result) {    if (err) throw err;    console.log("Result: " + result);  });});
```

The query method takes an sql statements as a parameter and returns the result.

Learn how to read, write, delete, and update a database in the next chapters.

Read more about SQL statements in our [SQL Tutorial](https://www.w3schools.com/sql/default.asp).

* * *

* * *