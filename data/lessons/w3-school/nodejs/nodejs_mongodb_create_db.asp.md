# Node.js MongoDB Create Database

* * *

## Creating a Database

To create a database in MongoDB, start by creating a MongoClient object, then specify a connection URL with the correct ip address and the name of the database you want to create.

MongoDB will create the database if it does not exist, and make a connection to it.

```javascript
let MongoClient = require('mongodb').MongoClient;let url = "mongodb://localhost:27017/mydb";MongoClient.connect(url, function(err, db) {  if (err) throw err;  console.log("Database created!");  db.close();});
```

Save the code above in a file called "demo\_create\_mongo\_db.js" and run the file:

```javascript
C:\Users\Your Name>node demo_create_mongo_db.js
```

Which will give you this result:

```javascript
Database created!
```

**Important:** In MongoDB, a database is not created until it gets content!

MongoDB waits until you have created a collection (table), with at least one document (record) before it actually creates the database (and collection).

* * *

* * *

* * *