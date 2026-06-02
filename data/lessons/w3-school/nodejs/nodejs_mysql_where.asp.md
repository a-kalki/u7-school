# Node.js MySQL Where

* * *

## Select With a Filter

When selecting records from a table, you can filter the selection by using the "WHERE" statement:

```javascript
let mysql = require('mysql');let con = mysql.createConnection({  host: "localhost",  user: "yourusername",  password: "yourpassword",  database: "mydb"});con.connect(function(err) {  if (err) throw err;  con.query("SELECT * FROM customers WHERE address = 'Park Lane 38'", function (err, result) {    if (err) throw err;    console.log(result);  });});
```

Save the code above in a file called "demo\_db\_where.js" and run the file:

```javascript
C:\Users\Your Name>node demo_db_where.js
```

Which will give you this result:

```javascript
[  { id: 11, name: 'Ben', address: 'Park Lane 38'}]
```

* * *

* * *

## Wildcard Characters

You can also select the records that starts, includes, or ends with a given letter or phrase.

Use the '%' wildcard to represent zero, one or multiple characters:

```javascript
let mysql = require('mysql');let con = mysql.createConnection({  host: "localhost",  user: "yourusername",  password: "yourpassword",  database: "mydb"});con.connect(function(err) {  if (err) throw err;  con.query("SELECT * FROM customers WHERE address LIKE 'S%'", function (err, result) {    if (err) throw err;    console.log(result);  });});
```

Save the code above in a file called "demo\_db\_where\_s.js" and run the file:

```javascript
C:\Users\Your Name>node demo_db_where_s.js
```

Which will give you this result:

```javascript
[  { id: 8, name: 'Richard', address: 'Sky st 331'},  { id: 14, name: 'Viola', address: 'Sideway 1633'}]
```

* * *

## Escaping Query Values

When query values are variables provided by the user, you should escape the values.

This is to prevent SQL injections, which is a common web hacking technique to destroy or misuse your database.

The MySQL module has methods to escape query values:

```javascript
let adr = 'Mountain 21';let sql = 'SELECT * FROM customers WHERE address = ' + mysql.escape(adr);con.query(sql, function (err, result) {  if (err) throw err;  console.log(result);});
```

You can also use a `?` as a placeholder for the values you want to escape.

In this case, the variable is sent as the second parameter in the query() method:

```javascript
let adr = 'Mountain 21';let sql = 'SELECT * FROM customers WHERE address = ?';con.query(sql, [adr], function (err, result) {  if (err) throw err;  console.log(result);});
```

If you have multiple placeholders, the array contains multiple values, in that order:

```javascript
let name = 'Amy';let adr = 'Mountain 21';let sql = 'SELECT * FROM customers WHERE name = ? OR address = ?';con.query(sql, [name, adr], function (err, result) {  if (err) throw err;  console.log(result);});
```

* * *

* * *