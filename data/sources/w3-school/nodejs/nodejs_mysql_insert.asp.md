# Node.js MySQL Insert Into

* * *

## Insert Into Table

To fill a table in MySQL, use the "INSERT INTO" statement.

```javascript
let mysql = require('mysql');let con = mysql.createConnection({  host: "localhost",  user: "yourusername",  password: "yourpassword",  database: "mydb"});con.connect(function(err) {  if (err) throw err;  console.log("Connected!");  let sql = "INSERT INTO customers (name, address) VALUES ('Company Inc', 'Highway 37')";  con.query(sql, function (err, result) {    if (err) throw err;    console.log("1 record inserted");  });});
```

Save the code above in a file called "demo\_db\_insert.js", and run the file:

```javascript
C:\Users\Your Name>node demo_db_insert.js
```

Which will give you this result:

```javascript
Connected!1 record inserted
```

* * *

* * *

## Insert Multiple Records

To insert more than one record, make an array containing the values, and insert a question mark in the sql, which will be replaced by the value array:  
`INSERT INTO customers (name, address) VALUES ?`

```javascript
let mysql = require('mysql');let con = mysql.createConnection({  host: "localhost",  user: "yourusername",  password: "yourpassword",  database: "mydb"});con.connect(function(err) {  if (err) throw err;  console.log("Connected!");  let sql = "INSERT INTO customers (name, address) VALUES ?";  let values = [    ['John', 'Highway 71'],    ['Peter', 'Lowstreet 4'],    ['Amy', 'Apple st 652'],    ['Hannah', 'Mountain 21'],    ['Michael', 'Valley 345'],    ['Sandy', 'Ocean blvd 2'],    ['Betty', 'Green Grass 1'],    ['Richard', 'Sky st 331'],    ['Susan', 'One way 98'],    ['Vicky', 'Yellow Garden 2'],    ['Ben', 'Park Lane 38'],    ['William', 'Central st 954'],    ['Chuck', 'Main Road 989'],    ['Viola', 'Sideway 1633']  ];  con.query(sql, [values], function (err, result) {    if (err) throw err;    console.log("Number of records inserted: " + result.affectedRows);  });});
```

Save the code above in a file called "demo\_db\_insert\_multple.js", and run the file:

```javascript
C:\Users\Your Name>node demo_db_insert_multiple.js
```

Which will give you this result:

```javascript
Connected!Number of records inserted: 14
```

* * *

## The Result Object

When executing a query, a result object is returned.

The result object contains information about how the query affected the table.

The result object returned from the example above looks like this:

```javascript
{  fieldCount: 0,  affectedRows: 14,  insertId: 0,  serverStatus: 2,  warningCount: 0,  message: '\'Records:14  Duplicated: 0  Warnings: 0',  protocol41: true,  changedRows: 0}
```

The values of the properties can be displayed like this:

```javascript
console.log(result.affectedRows)
```

Which will produce this result:

```javascript
14
```

* * *

## Get Inserted ID

For tables with an auto increment id field, you can get the id of the row you just inserted by asking the result object.

**Note:** To be able to get the inserted id, **only one row** can be inserted.

```javascript
let mysql = require('mysql');let con = mysql.createConnection({  host: "localhost",  user: "yourusername",  password: "yourpassword",  database: "mydb"});con.connect(function(err) {  if (err) throw err;  let sql = "INSERT INTO customers (name, address) VALUES ('Michelle', 'Blue Village 1')";  con.query(sql, function (err, result) {    if (err) throw err;    console.log("1 record inserted, ID: " + result.insertId);  });});
```

Save the code above in a file called "demo\_db\_insert\_id.js", and run the file:

```javascript
C:\Users\Your Name>node demo_db_insert_id.js
```

Which will give you something like this in return:

```javascript
1 record inserted, ID: 15
```

* * *

* * *