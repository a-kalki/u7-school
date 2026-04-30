# Node.js URL Module

* * *

## The Built-in URL Module

The URL module provides utilities for URL resolution and parsing.

It can be used to split up a web address into readable parts, construct URLs, and handle different URL components.

### Getting Started

To include the URL module, use the `require()` method.

In modern Node.js (v10.0.0+), you can use either the legacy API or the newer `URL` class (WHATWG URL API):

```javascript
// Using the legacy APIconst url = require('url');// Using the modern URL class (WHATWG API)const { URL } = require('url');
```
```javascript
let url = require('url');
```

Parse an address with the `url.parse()` method, and it will return a URL object with each part of the address as properties:

```javascript
let url = require('url');let adr = 'http://localhost:8080/default.htm?year=2017&month=february';let q = url.parse(adr, true);console.log(q.host);console.log(q.pathname);console.log(q.search);let qdata = q.query;console.log(qdata.month);
```

* * *

## URL Parsing and Formatting

### URL Object Properties

When you parse a URL, you get a URL object with the following properties:

*   `href`: The full URL that was parsed
*   `protocol`: The protocol scheme (e.g., 'http:')
*   `host`: The full host portion (e.g., 'example.com:8080')
*   `hostname`: The hostname portion (e.g., 'example.com')
*   `port`: The port number if specified
*   `pathname`: The path section of the URL
*   `search`: The query string including the leading ?
*   `query`: Either the query string without the ?, or a parsed query object
*   `hash`: The fragment identifier including the #

### Legacy API vs WHATWG URL API

```javascript
const { URL } = require('url');// Using the WHATWG URL API (recommended for new code)const myURL = new URL('https://example.org:8080/p/a/t/h?query=string#hash');console.log(myURL.hostname); // 'example.org'console.log(myURL.pathname); // '/p/a/t/h'console.log(myURL.searchParams.get('query')); // 'string'// Using the legacy APIconst parsedUrl = require('url').parse('https://example.org:8080/p/a/t/h?query=string#hash');console.log(parsedUrl.host); // 'example.org:8080'console.log(parsedUrl.query); // 'query=string'
```

### URLSearchParams API

The `URLSearchParams` API provides utility methods to work with the query string of a URL:

```javascript
const { URL, URLSearchParams } = require('url');const myURL = new URL('https://example.com/?name=Kai&age=30');const params = new URLSearchParams(myURL.search);// Get a parameterconsole.log(params.get('name'));// Add a parameterparams.append('city', 'Stavanger');// Delete a parameterparams.delete('age');// Convert to stringconsole.log(params.toString());
```

* * *

## Node.js File Server

Now we know how to parse the query string, and in a previous chapter we learned how to make Node.js behave as a file server.

Let us combine the two, and serve the file requested by the client.

Create two html files and save them in the same folder as your node.js files.

```javascript
<!DOCTYPE html><html><body><h1>Summer</h1><p>I love the sun!</p></body></html>
```
```javascript
<!DOCTYPE html><html><body><h1>Winter</h1><p>I love the snow!</p></body></html>
```

* * *

* * *

Create a Node.js file that opens the requested file and returns the content to the client. If anything goes wrong, throw a 404 error:

```javascript
let http = require('http');let url = require('url');let fs = require('fs');http.createServer(function (req, res) {  let q = url.parse(req.url, true);  let filename = "." + q.pathname;  fs.readFile(filename, function(err, data) {    if (err) {      res.writeHead(404, {'Content-Type': 'text/html'});      return res.end("404 Not Found");    }     res.writeHead(200, {'Content-Type': 'text/html'});    res.write(data);    return res.end();  });}).listen(8080);
```

Remember to initiate the file:

```javascript
C:\Users\Your Name>node demo_fileserver.js
```

If you have followed the same steps on your computer, you should see two different results when opening these two addresses:

[http://localhost:8080/summer.html](http://localhost:8080/summer.html)

```javascript
<h1>Summer</h1><p>I love the sun!</p>
```

[http://localhost:8080/winter.html](http://localhost:8080/winter.html)

```javascript
<h1>Winter</h1><p>I love the snow!</p>
```

* * *

## Best Practices

### 1\. Always Validate and Sanitize URLs

```javascript
function isValidHttpUrl(string) {  try {    const url = new URL(string);    return url.protocol === 'http:' || url.protocol === 'https:';  } catch (err) {    return false;  }}console.log(isValidHttpUrl('https://example.com')); // trueconsole.log(isValidHttpUrl('ftp://example.com')); // false
```

### 2\. Constructing URLs Safely

```javascript
const { URL } = require('url');// Safe way to construct URLsfunction createProfileUrl(domain, username) {  return new URL(`/users/${encodeURIComponent(username)}`, domain).href;}console.log(createProfileUrl('https://example.com', 'johndoe'));// 'https://example.com/users/johndoe'
```

### 3\. Handling Query Parameters

```javascript
const { URL } = require('url');// Parse URL with query parametersconst url = new URL('https://example.com/search?q=node.js&lang=en');// Get all parametersconsole.log(url.searchParams.toString()); // 'q=node.js&lang=en'// Get specific parameterconsole.log(url.searchParams.get('q')); // 'node.js'// Check if parameter existsconsole.log(url.searchParams.has('lang')); // true// Add new parameterurl.searchParams.append('page', '2');console.log(url.href);// 'https://example.com/search?q=node.js&lang=en&page=2'
```

* * *