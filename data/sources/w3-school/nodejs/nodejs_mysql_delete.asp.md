# Node.js MySQL Delete

* * *

## Delete Record

You can delete records from an existing table by using the "DELETE FROM" statement:

```javascript
let mysql = require('mysql');let con = mysql.createConnection({  host: "localhost",  user: "yourusername",  password: "yourpassword",  database: "mydb"});con.connect(function(err) {  if (err) throw err;  let sql = "DELETE FROM customers WHERE address = 'Mountain 21'";  con.query(sql, function (err, result) {    if (err) throw err;    console.log("Number of records deleted: " + result.affectedRows);  });});
```

**Notice the WHERE clause in the DELETE syntax:** The WHERE clause specifies which record or records that should be deleted. If you omit the WHERE clause, all records will be deleted!

Save the code above in a file called "demo\_db\_delete.js" and run the file:

```javascript
C:\Users\Your Name>node demo_db_delete.js
```

Which will give you this result:

```javascript
Number of records deleted: 1
```

* * *

* * *

## The Result Object

When executing a query, a result object is returned.

The result object contains information about how the query affected the table.

The result object returned from the example above looks like this:

```javascript
{  fieldCount: 0,  affectedRows: 1,  insertId: 0,  serverStatus: 34,  warningCount: 0,  message: '',  protocol41: true,  changedRows: 0}
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