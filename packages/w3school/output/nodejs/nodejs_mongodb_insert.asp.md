# Node.js MongoDB Insert

* * *

## Insert Into Collection

To insert a record, or _document_ as it is called in MongoDB, into a collection, we use the `insertOne()` method.

A **document** in MongoDB is the same as a **record** in MySQL

The first parameter of the `insertOne()` method is an object containing the name(s) and value(s) of each field in the document you want to insert.

It also takes a callback function where you can work with any errors, or the result of the insertion:

```javascript
let MongoClient = require('mongodb').MongoClient;let url = "mongodb://localhost:27017/";MongoClient.connect(url, function(err, db) {  if (err) throw err;  let dbo = db.db("mydb");  let myobj = { name: "Company Inc", address: "Highway 37" };  dbo.collection("customers").insertOne(myobj, function(err, res) {    if (err) throw err;    console.log("1 document inserted");    db.close();  });});
```

Save the code above in a file called "demo\_mongodb\_insert.js" and run the file:

```javascript
C:\Users\Your Name>node demo_mongodb_insert.js
```

Which will give you this result:

```javascript
1 document inserted
```

**Note:** If you try to insert documents in a collection that do not exist, MongoDB will create the collection automatically.

* * *

* * *

## Insert Multiple Documents

To insert multiple documents into a collection in MongoDB, we use the `insertMany()` method.

The first parameter of the `insertMany()` method is an array of objects, containing the data you want to insert.

It also takes a callback function where you can work with any errors, or the result of the insertion:

```javascript
let MongoClient = require('mongodb').MongoClient;let url = "mongodb://localhost:27017/";MongoClient.connect(url, function(err, db) {  if (err) throw err;  let dbo = db.db("mydb");  let myobj = [    { name: 'John', address: 'Highway 71'},    { name: 'Peter', address: 'Lowstreet 4'},    { name: 'Amy', address: 'Apple st 652'},    { name: 'Hannah', address: 'Mountain 21'},    { name: 'Michael', address: 'Valley 345'},    { name: 'Sandy', address: 'Ocean blvd 2'},    { name: 'Betty', address: 'Green Grass 1'},    { name: 'Richard', address: 'Sky st 331'},    { name: 'Susan', address: 'One way 98'},    { name: 'Vicky', address: 'Yellow Garden 2'},    { name: 'Ben', address: 'Park Lane 38'},    { name: 'William', address: 'Central st 954'},    { name: 'Chuck', address: 'Main Road 989'},    { name: 'Viola', address: 'Sideway 1633'}  ];  dbo.collection("customers").insertMany(myobj, function(err, res) {    if (err) throw err;    console.log("Number of documents inserted: " + res.insertedCount);    db.close();  });});
```

Save the code above in a file called "demo\_mongodb\_insert\_multiple.js" and run the file:

```javascript
C:\Users\Your Name>node demo_mongodb_insert_multiple.js
```

Which will give you this result:

```javascript
Number of documents inserted: 14
```

* * *

## The Result Object

When executing the `insertMany()` method, a result object is returned.

The result object contains information about how the insertion affected the database.

The object returned from the example above looked like this:

```javascript
{  result: { ok: 1, n: 14 },  ops: [    { name: 'John', address: 'Highway 71', _id: 58fdbf5c0ef8a50b4cdd9a84 },    { name: 'Peter', address: 'Lowstreet 4', _id: 58fdbf5c0ef8a50b4cdd9a85 },    { name: 'Amy', address: 'Apple st 652', _id: 58fdbf5c0ef8a50b4cdd9a86 },    { name: 'Hannah', address: 'Mountain 21', _id: 58fdbf5c0ef8a50b4cdd9a87 },    { name: 'Michael', address: 'Valley 345', _id: 58fdbf5c0ef8a50b4cdd9a88 },    { name: 'Sandy', address: 'Ocean blvd 2', _id: 58fdbf5c0ef8a50b4cdd9a89 },    { name: 'Betty', address: 'Green Grass 1', _id: 58fdbf5c0ef8a50b4cdd9a8a },    { name: 'Richard', address: 'Sky st 331', _id: 58fdbf5c0ef8a50b4cdd9a8b },    { name: 'Susan', address: 'One way 98', _id: 58fdbf5c0ef8a50b4cdd9a8c },    { name: 'Vicky', address: 'Yellow Garden 2', _id: 58fdbf5c0ef8a50b4cdd9a8d },    { name: 'Ben', address: 'Park Lane 38', _id: 58fdbf5c0ef8a50b4cdd9a8e },    { name: 'William', address: 'Central st 954', _id: 58fdbf5c0ef8a50b4cdd9a8f },    { name: 'Chuck', address: 'Main Road 989', _id: 58fdbf5c0ef8a50b4cdd9a90 },    { name: 'Viola', address: 'Sideway 1633', _id: 58fdbf5c0ef8a50b4cdd9a91 } ],  insertedCount: 14,  insertedIds: [    58fdbf5c0ef8a50b4cdd9a84,    58fdbf5c0ef8a50b4cdd9a85,    58fdbf5c0ef8a50b4cdd9a86,    58fdbf5c0ef8a50b4cdd9a87,    58fdbf5c0ef8a50b4cdd9a88,    58fdbf5c0ef8a50b4cdd9a89,    58fdbf5c0ef8a50b4cdd9a8a,    58fdbf5c0ef8a50b4cdd9a8b,    58fdbf5c0ef8a50b4cdd9a8c,    58fdbf5c0ef8a50b4cdd9a8d,    58fdbf5c0ef8a50b4cdd9a8e,    58fdbf5c0ef8a50b4cdd9a8f    58fdbf5c0ef8a50b4cdd9a90,    58fdbf5c0ef8a50b4cdd9a91 ]}
```

The values of the properties can be displayed like this:

```javascript
console.log(res.insertedCount)
```

Which will produce this result:

```javascript
14
```

* * *

## The \_id Field

If you do not specify an `_id` field, then MongoDB will add one for you and assign a unique id for each document.

In the example above no `_id` field was specified, and as you can see from the result object, MongoDB assigned a unique \_id for each document.

If you _do_ specify the `_id` field, the value must be unique for each document:

```javascript
let MongoClient = require('mongodb').MongoClient;let url = "mongodb://localhost:27017/";MongoClient.connect(url, function(err, db) {  if (err) throw err;  let dbo = db.db("mydb");  let myobj = [    { _id: 154, name: 'Chocolate Heaven'},    { _id: 155, name: 'Tasty Lemon'},    { _id: 156, name: 'Vanilla Dream'}  ];  dbo.collection("products").insertMany(myobj, function(err, res) {    if (err) throw err;    console.log(res);    db.close();  });});
```

Save the code above in a file called "demo\_mongodb\_insert\_id.js" and run the file:

```javascript
C:\Users\Your Name>node demo_mongodb_insert_id.js
```

Which will give you this result:

```javascript
{  result: { ok: 1, n: 3 },  ops: [    { _id: 154, name: 'Chocolate Heaven },    { _id: 155, name: 'Tasty Lemon },    { _id: 156, name: 'Vanilla Dream } ],  insertedCount: 3,  insertedIds: [    154,    155,    156 ]}
```

* * *

* * *