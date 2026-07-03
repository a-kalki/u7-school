# Node.js HTTP Module

* * *

## The Built-in HTTP Module

Node.js includes a powerful built-in HTTP module that enables you to create HTTP servers and make HTTP requests.

This module is essential for building web applications and APIs in Node.js.

### Key Features

*   Create HTTP servers to handle requests and send responses
*   Make HTTP requests to other servers
*   Handle different HTTP methods (GET, POST, PUT, DELETE, etc.)
*   Work with request and response headers
*   Handle streaming data for large payloads

### Including the HTTP Module

To use the HTTP module, include it in your application using the `require()` method:

```javascript
// Using CommonJS require (Node.js default)const http = require('http');// Or using ES modules (Node.js 14+ with "type": "module" in package.json)// import http from 'http';
```

* * *

## Creating an HTTP Server

The HTTP module's `createServer()` method creates an HTTP server that listens for requests on a specified port and executes a callback function for each request.

### Basic HTTP Server Example

```javascript
// Import the HTTP moduleconst http = require('http');// Create a server objectconst server = http.createServer((req, res) => {  // Set the response HTTP header with HTTP status and Content type  res.writeHead(200, { 'Content-Type': 'text/plain' });  // Send the response body as 'Hello, World!'  res.end('Hello, World!\n');});// Define the port to listen on const PORT = 3000;// Start the server and listen on the specified portserver.listen(PORT, 'localhost', () => {  console.log(`Server running at http://localhost:${PORT}/`);});
```

### Understanding the Code

1.  `http.createServer()` - Creates a new HTTP server instance
2.  The callback function is executed for each request with two parameters:
    *   `req` - The request object (http.IncomingMessage)
    *   `res` - The response object (http.ServerResponse)
3.  `res.writeHead()` - Sets the response status code and headers
4.  `res.end()` - Sends the response and ends the connection
5.  `server.listen()` - Starts the server on the specified port

### Running the Server

1.  Save the code in a file named `server.js`
2.  Run the server using Node.js:

```javascript
node server.js
```

Visit [http://localhost:3000](http://localhost:3000) in your browser to see the response.

* * *

* * *

## Working with HTTP Headers

HTTP headers let you send additional information with your response.

The `res.writeHead()` method is used to set the status code and response headers.

### Setting Response Headers

```javascript
const http = require('http');const server = http.createServer((req, res) => {  // Set status code and multiple headers  res.writeHead(200, {    'Content-Type': 'text/html',    'X-Powered-By': 'Node.js',    'Cache-Control': 'no-cache, no-store, must-revalidate',    'Set-Cookie': 'sessionid=abc123; HttpOnly'  });  res.end('<h1>Hello, World!</h1>');});server.listen(3000, () => {  console.log('Server running at http://localhost:3000/');});
```

### Common HTTP Status Codes

Code

Message

Description

200

OK

Standard response for successful HTTP requests

201

Created

Request has been fulfilled and new resource created

301

Moved Permanently

Resource has been moved to a new URL

400

Bad Request

Server cannot process the request due to client error

401

Unauthorized

Authentication is required

403

Forbidden

Server refuses to authorize the request

404

Not Found

Requested resource could not be found

500

Internal Server Error

Unexpected condition was encountered

### Common Response Headers

*   `Content-Type`: Specifies the media type of the content (e.g., text/html, application/json)
*   `Content-Length`: The length of the response body in bytes
*   `Location`: Used in redirects (with 3xx status codes)
*   `Set-Cookie`: Sets HTTP cookies on the client
*   `Cache-Control`: Directives for caching mechanisms
*   `Access-Control-Allow-Origin`: For CORS support

### Reading Request Headers

You can access request headers using the `req.headers` object:

```javascript
const http = require('http');const server = http.createServer((req, res) => {  // Log all request headers  console.log('Request Headers:', req.headers);  // Get specific headers (case-insensitive)  const userAgent = req.headers['user-agent'];  const acceptLanguage = req.headers['accept-language'];  res.writeHead(200, { 'Content-Type': 'text/plain' });  res.end(`User-Agent: ${userAgent}\nAccept-Language: ${acceptLanguage}`);});server.listen(3000);
```

* * *

## Working with URLs and Query Strings

Node.js provides built-in modules to work with URLs and query strings, making it easy to handle different parts of a URL and parse query parameters.

### Accessing the Request URL

The `req.url` property contains the URL string that was requested, including any query parameters.

This is part of the `http.IncomingMessage` object.

```javascript
const http = require('http');const server = http.createServer((req, res) => {  // Get the URL and HTTP method  const { url, method } = req;  res.writeHead(200, { 'Content-Type': 'text/plain' });  res.end(`You made a ${method} request to ${url}`);});server.listen(3000, () => {  console.log('Server running at http://localhost:3000/');});
```

### Parsing URLs with the URL Module

The `url` module provides utilities for URL resolution and parsing.

It can parse a URL string into a URL object with properties for each part of the URL.

```javascript
const http = require('http');const url = require('url');const server = http.createServer((req, res) => {  // Parse the URL  const parsedUrl = url.parse(req.url, true);  // Get different parts of the URL  const pathname = parsedUrl.pathname; // The path without query string  const query = parsedUrl.query; // The query string as an object  res.writeHead(200, { 'Content-Type': 'application/json' });  res.end(JSON.stringify({    pathname,    query,    fullUrl: req.url  }, null, 2));});server.listen(3000);
```

#### Example Requests and Responses

For the following request:

GET /products?category=electronics&sort=price&page=2 HTTP/1.1

The server would respond with:

{  
  "pathname": "/products",  
  "query": {  
    "category": "electronics",  
    "sort": "price",  
    "page": "2"  
  },  
  "fullUrl": "/products?category=electronics&sort=price&page=2"  
}

### Working with Query Strings

For more advanced query string handling, you can use the `querystring` module:

```javascript
const http = require('http');const { URL } = require('url');const querystring = require('querystring');const server = http.createServer((req, res) => {  // Using the newer URL API (Node.js 10+)  const baseURL = 'http://' + req.headers.host + '/';   const parsedUrl = new URL(req.url, baseURL);  // Get query parameters  const params = Object.fromEntries(parsedUrl.searchParams);  // Example of building a query string  const queryObj = {    name: 'John Doe',    age: 30,    interests: ['programming', 'music']  };  const queryStr = querystring.stringify(queryObj);  res.writeHead(200, { 'Content-Type': 'application/json' });  res.end(JSON.stringify({    path: parsedUrl.pathname,    params,    exampleQueryString: queryStr  }, null, 2));});server.listen(3000);
```

#### Common URL Parsing Methods

*   `url.parse(urlString, [parseQueryString], [slashesDenoteHost])`: Parse a URL string into an object
*   `url.format(urlObject)`: Format a URL object into a URL string
*   `url.resolve(from, to)`: Resolve a target URL relative to a base URL
*   `new URL(input, [base])`: The WHATWG URL API (recommended for new code)
*   `querystring.parse(str, [sep], [eq], [options])`: Parse a query string into an object
*   `querystring.stringify(obj, [sep], [eq], [options])`: Stringify an object into a query string

* * *

## Handling Different HTTP Methods

RESTful APIs commonly use different HTTP methods (GET, POST, PUT, DELETE, etc.) to perform different operations on resources.

Here's how to handle different HTTP methods in a Node.js HTTP server:

```javascript
const http = require('http');const { URL } = require('url');// In-memory data store (for demonstration)let todos = [  { id: 1, task: 'Learn Node.js', completed: false },  { id: 2, task: 'Build an API', completed: false }];const server = http.createServer((req, res) => {  const { method, url } = req;  const parsedUrl = new URL(url, `http://${req.headers.host}`);  const pathname = parsedUrl.pathname;  // Set CORS headers (for development)  res.setHeader('Access-Control-Allow-Origin', '*');  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');  // Handle preflight requests  if (method === 'OPTIONS') {    res.writeHead(204);    res.end();    return;  }  // Route: GET /todos  if (method === 'GET' && pathname === '/todos') {    res.writeHead(200, { 'Content-Type': 'application/json' });    res.end(JSON.stringify(todos));  }  // Route: POST /todos  else if (method === 'POST' && pathname === '/todos') {    let body = '';    req.on('data', chunk => {      body += chunk.toString();    });    req.on('end', () => {      try {        const newTodo = JSON.parse(body);        newTodo.id = todos.length > 0 ? Math.max(...todos.map(t => t.id)) + 1 : 1;        todos.push(newTodo);        res.writeHead(201, { 'Content-Type': 'application/json' });        res.end(JSON.stringify(newTodo));      } catch (error) {        res.writeHead(400, { 'Content-Type': 'application/json' });        res.end(JSON.stringify({ error: 'Invalid JSON' }));      }    });  }  // Route: PUT /todos/:id  else if (method === 'PUT' && pathname.startsWith('/todos/')) {    const id = parseInt(pathname.split('/')[2]);    let body = '';    req.on('data', chunk => {      body += chunk.toString();    });    req.on('end', () => {      try {        const updatedTodo = JSON.parse(body);        const index = todos.findIndex(t => t.id === id);        if (index === -1) {          res.writeHead(404, { 'Content-Type': 'application/json' });          res.end(JSON.stringify({ error: 'Todo not found' }));        } else {          todos[index] = { ...todos[index], ...updatedTodo };          res.writeHead(200, { 'Content-Type': 'application/json' });          res.end(JSON.stringify(todos[index]));        }      } catch (error) {        res.writeHead(400, { 'Content-Type': 'application/json' });        res.end(JSON.stringify({ error: 'Invalid JSON' }));      }    });  }  // Route: DELETE /todos/:id  else if (method === 'DELETE' && pathname.startsWith('/todos/')) {    const id = parseInt(pathname.split('/')[2]);    const index = todos.findIndex(t => t.id === id);    if (index === -1) {      res.writeHead(404, { 'Content-Type': 'application/json' });      res.end(JSON.stringify({ error: 'Todo not found' }));    } else {      todos = todos.filter(t => t.id !== id);      res.writeHead(204);      res.end();    }  }  // 404 Not Found  else {    res.writeHead(404, { 'Content-Type': 'application/json' });    res.end(JSON.stringify({ error: 'Not Found' }));  }});const PORT = 3000;server.listen(PORT, () => {  console.log(`Server running at http://localhost:${PORT}/`);});
```

### Testing the API with cURL

You can test this API using cURL commands:

```javascript
curl http://localhost:3000/todos
```
```javascript
curl -X POST http://localhost:3000/todos \-H "Content-Type: application/json" \-d '{"task":"New Task","completed":false}'
```
```javascript
curl -X PUT http://localhost:3000/todos/1 \-H "Content-Type: application/json" \-d '{"completed":true}'
```
```javascript
curl -X DELETE http://localhost:3000/todos/1
```

### Best Practices for HTTP Methods

*   **GET**: Retrieve a resource or collection of resources (should be idempotent)
*   **POST**: Create a new resource (not idempotent)
*   **PUT**: Update an existing resource or create it if it doesn't exist (idempotent)
*   **PATCH**: Partially update a resource
*   **DELETE**: Remove a resource (idempotent)
*   **HEAD**: Same as GET but without the response body
*   **OPTIONS**: Describe the communication options for the target resource

### Error Handling

Always include proper error handling and appropriate HTTP status codes:

*   `200 OK` - Successful GET/PUT/PATCH
*   `201 Created` - Successful resource creation
*   `204 No Content` - Successful DELETE
*   `400 Bad Request` - Invalid request data
*   `401 Unauthorized` - Authentication required
*   `403 Forbidden` - Not enough permissions
*   `404 Not Found` - Resource doesn't exist
*   `500 Internal Server Error` - Server-side error

* * *

## Streaming Responses

Node.js streams are powerful for handling large amounts of data efficiently. The HTTP module works well with streams for both reading request bodies and writing responses.

```javascript
const http = require('http');const fs = require('fs');const path = require('path');const server = http.createServer((req, res) => {  // Get the file path from the URL  const filePath = path.join(__dirname, req.url);  // Check if file exists  fs.access(filePath, fs.constants.F_OK, (err) => {    if (err) {      res.statusCode = 404;      res.end('File not found');      return;    }    // Get file stats    fs.stat(filePath, (err, stats) => {      if (err) {        res.statusCode = 500;        res.end('Server error');        return;      }      // Set appropriate headers      res.setHeader('Content-Length', stats.size);      res.setHeader('Content-Type', 'application/octet-stream');      // Create read stream and pipe to response      const stream = fs.createReadStream(filePath);      // Handle errors      stream.on('error', (err) => {        console.error('Error reading file:', err);        if (!res.headersSent) {          res.statusCode = 500;          res.end('Error reading file');        }      });      // Pipe the file to the response      stream.pipe(res);    });  });});const PORT = 3000;server.listen(PORT, () => {  console.log(`File server running at http://localhost:${PORT}/`);});
```

### Benefits of Streaming

*   **Memory Efficiency**: Processes data in chunks instead of loading everything into memory
*   **Faster Time to First Byte**: Starts sending data as soon as it's available
*   **Backpressure Handling**: Automatically handles slow clients by pausing the read stream

### Common Use Cases for Streaming

*   File uploads/downloads
*   Real-time data processing
*   Proxying requests
*   Video/audio streaming
*   Log processing

* * *

* * *