# Node.js MySQL Limit

* * *

## Limit the Result

You can limit the number of records returned from the query, by using the "LIMIT" statement:

```javascript
let mysql = require('mysql');let con = mysql.createConnection({  host: "localhost",  user: "yourusername",  password: "yourpassword",  database: "mydb"});con.connect(function(err) {  if (err) throw err;  let sql = "SELECT * FROM customers LIMIT 5";  con.query(sql, function (err, result) {    if (err) throw err;    console.log(result);  });});
```

Save the code above in a file called "demo\_db\_limit.js" and run the file:

```javascript
C:\Users\Your Name>node demo_db_limit.js
```

Which will give you this result:

```javascript
[  { id: 1, name: 'John', address: 'Highway 71'},  { id: 2, name: 'Peter', address: 'Lowstreet 4'},  { id: 3, name: 'Amy', address: 'Apple st 652'},  { id: 4, name: 'Hannah', address: 'Mountain 21'},  { id: 5, name: 'Michael', address: 'Valley 345'}]
```

* * *

* * *

## Start From Another Position

If you want to return five records, starting from the third record, you can use the "OFFSET" keyword:

```javascript
let mysql = require('mysql');let con = mysql.createConnection({  host: "localhost",  user: "yourusername",  password: "yourpassword",  database: "mydb"});con.connect(function(err) {  if (err) throw err;  let sql = "SELECT * FROM customers LIMIT 5 OFFSET 2";  con.query(sql, function (err, result) {    if (err) throw err;    console.log(result);  });});
```

**Note:** "OFFSET 2", means starting from the third position, not the second!

Save the code above in a file called "demo\_db\_offset.js" and run the file:

```javascript
C:\Users\Your Name>node demo_db_offset.js
```

Which will give you this result:

```javascript
[  { id: 3, name: 'Amy', address: 'Apple st 652'},  { id: 4, name: 'Hannah', address: 'Mountain 21'},  { id: 5, name: 'Michael', address: 'Valley 345'},  { id: 6, name: 'Sandy', address: 'Ocean blvd 2'},  { id: 7, name: 'Betty', address: 'Green Grass 1'}]
```

* * *

## Shorter Syntax

You can also write your SQL statement like this "LIMIT 2, 5" which returns the same as the offset example above:

```javascript
let mysql = require('mysql');let con = mysql.createConnection({  host: "localhost",  user: "yourusername",  password: "yourpassword",  database: "mydb"});con.connect(function(err) {  if (err) throw err;  let sql = "SELECT * FROM customers LIMIT 2, 5";  con.query(sql, function (err, result) {    if (err) throw err;    console.log(result);  });});
```

**Note:** The numbers are reversed: "LIMIT 2, 5" is the same as "LIMIT 5 OFFSET 2"

* * *

* * *