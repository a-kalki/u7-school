# Node.js MongoDB Join

* * *

## Join Collections

MongoDB is not a relational database, but you can perform a left outer join by using the `$lookup` stage.

The `$lookup` stage lets you specify which collection you want to join with the current collection, and which fields that should match.

Consider you have a "orders" collection and a "products" collection:

```javascript
[  { _id: 1, product_id: 154, status: 1 }]
```
```javascript
[  { _id: 154, name: 'Chocolate Heaven' },  { _id: 155, name: 'Tasty Lemons' },  { _id: 156, name: 'Vanilla Dreams' }]
```
```javascript
let MongoClient = require('mongodb').MongoClient;let url = "mongodb://127.0.0.1:27017/";MongoClient.connect(url, function(err, db) {  if (err) throw err;  let dbo = db.db("mydb");  dbo.collection('orders').aggregate([    { $lookup:       {         from: 'products',         localField: 'product_id',         foreignField: '_id',         as: 'orderdetails'       }     }    ]).toArray(function(err, res) {    if (err) throw err;    console.log(JSON.stringify(res));    db.close();  });});
```

Save the code above in a file called "demo\_mongodb\_join.js" and run the file:

```javascript
C:\Users\Your Name>node demo_mongodb_join.js
```

Which will give you this result:

```javascript
[  { "_id": 1, "product_id": 154, "status": 1, "orderdetails": [    { "_id": 154, "name": "Chocolate Heaven" } ]  }]
```

As you can see from the result above, the matching document from the products collection is included in the orders collection as an array.

* * *

* * *

* * *