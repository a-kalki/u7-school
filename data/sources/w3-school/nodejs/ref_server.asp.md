# Node.js Server Reference

* * *

## Server Object

Server objects in Node.js are used to create network servers. Different modules provide their own Server implementations:

*   `http.Server` - For creating HTTP servers
*   `https.Server` - For creating HTTPS servers
*   `net.Server` - For creating TCP servers
*   `tls.Server` - For creating TLS/SSL servers

These server objects handle client connections, process requests, and deliver responses as appropriate for their respective protocols.

* * *

## Common Server Methods

Method

Description

server.listen(\[port\]\[, host\]\[, backlog\]\[, callback\])

Starts the server listening for connections. The callback is executed when the server has been bound.

server.close(\[callback\])

Stops the server from accepting new connections. The callback is called when all connections are closed.

server.address()

Returns the bound address, the address family name, and port of the server.

server.getConnections(callback)

Asynchronously gets the number of concurrent connections on the server.

* * *

## Common Server Events

Event

Description

'close'

Emitted when the server closes.

'connection'

Emitted when a new connection is made.

'error'

Emitted when an error occurs.

'listening'

Emitted when the server has been bound after calling server.listen().

* * *

## HTTP Server

The HTTP server in Node.js is created using the `http.createServer()` method:

```javascript
const http = require('http');// Create an HTTP serverconst server = http.createServer((req, res) => {  // Handle requests  res.writeHead(200, {'Content-Type': 'text/plain'});  res.end('Hello World\n');});// Start the serverconst PORT = 8080;server.listen(PORT, () => {  console.log(`Server running at http://localhost:${PORT}/`);});// Handle server eventsserver.on('error', (err) => {  console.error(`Server error: ${err.message}`);});server.on('close', () => {  console.log('Server closed');});
```

* * *

## HTTPS Server

The HTTPS server requires SSL certificates and is created using the `https.createServer()` method:

```javascript
const https = require('https');const fs = require('fs');// SSL options - in a production environment, use properly signed certificatesconst options = {  key: fs.readFileSync('server-key.pem'),  // Path to your key file  cert: fs.readFileSync('server-cert.pem') // Path to your certificate file};// Create an HTTPS serverconst server = https.createServer(options, (req, res) => {  res.writeHead(200, {'Content-Type': 'text/plain'});  res.end('Hello Secure World\n');});// Start the serverconst PORT = 3443;server.listen(PORT, () => {  console.log(`Server running at https://localhost:${PORT}/`);});
```

* * *

## TCP Server (net.Server)

A TCP server is created using the `net.createServer()` method:

```javascript
const net = require('net');// Create a TCP serverconst server = net.createServer((socket) => {  console.log('Client connected');    // Handle data from client  socket.on('data', (data) => {    console.log(`Received: ${data}`);    socket.write(`Echo: ${data}`);  });    // Handle client disconnection  socket.on('end', () => {    console.log('Client disconnected');  });    // Handle socket errors  socket.on('error', (err) => {    console.error(`Socket error: ${err.message}`);  });});// Start the serverconst PORT = 8888;server.listen(PORT, () => {  console.log(`TCP server listening on port ${PORT}`);});// Get server information after it's listeningserver.on('listening', () => {  const address = server.address();  console.log(`Server info: ${JSON.stringify(address)}`);});
```

* * *

## TLS/SSL Server

A secure TLS/SSL server is created using the `tls.createServer()` method:

```javascript
const tls = require('tls');const fs = require('fs');// SSL optionsconst options = {  key: fs.readFileSync('server-key.pem'),  cert: fs.readFileSync('server-cert.pem'),    // Request client certificate (optional)  requestCert: true,    // Reject connections without certificates (optional)  rejectUnauthorized: false};// Create a TLS serverconst server = tls.createServer(options, (socket) => {  console.log('Client connected securely');    // Check if client provided a certificate  if (socket.authorized) {    console.log('Client authorized');  } else {    console.log('Client unauthorized');  }    // Handle data from client  socket.on('data', (data) => {    console.log(`Received: ${data}`);    socket.write(`Secure echo: ${data}`);  });    // Handle client disconnection  socket.on('end', () => {    console.log('Client disconnected');  });});// Start the serverconst PORT = 8443;server.listen(PORT, () => {  console.log(`TLS server listening on port ${PORT}`);});
```

* * *

## HTTP Server with Routing

A more complete HTTP server with basic routing:

```javascript
const http = require('http');const url = require('url');// Create an HTTP server with routingconst server = http.createServer((req, res) => {  // Parse the URL  const parsedUrl = url.parse(req.url, true);  const path = parsedUrl.pathname;  const trimmedPath = path.replace(/^\/+|\/+$/g, '');    // Get the HTTP method  const method = req.method.toLowerCase();    // Get query parameters  const queryParams = parsedUrl.query;    // Log the request  console.log(`Request received: ${method} ${trimmedPath}`);    // Route handler  let response = {    status: 404,    contentType: 'application/json',    payload: { message: 'Not Found' }  };    // Basic routing  if (method === 'get') {    if (trimmedPath === '') {      // Home route      response = {        status: 200,        contentType: 'text/html',        payload: '<h1>Home Page</h1><p>Welcome to the server</p>'      };    } else if (trimmedPath === 'api/users') {      // API route - list users      response = {        status: 200,        contentType: 'application/json',        payload: {          users: [            { id: 1, name: 'John' },            { id: 2, name: 'Jane' }          ]        }      };    } else if (trimmedPath.startsWith('api/users/')) {      // API route - get user by ID      const userId = trimmedPath.split('/')[2];      response = {        status: 200,        contentType: 'application/json',        payload: { id: userId, name: `User ${userId}` }      };    }  }    // Return the response  res.setHeader('Content-Type', response.contentType);  res.writeHead(response.status);    // Convert payload to string if it's an object  const payloadString = typeof response.payload === 'object'    ? JSON.stringify(response.payload)    : response.payload;    res.end(payloadString);});// Start the serverconst PORT = 8080;server.listen(PORT, () => {  console.log(`Server running at http://localhost:${PORT}/`);});
```

* * *

## Server Timeouts and Limits

Configuring server timeouts and connection limits:

```javascript
const http = require('http');// Create an HTTP serverconst server = http.createServer((req, res) => {  // Simulating a delayed response  setTimeout(() => {    res.writeHead(200, {'Content-Type': 'text/plain'});    res.end('Response after delay\n');  }, 2000);});// Configure server timeoutsserver.timeout = 10000; // 10 seconds (default is 120000 or 2 minutes)server.keepAliveTimeout = 5000; // 5 seconds (default is 5000)server.maxHeadersCount = 1000; // Maximum headers count (default is 2000)server.maxRequestsPerSocket = 100; // Max requests per socket (Node.js 14+)// Start the serverconst PORT = 8080;server.listen(PORT, () => {  console.log(`Server with timeouts configured at http://localhost:${PORT}/`);    // Display the server configuration  console.log(`Server timeout: ${server.timeout}ms`);  console.log(`Keep-alive timeout: ${server.keepAliveTimeout}ms`);  console.log(`Max headers count: ${server.maxHeadersCount}`);  console.log(`Max requests per socket: ${server.maxRequestsPerSocket || 'N/A'}`);});
```

* * *

## HTTP/2 Server

Creating an HTTP/2 server (introduced in Node.js v8.4.0):

```javascript
const http2 = require('http2');const fs = require('fs');// SSL options for HTTP/2const options = {  key: fs.readFileSync('server-key.pem'),  cert: fs.readFileSync('server-cert.pem')};// Create an HTTP/2 serverconst server = http2.createSecureServer(options);// Handle incoming streamsserver.on('stream', (stream, headers) => {  const path = headers[':path'];  const method = headers[':method'];    console.log(`${method} ${path}`);    // Respond to the request  stream.respond({    'content-type': 'text/html',    ':status': 200  });    stream.end('<h1>HTTP/2 Server</h1><p>This page was served via HTTP/2</p>');});// Start the serverconst PORT = 8443;server.listen(PORT, () => {  console.log(`HTTP/2 server running at https://localhost:${PORT}/`);});
```

* * *

## Best Practices

1.  **Error handling**: Always handle server errors by listening for the 'error' event.
2.  **Graceful shutdown**: Implement proper shutdown procedures using `server.close()`.
3.  **Timeouts**: Configure appropriate timeouts to prevent resource exhaustion.
4.  **Clustering**: Use the `cluster` module to utilize multiple CPU cores.
5.  **HTTPS/TLS**: Use secure servers for production applications.
6.  **Connection limits**: Set appropriate limits based on your server's capabilities.
7.  **Monitoring**: Implement monitoring for connections, requests, and response times.

* * *