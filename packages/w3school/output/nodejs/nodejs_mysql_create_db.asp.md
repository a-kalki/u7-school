# Node.js MySQL Create Database

* * *

## Creating a Database

To create a database in MySQL, use the "CREATE DATABASE" statement:

```javascript
let mysql = require('mysql');let con = mysql.createConnection({  host: "localhost",  user: "yourusername",  password: "yourpassword"});con.connect(function(err) {  if (err) throw err;  console.log("Connected!");  con.query("CREATE DATABASE mydb", function (err, result) {    if (err) throw err;    console.log("Database created");  });});
```

Save the code above in a file called "demo\_create\_db.js" and run the file:

```javascript
C:\Users\Your Name>node demo_create_db.js
```

Which will give you this result:

```javascript
Connected!Database created
```

* * *

* * *

* * *