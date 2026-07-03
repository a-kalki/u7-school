# Node.js MongoDB Find

* * *

In MongoDB we use the **find** and **findOne** methods to find data in a collection.

Just like the **SELECT** statement is used to find data in a table in a MySQL database.

## Find One

To select data from a collection in MongoDB, we can use the `findOne()` method.

The `findOne()` method returns the first occurrence in the selection.

The first parameter of the `findOne()` method is a query object. In this example we use an empty query object, which selects all documents in a collection (but returns only the first document).

```javascript
let MongoClient = require('mongodb').MongoClient;let url = "mongodb://localhost:27017/";MongoClient.connect(url, function(err, db) {  if (err) throw err;  let dbo = db.db("mydb");  dbo.collection("customers").findOne({}, function(err, result) {    if (err) throw err;    console.log(result.name);    db.close();  });});
```

Save the code above in a file called "demo\_mongodb\_findone.js" and run the file:

```javascript
C:\Users\Your Name>node demo_mongodb_findone.js
```

Which will give you this result:

```javascript
Company Inc.
```

* * *

* * *

## Find All

To select data from a table in MongoDB, we can also use the `find()` method.

The `find()` method returns all occurrences in the selection.

The first parameter of the `find()` method is a query object. In this example we use an empty query object, which selects all documents in the collection.

No parameters in the find() method gives you the same result as **SELECT \*** in MySQL.

```javascript
let MongoClient = require('mongodb').MongoClient;let url = "mongodb://localhost:27017/";MongoClient.connect(url, function(err, db) {  if (err) throw err;  let dbo = db.db("mydb");  dbo.collection("customers").find({}).toArray(function(err, result) {    if (err) throw err;    console.log(result);    db.close();  });});
```

Save the code above in a file called "demo\_mongodb\_find.js" and run the file:

```javascript
C:\Users\Your Name>node demo_mongodb_find.js
```

Which will give you this result:

```javascript
[  { _id: 58fdbf5c0ef8a50b4cdd9a84 , name: 'John', address: 'Highway 71'},  { _id: 58fdbf5c0ef8a50b4cdd9a85 , name: 'Peter', address: 'Lowstreet 4'},  { _id: 58fdbf5c0ef8a50b4cdd9a86 , name: 'Amy', address: 'Apple st 652'},  { _id: 58fdbf5c0ef8a50b4cdd9a87 , name: 'Hannah', address: 'Mountain 21'},  { _id: 58fdbf5c0ef8a50b4cdd9a88 , name: 'Michael', address: 'Valley 345'},  { _id: 58fdbf5c0ef8a50b4cdd9a89 , name: 'Sandy', address: 'Ocean blvd 2'},  { _id: 58fdbf5c0ef8a50b4cdd9a8a , name: 'Betty', address: 'Green Grass 1'},  { _id: 58fdbf5c0ef8a50b4cdd9a8b , name: 'Richard', address: 'Sky st 331'},  { _id: 58fdbf5c0ef8a50b4cdd9a8c , name: 'Susan', address: 'One way 98'},  { _id: 58fdbf5c0ef8a50b4cdd9a8d , name: 'Vicky', address: 'Yellow Garden 2'},  { _id: 58fdbf5c0ef8a50b4cdd9a8e , name: 'Ben', address: 'Park Lane 38'},  { _id: 58fdbf5c0ef8a50b4cdd9a8f , name: 'William', address: 'Central st 954'},  { _id: 58fdbf5c0ef8a50b4cdd9a90 , name: 'Chuck', address: 'Main Road 989'},  { _id: 58fdbf5c0ef8a50b4cdd9a91 , name: 'Viola', address: 'Sideway 1633'}]
```

* * *

## Find Some

The second parameter of the `find()` method is the `projection` object that describes which fields to include in the result.

This parameter is optional, and if omitted, all fields will be included in the result.

```javascript
let MongoClient = require('mongodb').MongoClient;let url = "mongodb://localhost:27017/";MongoClient.connect(url, function(err, db) {  if (err) throw err;  let dbo = db.db("mydb");  dbo.collection("customers").find({}, { projection: { _id: 0, name: 1, address: 1 } }).toArray(function(err, result) {    if (err) throw err;    console.log(result);    db.close();  });});
```

Save the code above in a file called "demo\_mongodb\_find\_fields.js" and run the file:

```javascript
C:\Users\Your Name>node demo_mongodb_find_fields.js
```

Which will give you this result:

```javascript
[  { name: 'John', address: 'Highway 71'},  { name: 'Peter', address: 'Lowstreet 4'},  { name: 'Amy', address: 'Apple st 652'},  { name: 'Hannah', address: 'Mountain 21'},  { name: 'Michael', address: 'Valley 345'},  { name: 'Sandy', address: 'Ocean blvd 2'},  { name: 'Betty', address: 'Green Grass 1'},  { name: 'Richard', address: 'Sky st 331'},  { name: 'Susan', address: 'One way 98'},  { name: 'Vicky', address: 'Yellow Garden 2'},  { name: 'Ben', address: 'Park Lane 38'},  { name: 'William', address: 'Central st 954'},  { name: 'Chuck', address: 'Main Road 989'},  { name: 'Viola', address: 'Sideway 1633'}]
```

You are not allowed to specify both 0 and 1 values in the same object (except if one of the fields is the \_id field). If you specify a field with the value 0, all other fields get the value 1, and vice versa:

```javascript
let MongoClient = require('mongodb').MongoClient;let url = "mongodb://localhost:27017/";MongoClient.connect(url, function(err, db) {  if (err) throw err;  let dbo = db.db("mydb");  dbo.collection("customers").find({}, { projection: { address: 0 } }).toArray(function(err, result) {    if (err) throw err;    console.log(result);    db.close();  });});
```

To exclude the \_id field, you must set its value to 0:

```javascript
let MongoClient = require('mongodb').MongoClient;let url = "mongodb://localhost:27017/";MongoClient.connect(url, function(err, db) {  if (err) throw err;  let dbo = db.db("mydb");  dbo.collection("customers").find({}, { projection: { _id: 0, name: 1 } }).toArray(function(err, result) {    if (err) throw err;    console.log(result);    db.close();  });});
```
```javascript
let MongoClient = require('mongodb').MongoClient;let url = "mongodb://localhost:27017/";MongoClient.connect(url, function(err, db) {  if (err) throw err;  let dbo = db.db("mydb");  dbo.collection("customers").find({}, { projection: { _id: 0 } }).toArray(function(err, result) {    if (err) throw err;    console.log(result);    db.close();  });});
```
```javascript
let MongoClient = require('mongodb').MongoClient;let url = "mongodb://localhost:27017/";MongoClient.connect(url, function(err, db) {  if (err) throw err;  let dbo = db.db("mydb");  dbo.collection("customers").find({}, { projection: { name: 1, address: 0 } }).toArray(function(err, result) {    if (err) throw err;    console.log(result);    db.close();  });});
```

* * *

## The Result Object

As you can see from the result of the example above, the result can be converted into an array containing each document as an object.

To return e.g. the address of the third document, just refer to the third array object's address property:

```javascript
console.log(result[2].address);
```

Which will produce this result:

```javascript
Apple st 652
```

* * *

* * *