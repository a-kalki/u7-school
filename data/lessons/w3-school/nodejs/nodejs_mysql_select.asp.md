# Node.js MySQL Select From

* * *

## Selecting From a Table

To select data from a table in MySQL, use the "SELECT" statement.

```javascript
let mysql = require('mysql');let con = mysql.createConnection({  host: "localhost",  user: "yourusername",  password: "yourpassword",  database: "mydb"});con.connect(function(err) {  if (err) throw err;  con.query("SELECT * FROM customers", function (err, result, fields) {    if (err) throw err;    console.log(result);  });});
```

**SELECT \*** will return _all_ columns

Save the code above in a file called "demo\_db\_select.js" and run the file:

```javascript
C:\Users\Your Name>node demo_db_select.js
```

Which will give you this result:

```javascript
[  { id: 1, name: 'John', address: 'Highway 71'},  { id: 2, name: 'Peter', address: 'Lowstreet 4'},  { id: 3, name: 'Amy', address: 'Apple st 652'},  { id: 4, name: 'Hannah', address: 'Mountain 21'},  { id: 5, name: 'Michael', address: 'Valley 345'},  { id: 6, name: 'Sandy', address: 'Ocean blvd 2'},  { id: 7, name: 'Betty', address: 'Green Grass 1'},  { id: 8, name: 'Richard', address: 'Sky st 331'},  { id: 9, name: 'Susan', address: 'One way 98'},  { id: 10, name: 'Vicky', address: 'Yellow Garden 2'},  { id: 11, name: 'Ben', address: 'Park Lane 38'},  { id: 12, name: 'William', address: 'Central st 954'},  { id: 13, name: 'Chuck', address: 'Main Road 989'},  { id: 14, name: 'Viola', address: 'Sideway 1633'}]
```

* * *

* * *

## Selecting Columns

To select only some of the columns in a table, use the "SELECT" statement followed by the column name.

```javascript
let mysql = require('mysql');let con = mysql.createConnection({  host: "localhost",  user: "yourusername",  password: "yourpassword",  database: "mydb"});con.connect(function(err) {  if (err) throw err;  con.query("SELECT name, address FROM customers", function (err, result, fields) {    if (err) throw err;    console.log(result);  });});
```

Save the code above in a file called "demo\_db\_select2.js" and run the file:

```javascript
C:\Users\Your Name>node demo_db_select2.js
```

Which will give you this result:

```javascript
[  { name: 'John', address: 'Highway 71'},  { name: 'Peter', address: 'Lowstreet 4'},  { name: 'Amy', address: 'Apple st 652'},  { name: 'Hannah', address: 'Mountain 21'},  { name: 'Michael', address: 'Valley 345'},  { name: 'Sandy', address: 'Ocean blvd 2'},  { name: 'Betty', address: 'Green Grass 1'},  { name: 'Richard', address: 'Sky st 331'},  { name: 'Susan', address: 'One way 98'},  { name: 'Vicky', address: 'Yellow Garden 2'},  { name: 'Ben', address: 'Park Lane 38'},  { name: 'William', address: 'Central st 954'},  { name: 'Chuck', address: 'Main Road 989'},  { name: 'Viola', address: 'Sideway 1633'}]
```

* * *

## The Result Object

As you can see from the result of the example above, the result object is an array containing each row as an object.

To return e.g. the address of the third record, just refer to the third array object's address property:

```javascript
console.log(result[2].address);
```

Which will produce this result:

```javascript
Apple st 652
```

* * *

## The Fields Object

The third parameter of the callback function is an array containing information about each field in the result.

```javascript
let mysql = require('mysql');let con = mysql.createConnection({  host: "localhost",  user: "yourusername",  password: "yourpassword",  database: "mydb"});con.connect(function(err) {  if (err) throw err;  con.query("SELECT name, address FROM customers", function (err, result, fields) {    if (err) throw err;    console.log(fields);  });});
```

Save the code above in a file called "demo\_db\_select\_fields.js" and run the file:

```javascript
C:\Users\Your Name>node demo_db_select_fields.js
```

Which will give you this result:

```javascript
[  {    catalog: 'def',    db: 'mydb',    table: 'customers',    orgTable: 'customers',    name: 'name',    orgName: 'name',    charsetNr: 33,    length: 765,    type: 253,    flags: 0,    decimals: 0,    default: undefined,    zeroFill: false,    protocol41: true  },  {    catalog: 'def',    db: 'mydb',    table: 'customers',    orgTable: 'customers',    name: 'address',    orgName: 'address',    charsetNr: 33,    length: 765,    type: 253,    flags: 0,    decimals: 0,    default: undefined,    zeroFill: false,    protocol41: true  }]
```

As you can see from the result of the example above, the fields object is an array containing information about each field as an object.

To return e.g. the name of the second field, just refer to the second array item's name property:

```javascript
console.log(fields[1].name);
```

Which will produce this result:

```javascript
address
```

* * *

* * *