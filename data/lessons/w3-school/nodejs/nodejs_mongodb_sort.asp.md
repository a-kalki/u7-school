# Node.js MongoDB Sort

* * *

## Sort the Result

Use the `sort()` method to sort the result in ascending or descending order.

The `sort()` method takes one parameter, an object defining the sorting order.

```javascript
let MongoClient = require('mongodb').MongoClient;let url = "mongodb://localhost:27017/";MongoClient.connect(url, function(err, db) {  if (err) throw err;  let dbo = db.db("mydb");  let mysort = { name: 1 };  dbo.collection("customers").find().sort(mysort).toArray(function(err, result) {    if (err) throw err;    console.log(result);    db.close();  });});
```

Save the code above in a file called "demo\_sort.js" and run the file:

```javascript
C:\Users\Your Name>node demo_sort.js
```

Which will give you this result:

```javascript
[  { _id: 58fdbf5c0ef8a50b4cdd9a86, name: 'Amy', address: 'Apple st 652'},  { _id: 58fdbf5c0ef8a50b4cdd9a8e, name: 'Ben', address: 'Park Lane 38'},  { _id: 58fdbf5c0ef8a50b4cdd9a8a, name: 'Betty', address: 'Green Grass 1'},  { _id: 58fdbf5c0ef8a50b4cdd9a90, name: 'Chuck', address: 'Main Road 989'},  { _id: 58fdbf5c0ef8a50b4cdd9a87, name: 'Hannah', address: 'Mountain 21'},  { _id: 58fdbf5c0ef8a50b4cdd9a84, name: 'John', address: 'Highway 71'},  { _id: 58fdbf5c0ef8a50b4cdd9a88, name: 'Michael', address: 'Valley 345'},  { _id: 58fdbf5c0ef8a50b4cdd9a85, name: 'Peter', address: 'Lowstreet 4'},  { _id: 58fdbf5c0ef8a50b4cdd9a8b, name: 'Richard', address: 'Sky st 331'},  { _id: 58fdbf5c0ef8a50b4cdd9a89, name: 'Sandy', address: 'Ocean blvd 2'},  { _id: 58fdbf5c0ef8a50b4cdd9a8c, name: 'Susan', address: 'One way 98'},  { _id: 58fdbf5c0ef8a50b4cdd9a8d, name: 'Vicky', address: 'Yellow Garden 2'},  { _id: 58fdbf5c0ef8a50b4cdd9a91, name: 'Viola', address: 'Sideway 1633'},  { _id: 58fdbf5c0ef8a50b4cdd9a8f, name: 'William', address: 'Central st 954'}]
```

* * *

* * *

## Sort Descending

Use the value -1 in the sort object to sort descending.

{ name: 1 } // ascending  
{ name: -1 } // descending

```javascript
let MongoClient = require('mongodb').MongoClient;let url = "mongodb://localhost:27017/";MongoClient.connect(url, function(err, db) {  if (err) throw err;  let dbo = db.db("mydb");  let mysort = { name: -1 };  dbo.collection("customers").find().sort(mysort).toArray(function(err, result) {    if (err) throw err;    console.log(result);    db.close();  });});
```

Save the code above in a file called "demo\_sort\_desc.js" and run the file:

```javascript
C:\Users\Your Name>node demo_sort_desc.js
```

Which will give you this result:

```javascript
[  { _id: 58fdbf5c0ef8a50b4cdd9a8f, name: 'William', address: 'Central st 954'},  { _id: 58fdbf5c0ef8a50b4cdd9a91, name: 'Viola', address: 'Sideway 1633'},  { _id: 58fdbf5c0ef8a50b4cdd9a8d, name: 'Vicky', address: 'Yellow Garden 2'},  { _id: 58fdbf5c0ef8a50b4cdd9a8c, name: 'Susan', address: 'One way 98'},  { _id: 58fdbf5c0ef8a50b4cdd9a89, name: 'Sandy', address: 'Ocean blvd 2'},  { _id: 58fdbf5c0ef8a50b4cdd9a8b, name: 'Richard', address: 'Sky st 331'},  { _id: 58fdbf5c0ef8a50b4cdd9a85, name: 'Peter', address: 'Lowstreet 4'},  { _id: 58fdbf5c0ef8a50b4cdd9a88, name: 'Michael', address: 'Valley 345'},  { _id: 58fdbf5c0ef8a50b4cdd9a84, name: 'John', address: 'Highway 71'},  { _id: 58fdbf5c0ef8a50b4cdd9a87, name: 'Hannah', address: 'Mountain 21'},  { _id: 58fdbf5c0ef8a50b4cdd9a90, name: 'Chuck', address: 'Main Road 989'},  { _id: 58fdbf5c0ef8a50b4cdd9a8a, name: 'Betty', address: 'Green Grass 1'},  { _id: 58fdbf5c0ef8a50b4cdd9a8e, name: 'Ben', address: 'Park Lane 38'},  { _id: 58fdbf5c0ef8a50b4cdd9a86, name: 'Amy', address: 'Apple st 652'}]
```

* * *

* * *