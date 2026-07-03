# Node.js MySQL Update

* * *

## Update Table

You can update existing records in a table by using the "UPDATE" statement:

```javascript
let mysql = require('mysql');let con = mysql.createConnection({  host: "localhost",  user: "yourusername",  password: "yourpassword",  database: "mydb"});con.connect(function(err) {  if (err) throw err;  let sql = "UPDATE customers SET address = 'Canyon 123' WHERE address = 'Valley 345'";  con.query(sql, function (err, result) {    if (err) throw err;    console.log(result.affectedRows + " record(s) updated");  });});
```

**Notice the WHERE clause in the UPDATE syntax:** The WHERE clause specifies which record or records that should be updated. If you omit the WHERE clause, all records will be updated!

Save the code above in a file called "demo\_db\_update.js" and run the file:

```javascript
C:\Users\Your Name>node demo_db_update.js
```

Which will give you this result:

```javascript
1 record(s) updated
```

* * *

* * *

## The Result Object

When executing a query, a result object is returned.

The result object contains information about how the query affected the table.

The result object returned from the example above looks like this:

```javascript
{  fieldCount: 0,  affectedRows: 1,  insertId: 0,  serverStatus: 34,  warningCount: 0,  message: '(Rows matched: 1 Changed: 1 Warnings: 0',  protocol41: true,  changedRows: 1}
```

The values of the properties can be displayed like this:

```javascript
console.log(result.affectedRows)
```

Which will produce this result:

```javascript
1
```

* * *

* * *