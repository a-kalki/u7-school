# Node.js MongoDB Drop

* * *

## Drop Collection

You can delete a table, or collection as it is called in MongoDB, by using the `drop()` method.

The `drop()` method takes a callback function containing the error object and the result parameter which returns true if the collection was dropped successfully, otherwise it returns false.

```javascript
let MongoClient = require('mongodb').MongoClient;let url = "mongodb://localhost:27017/";MongoClient.connect(url, function(err, db) {  if (err) throw err;  let dbo = db.db("mydb");  dbo.collection("customers").drop(function(err, delOK) {    if (err) throw err;    if (delOK) console.log("Collection deleted");    db.close();  });});
```

Save the code above in a file called "demo\_drop.js" and run the file:

```javascript
C:\Users\Your Name>node demo_drop.js
```

Which will give you this result:

```javascript
Collection deleted
```

* * *

* * *

## db.dropCollection

You can also use the `dropCollection()` method to delete a table (collection).

The `dropCollection()` method takes two parameters: the name of the collection and a callback function.

```javascript
let MongoClient = require('mongodb').MongoClient;let url = "mongodb://localhost:27017/";MongoClient.connect(url, function(err, db) {  if (err) throw err;  let dbo = db.db("mydb");  dbo.dropCollection("customers", function(err, delOK) {    if (err) throw err;    if (delOK) console.log("Collection deleted");    db.close();  });});
```

Save the code above in a file called "demo\_dropcollection.js" and run the file:

```javascript
C:\Users\Your Name>node demo_dropcollection.js
```

Which will give you this result:

```javascript
Collection deleted
```

* * *

* * *