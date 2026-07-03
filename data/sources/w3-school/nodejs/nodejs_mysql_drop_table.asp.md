# Node.js MySQL Drop Table

* * *

## Delete a Table

You can delete an existing table by using the "DROP TABLE" statement:

```javascript
let mysql = require('mysql');let con = mysql.createConnection({  host: "localhost",  user: "yourusername",  password: "yourpassword",  database: "mydb"});con.connect(function(err) {  if (err) throw err;  let sql = "DROP TABLE customers";  con.query(sql, function (err, result) {    if (err) throw err;    console.log("Table deleted");  });});
```

Save the code above in a file called "demo\_db\_drop\_table.js" and run the file:

```javascript
C:\Users\Your Name>node demo_db_drop_table.js
```

Which will give you this result:

```javascript
Table deleted
```

* * *

* * *

## Drop Only if Exist

If the the table you want to delete is already deleted, or for any other reason does not exist, you can use the IF EXISTS keyword to avoid getting an error.

```javascript
let mysql = require('mysql');let con = mysql.createConnection({  host: "localhost",  user: "yourusername",  password: "yourpassword",  database: "mydb"});con.connect(function(err) {  if (err) throw err;  let sql = "DROP TABLE IF EXISTS customers";  con.query(sql, function (err, result) {    if (err) throw err;    console.log(result);  });});
```

Save the code above in a file called "demo\_db\_drop\_table\_if.js" and run the file:

```javascript
C:\Users\Your Name>node demo_db_drop_table_if.js
```

If the table exist, the result object will look like this:

```javascript
{  fieldCount: 0,  affectedRows: 0,  insertId: 0,  serverstatus: 2,  warningCount: 0,  message: '',  protocol41: true,  changedRows: 0}
```

If the table does not exist, the result object will look like this:

```javascript
{  fieldCount: 0,  affectedRows: 0,  insertId: 0,  serverstatus: 2,  warningCount: 1,  message: '',  protocol41: true,  changedRows: 0}
```

As you can see the only differnce is that the warningCount property is set to 1 if the table does not exist.

* * *

* * *