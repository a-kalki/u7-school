# Node.js MongoDB Query

* * *

## Filter the Result

When finding documents in a collection, you can filter the result by using a query object.

The first argument of the `find()` method is a query object, and is used to limit the search.

```javascript
let MongoClient = require('mongodb').MongoClient;let url = "mongodb://localhost:27017/";MongoClient.connect(url, function(err, db) {  if (err) throw err;  let dbo = db.db("mydb");  let query = { address: "Park Lane 38" };  dbo.collection("customers").find(query).toArray(function(err, result) {    if (err) throw err;    console.log(result);    db.close();  });});
```

Save the code above in a file called "demo\_mongodb\_query.js" and run the file:

```javascript
C:\Users\Your Name>node demo_mongodb_query.js
```

Which will give you this result:

```javascript
[  { _id: 58fdbf5c0ef8a50b4cdd9a8e , name: 'Ben', address: 'Park Lane 38' }]
```

* * *

* * *

## Filter With Regular Expressions

You can write regular expressions to find exactly what you are searching for.

**Regular expressions can only be used to query _strings_.**

To find only the documents where the "address" field starts with the letter "S", use the regular expression `/^S/`:

```javascript
let MongoClient = require('mongodb').MongoClient;let url = "mongodb://localhost:27017/";MongoClient.connect(url, function(err, db) {  if (err) throw err;  let dbo = db.db("mydb");  let query = { address: /^S/ };  dbo.collection("customers").find(query).toArray(function(err, result) {    if (err) throw err;    console.log(result);    db.close();  });});
```

Save the code above in a file called "demo\_mongodb\_query\_s.js" and run the file:

```javascript
C:\Users\Your Name>node demo_mongodb_query_s.js
```

Which will give you this result:

```javascript
[  { _id: 58fdbf5c0ef8a50b4cdd9a8b , name: 'Richard', address: 'Sky st 331' },  { _id: 58fdbf5c0ef8a50b4cdd9a91 , name: 'Viola', address: 'Sideway 1633' }]
```

* * *

* * *