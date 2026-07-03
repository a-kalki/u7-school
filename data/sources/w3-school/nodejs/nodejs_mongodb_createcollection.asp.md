# Node.js MongoDB Create Collection

* * *

A **collection** in MongoDB is the same as a **table** in MySQL

## Creating a Collection

To create a collection in MongoDB, use the `createCollection()` method:

```javascript
let MongoClient = require('mongodb').MongoClient;let url = "mongodb://localhost:27017/";MongoClient.connect(url, function(err, db) {  if (err) throw err;  let dbo = db.db("mydb");  dbo.createCollection("customers", function(err, res) {    if (err) throw err;    console.log("Collection created!");    db.close();  });});
```

Save the code above in a file called "demo\_mongodb\_createcollection.js" and run the file:

```javascript
C:\Users\Your Name>node demo_mongodb_createcollection.js
```

Which will give you this result:

```javascript
Collection created!
```

**Important:** In MongoDB, a collection is not created until it gets content!

MongoDB waits until you have inserted a document before it actually creates the collection.

* * *

* * *

* * *