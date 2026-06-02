# Node.js Response Reference

* * *

## HTTP Response Object

The HTTP Response object in Node.js (`http.ServerResponse`) is created internally by an HTTP server, not by the user. It's passed as the second parameter to the 'request' event callback function.

This object is used to return data to the client and implements the `Writable Stream` interface. The response object is how the server sends data back to the client that made the request.

### Using the Response Object

```javascript
const http = require('http');// Create an HTTP serverconst server = http.createServer((req, res) => {  // 'res' is the ServerResponse object  res.statusCode = 200;  res.setHeader('Content-Type', 'text/plain');  res.end('Hello World\n');});server.listen(8080, () => {  console.log('Server running at http://localhost:8080/');});
```

* * *

## Response Properties

Property

Description

response.finished

A boolean indicating if the response has completed.

response.headersSent

A boolean indicating if headers were sent to the client.

response.sendDate

When true, the Date header will be automatically generated and sent in the response if it's not already set. Default: true.

response.statusCode

The status code that will be sent to the client (e.g., 200, 404, 500).

response.statusMessage

The status message that will be sent to the client.

response.socket

Reference to the underlying socket.

response.writableEnded

A boolean indicating whether `response.end()` has been called.

response.writableFinished

A boolean indicating if all data has been flushed to the underlying system.

* * *

## Response Methods

Method

Description

response.addTrailers(headers)

Adds HTTP trailing headers to the response.

response.cork()

Forces buffering of data written to the response.

response.end(\[data\[, encoding\]\]\[, callback\])

Signals to the server that all response headers and body have been sent.

response.flushHeaders()

Flushes the response headers.

response.getHeader(name)

Gets the value of an outgoing header that's already been queued but not sent.

response.getHeaderNames()

Returns an array containing the names of headers that have been queued for an outgoing message.

response.getHeaders()

Returns a shallow copy of the current outgoing headers.

response.hasHeader(name)

Returns `true` if the header identified by `name` is currently set.

response.removeHeader(name)

Removes a header that's queued for sending.

response.setHeader(name, value)

Sets a single header value for the header object.

response.setTimeout(msecs\[, callback\])

Sets the timeout value of the socket.

response.uncork()

Flushes the data buffered by `cork()`.

response.write(chunk\[, encoding\]\[, callback\])

Sends a chunk of the response body.

response.writeContinue()

Sends an HTTP/1.1 100 Continue message to the client.

response.writeHead(statusCode\[, statusMessage\]\[, headers\])

Sends a response header to the request.

response.writeProcessing()

Sends an HTTP/1.1 102 Processing message to the client.

* * *

## Basic Response Example

A basic example of using various response methods:

