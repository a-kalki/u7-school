# Node.js MongoDB Update

* * *

## Update Document

You can update a record, or document as it is called in MongoDB, by using the `updateOne()` method.

The first parameter of the `updateOne()` method is a query object defining which document to update.

**Note:** If the query finds more than one record, only the first occurrence is updated.

The second parameter is an object defining the new values of the document.

```javascript
let MongoClient = require('mongodb').MongoClient;let url = "mongodb://127.0.0.1:27017/";MongoClient.connect(url, function(err, db) {  if (err) throw err;  let dbo = db.db("mydb");  let myquery = { address: "Valley 345" };  let newvalues = { $set: {name: "Mickey", address: "Canyon 123" } };  dbo.collection("customers").updateOne(myquery, newvalues, function(err, res) {    if (err) throw err;    console.log("1 document updated");    db.close();  });});
```

Save the code above in a file called "demo\_update\_one.js" and run the file:

```javascript
C:\Users\Your Name>node demo_update_one.js
```

Which will give you this result:

```javascript
1 document updated
```

* * *

* * *

## Update Only Specific Fields

When using the `$set` operator, only the specified fields are updated:

```javascript
...  let myquery = { address: "Valley 345" };  let newvalues = { $set: { address: "Canyon 123" } };  dbo.collection("customers").updateOne(myquery, newvalues, function(err, res) {...
```

* * *

## Update Many Documents

To update _all_ documents that meets the criteria of the query, use the `updateMany()` method.

```javascript
let MongoClient = require('mongodb').MongoClient;let url = "mongodb://127.0.0.1:27017/";MongoClient.connect(url, function(err, db) {  if (err) throw err;  let dbo = db.db("mydb");  let myquery = { address: /^S/ };  let newvalues = {$set: {name: "Minnie"} };  dbo.collection("customers").updateMany(myquery, newvalues, function(err, res) {    if (err) throw err;    console.log(res.result.nModified + " document(s) updated");    db.close();  });});
```

Save the code above in a file called "demo\_update\_many.js" and run the file:

```javascript
C:\Users\Your Name>node demo_update_many.js
```

Which will give you this result:

```javascript
2 document(s) updated
```

* * *

## The Result Object

The `updateOne()` and the `updateMany()` methods return an object which contains information about how the execution affected the database.

Most of the information is not important to understand, but one object inside the object is called "result" which tells us if the execution went OK, and how many documents were affected.

The result object looks like this:

```javascript
{ n: 1, nModified: 2, ok: 1 }
```

You can use this object to return the number of updated documents:

```javascript
console.log(res.result.nModified);
```

Which will produce this result:

```javascript
2
```

* * *

* * *