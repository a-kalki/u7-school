# Node.js MongoDB Delete

* * *

## Delete Document

To delete a record, or document as it is called in MongoDB, we use the `deleteOne()` method.

The first parameter of the `deleteOne()` method is a query object defining which document to delete.

**Note:** If the query finds more than one document, only the first occurrence is deleted.

```javascript
let MongoClient = require('mongodb').MongoClient;let url = "mongodb://localhost:27017/";MongoClient.connect(url, function(err, db) {  if (err) throw err;  let dbo = db.db("mydb");  let myquery = { address: 'Mountain 21' };  dbo.collection("customers").deleteOne(myquery, function(err, obj) {    if (err) throw err;    console.log("1 document deleted");    db.close();  });});
```

Save the code above in a file called "demo\_delete.js" and run the file:

```javascript
C:\Users\Your Name>node demo_delete.js
```

Which will give you this result:

```javascript
1 document deleted
```

* * *

* * *

## Delete Many

To delete more than one document, use the `deleteMany()` method.

The first parameter of the `deleteMany()` method is a query object defining which documents to delete.

```javascript
let MongoClient = require('mongodb').MongoClient;let url = "mongodb://localhost:27017/";MongoClient.connect(url, function(err, db) {  if (err) throw err;  let dbo = db.db("mydb");  let myquery = { address: /^O/ };  dbo.collection("customers").deleteMany(myquery, function(err, obj) {    if (err) throw err;    console.log(obj.result.n + " document(s) deleted");    db.close();  });});
```

Save the code above in a file called "demo\_delete\_many.js" and run the file:

```javascript
C:\Users\Your Name>node demo_delete_many.js
```

Which will give you this result:

```javascript
2 document(s) deleted
```

* * *

## The Result Object

The `deleteMany()` method returns an object which contains information about how the execution affected the database.

Most of the information is not important to understand, but one object inside the object is called "result" which tells us if the execution went OK, and how many documents were affected.

The result object looks like this:

```javascript
{ n: 2, ok: 1 }
```

You can use this object to return the number of deleted documents:

```javascript
console.log(obj.result.n);
```

Which will produce this result:

```javascript
2
```

* * *

* * *