```javascript
const http = require('http');// Create an HTTP serverconst server = http.createServer((req, res) => {  // Set status code and message  res.statusCode = 200;  res.statusMessage = 'OK';    // Set headers  res.setHeader('Content-Type', 'text/html');  res.setHeader('X-Powered-By', 'Node.js');    // Log response information  console.log(`Response status: ${res.statusCode} ${res.statusMessage}`);  console.log(`Headers sent: ${res.headersSent}`);    // Send additional headers using writeHead (overwrites previously set ones)  res.writeHead(200, {    'Content-Type': 'text/html',    'X-Custom-Header': 'Custom Value'  });    // Check headers sent now  console.log(`Headers sent after writeHead: ${res.headersSent}`);    // Write response body in chunks  res.write('<!DOCTYPE html>\n');  res.write('<html>\n');  res.write('<head><title>Node.js Response Example</title></head>\n');  res.write('<body>\n');  res.write('  <h1>Hello from Node.js!</h1>\n');  res.write('  <p>This response was sent using the ServerResponse object.</p>\n');  res.write('</body>\n');  res.write('</html>');    // End the response  res.end();    // Log completion status  console.log(`Response finished: ${res.finished}`);  console.log(`Response writableEnded: ${res.writableEnded}`);  console.log(`Response writableFinished: ${res.writableFinished}`);});// Start the serverconst PORT = 8080;server.listen(PORT, () => {  console.log(`Server running at http://localhost:${PORT}/`);});
```

* * *

## Setting Response Headers

Different ways to set response headers:

```javascript
const http = require('http');// Create HTTP serverconst server = http.createServer((req, res) => {  // Method 1: Set individual headers with setHeader  res.setHeader('Content-Type', 'application/json');  res.setHeader('Cache-Control', 'max-age=3600');  res.setHeader('X-Custom-Header', 'Method 1');    // Get a header value  const contentType = res.getHeader('Content-Type');  console.log(`Content-Type header: ${contentType}`);    // Check if a header exists  console.log(`Has Cache-Control header: ${res.hasHeader('Cache-Control')}`);    // Get all header names  console.log('Header names:', res.getHeaderNames());    // Get all headers as an object  console.log('All headers:', res.getHeaders());    // Remove a header  res.removeHeader('X-Custom-Header');  console.log(`After removal, has X-Custom-Header: ${res.hasHeader('X-Custom-Header')}`);    // Method 2: Set multiple headers with writeHead  res.writeHead(200, {    'Content-Type': 'application/json',    'X-Custom-Header': 'Method 2',    'X-Powered-By': 'Node.js'  });    // Send JSON response  const responseObject = {    message: 'Headers demonstration',    headers: Object.fromEntries(      Object.entries(res.getHeaders())    ),    headersSent: res.headersSent  };    res.end(JSON.stringify(responseObject, null, 2));});// Start serverconst PORT = 8080;server.listen(PORT, () => {  console.log(`Server running at http://localhost:${PORT}/`);});
```

* * *

## HTTP Status Codes

Setting different HTTP status codes:

```javascript
const http = require('http');const url = require('url');// Create an HTTP server that demonstrates different status codesconst server = http.createServer((req, res) => {  // Parse the request URL  const parsedUrl = url.parse(req.url, true);  const path = parsedUrl.pathname;    // Set Content-Type header  res.setHeader('Content-Type', 'text/html');    // Handle different paths with different status codes  if (path === '/') {    // 200 OK    res.writeHead(200, 'OK');    res.end(`      <h1>HTTP Status Codes Demo</h1>      <p>This page demonstrates different HTTP status codes.</p>      <ul>        <li><a href="/">200 OK (this page)</a></li>        <li><a href="/redirect">301 Moved Permanently</a></li>        <li><a href="/not-modified">304 Not Modified</a></li>        <li><a href="/bad-request">400 Bad Request</a></li>        <li><a href="/unauthorized">401 Unauthorized</a></li>        <li><a href="/forbidden">403 Forbidden</a></li>        <li><a href="/not-found">404 Not Found</a></li>        <li><a href="/server-error">500 Internal Server Error</a></li>      </ul>    `);  }  else if (path === '/redirect') {    // 301 Moved Permanently    res.writeHead(301, {      'Location': '/'    });    res.end();  }  else if (path === '/not-modified') {    // 304 Not Modified    res.writeHead(304);    res.end();  }  else if (path === '/bad-request') {    // 400 Bad Request    res.writeHead(400, 'Bad Request');    res.end(`      <h1>400 Bad Request</h1>      <p>The server could not understand the request due to invalid syntax.</p>      <p><a href="/">Go back to home</a></p>    `);  }  else if (path === '/unauthorized') {    // 401 Unauthorized    res.writeHead(401, {      'WWW-Authenticate': 'Basic realm="Access to the site"'    });    res.end(`      <h1>401 Unauthorized</h1>      <p>Authentication is required but was not provided.</p>      <p><a href="/">Go back to home</a></p>    `);  }  else if (path === '/forbidden') {    // 403 Forbidden    res.writeHead(403, 'Forbidden');    res.end(`      <h1>403 Forbidden</h1>      <p>The server understood the request but refuses to authorize it.</p>      <p><a href="/">Go back to home</a></p>    `);  }  else if (path === '/not-found') {    // 404 Not Found    res.writeHead(404, 'Not Found');    res.end(`      <h1>404 Not Found</h1>      <p>The requested resource could not be found on this server.</p>      <p><a href="/">Go back to home</a></p>    `);  }  else if (path === '/server-error') {    // 500 Internal Server Error    res.writeHead(500, 'Internal Server Error');    res.end(`      <h1>500 Internal Server Error</h1>      <p>The server has encountered a situation it doesn't know how to handle.</p>      <p><a href="/">Go back to home</a></p>    `);  }  else {    // Default: 404 Not Found    res.writeHead(404, 'Not Found');    res.end(`      <h1>404 Not Found</h1>      <p>The requested resource could not be found on this server.</p>      <p><a href="/">Go back to home</a></p>    `);  }});// Start the serverconst PORT = 8080;server.listen(PORT, () => {  console.log(`Server running at http://localhost:${PORT}/`);});
```

* * *

## Streaming Responses

Using the response object to stream data:

```javascript
const http = require('http');const fs = require('fs');const path = require('path');// Create an HTTP serverconst server = http.createServer((req, res) => {  const parsedUrl = new URL(req.url, 'http://localhost');  const pathname = parsedUrl.pathname;    // Handle different paths  if (pathname === '/') {    // Send a regular response    res.writeHead(200, {'Content-Type': 'text/html'});    res.end(`      <h1>Streaming Examples</h1>      <ul>        <li><a href="/stream-text">Stream a large text response</a></li>        <li><a href="/stream-file">Stream a file</a></li>        <li><a href="/stream-json">Stream a JSON response</a></li>      </ul>    `);  }  else if (pathname === '/stream-text') {    // Stream a large text response    res.writeHead(200, {'Content-Type': 'text/plain'});        let count = 1;    const max = 10;        // Write response in chunks with delay    const interval = setInterval(() => {      res.write(`Chunk ${count} of data\n`.repeat(20));            if (count >= max) {        clearInterval(interval);        res.end('\nStreaming complete!');      }      count++;    }, 500);        // Handle client disconnect    req.on('close', () => {      clearInterval(interval);      console.log('Client closed connection');    });  }  else if (pathname === '/stream-file') {    // Create a sample file    const filePath = path.join(__dirname, 'sample-large-file.txt');    if (!fs.existsSync(filePath)) {      const writeStream = fs.createWriteStream(filePath);      for (let i = 0; i < 10000; i++) {        writeStream.write(`Line ${i}: This is a sample line of text for streaming demonstration.\n`);      }      writeStream.end();    }        // Get file stats    const stat = fs.statSync(filePath);        // Set headers    res.writeHead(200, {      'Content-Type': 'text/plain',      'Content-Length': stat.size    });        // Create read stream and pipe to response    const fileStream = fs.createReadStream(filePath);    fileStream.pipe(res);        // Handle file stream errors    fileStream.on('error', (err) => {      console.error(`Error streaming file: ${err.message}`);      res.end('Error streaming file');    });        // Clean up after response is sent    res.on('finish', () => {      fs.unlink(filePath, (err) => {        if (err) console.error(`Error deleting sample file: ${err.message}`);      });    });  }  else if (pathname === '/stream-json') {    // Stream a large JSON response    res.writeHead(200, {'Content-Type': 'application/json'});        // Start JSON array    res.write('[\n');        let count = 0;    const max = 100;    let isFirst = true;        // Write JSON objects with delay    const interval = setInterval(() => {      // Add comma for all but first item      if (!isFirst) {        res.write(',\n');      } else {        isFirst = false;      }            // Create a JSON object      const obj = {        id: count,        name: `Item ${count}`,        timestamp: new Date().toISOString(),        data: `Sample data for item ${count}`      };            // Write the object as JSON      res.write(JSON.stringify(obj, null, 2));            if (count >= max) {        clearInterval(interval);        // End JSON array        res.write('\n]');        res.end();      }      count++;    }, 100);        // Handle client disconnect    req.on('close', () => {      clearInterval(interval);      console.log('Client closed connection during JSON streaming');    });  }  else {    // Handle unknown paths    res.writeHead(404, {'Content-Type': 'text/plain'});    res.end('Not Found');  }});// Start the serverconst PORT = 8080;server.listen(PORT, () => {  console.log(`Streaming server running at http://localhost:${PORT}/`);});
```

* * *

## Compression

Compressing responses with gzip or deflate:

```javascript
const http = require('http');const zlib = require('zlib');// Create an HTTP server with compressionconst server = http.createServer((req, res) => {  // Get the Accept-Encoding header  const acceptEncoding = req.headers['accept-encoding'] || '';    // Create a sample response (large string)  const sampleData = 'This is a sample text that will be compressed. '.repeat(1000);    // Function to send the response with appropriate headers  function sendResponse(data, encoding) {    // Set Content-Encoding header if compression is used    if (encoding) {      res.setHeader('Content-Encoding', encoding);    }        res.setHeader('Content-Type', 'text/plain');    res.setHeader('Vary', 'Accept-Encoding');    res.writeHead(200);    res.end(data);  }    // Check what encodings the client supports  if (/\bgzip\b/.test(acceptEncoding)) {    // Client supports gzip    console.log('Using gzip compression');    zlib.gzip(sampleData, (err, compressed) => {      if (err) {        console.error('Gzip compression failed:', err);        sendResponse(sampleData); // Fall back to uncompressed      } else {        sendResponse(compressed, 'gzip');        console.log(`Original size: ${sampleData.length}, Compressed size: ${compressed.length}`);        console.log(`Compression ratio: ${(compressed.length / sampleData.length * 100).toFixed(2)}%`);      }    });  } else if (/\bdeflate\b/.test(acceptEncoding)) {    // Client supports deflate    console.log('Using deflate compression');    zlib.deflate(sampleData, (err, compressed) => {      if (err) {        console.error('Deflate compression failed:', err);        sendResponse(sampleData); // Fall back to uncompressed      } else {        sendResponse(compressed, 'deflate');        console.log(`Original size: ${sampleData.length}, Compressed size: ${compressed.length}`);        console.log(`Compression ratio: ${(compressed.length / sampleData.length * 100).toFixed(2)}%`);      }    });  } else if (/\bbr\b/.test(acceptEncoding)) {    // Client supports Brotli (if Node.js version supports it)    if (typeof zlib.brotliCompress === 'function') {      console.log('Using Brotli compression');      zlib.brotliCompress(sampleData, (err, compressed) => {        if (err) {          console.error('Brotli compression failed:', err);          sendResponse(sampleData); // Fall back to uncompressed        } else {          sendResponse(compressed, 'br');          console.log(`Original size: ${sampleData.length}, Compressed size: ${compressed.length}`);          console.log(`Compression ratio: ${(compressed.length / sampleData.length * 100).toFixed(2)}%`);        }      });    } else {      console.log('Brotli not supported in this Node.js version');      sendResponse(sampleData); // Fall back to uncompressed    }  } else {    // No compression supported by client    console.log('No compression used');    sendResponse(sampleData);  }});// Start the serverconst PORT = 8080;server.listen(PORT, () => {  console.log(`Compression server running at http://localhost:${PORT}/`);});
```

* * *

## Best Practices

1.  **Always set Content-Type**: Always set the appropriate Content-Type header for your responses.
2.  **Use proper status codes**: Use appropriate HTTP status codes to indicate the result of the request.
3.  **Set proper headers**: Set appropriate headers like Cache-Control, Content-Length, etc.
4.  **Handle errors properly**: Return appropriate status codes (4xx, 5xx) with meaningful error messages.
5.  **Stream large responses**: For large responses, use streaming instead of loading everything into memory.
6.  **Implement compression**: Use compression for text-based responses to reduce bandwidth usage.
7.  **Security headers**: Include security headers like Content-Security-Policy, X-Content-Type-Options, etc.
8.  **Always end the response**: Always call `response.end()` to finalize the response.

* * *