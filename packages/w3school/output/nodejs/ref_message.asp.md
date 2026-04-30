# Node.js Message Reference

* * *

## HTTP Message Object

The `http.IncomingMessage` object is created by the `http.Server` or `http.ClientRequest` and passed as the first argument to the 'request' and 'response' event respectively. It is used to access response status, headers, and data.

This message object represents both:

*   The HTTP request received by the server (passed to the 'request' event)
*   The HTTP response received by the client (passed to the 'response' event)

It implements the `Readable Stream` interface, allowing you to consume the message body.

* * *

## Message Properties

Property

Description

message.complete

A boolean indicating if the entire message has been received and parsed.

message.headers

The request/response headers object.

message.httpVersion

The HTTP version sent by the client. Typically either '1.0' or '1.1'.

message.method

The request method as a string (e.g., 'GET', 'POST'). Only valid for request messages from http.Server.

message.rawHeaders

The raw request/response headers list exactly as they were received. The odd-numbered entries are key names, and the even-numbered entries are values.

message.rawTrailers

The raw request/response trailer keys and values exactly as they were received.

message.socket

The `net.Socket` object associated with the connection.

message.statusCode

The HTTP response status code. Only valid for response messages from http.ClientRequest.

message.statusMessage

The HTTP response status message. Only valid for response messages from http.ClientRequest.

message.trailers

The request/response trailer headers object.

message.url

The request URL string. Only valid for request messages from http.Server.

* * *

* * *

## Message Methods

Method

Description

message.destroy(\[error\])

Calls `destroy()` on the socket that received this message. If `error` is provided, an 'error' event is emitted and the error is passed as an argument.

message.setTimeout(msecs, callback)

Calls `socket.setTimeout(msecs, callback)`.

* * *

## Message as a Readable Stream

Because `http.IncomingMessage` implements the Readable Stream interface, it includes all stream methods like `read()`, `pipe()`, and events like 'data', 'end', and 'error'.

* * *

## Examples

### Server-side Message (Request)

This example demonstrates handling the IncomingMessage object on the server side:

```javascript
const http = require('http');const url = require('url');// Create an HTTP serverconst server = http.createServer((req, res) => {  // 'req' is the IncomingMessage object    // Basic message properties  console.log('HTTP Version:', req.httpVersion);  console.log('Method:', req.method);  console.log('URL:', req.url);    // Parse the URL  const parsedUrl = url.parse(req.url, true);  console.log('Pathname:', parsedUrl.pathname);  console.log('Query:', parsedUrl.query);    // Headers  console.log('Headers:', req.headers);  console.log('User-Agent:', req.headers['user-agent']);    // Raw headers with keys and values as separate array elements  console.log('Raw Headers:', req.rawHeaders);    // Socket information  console.log('Remote Address:', req.socket.remoteAddress);  console.log('Remote Port:', req.socket.remotePort);    // Reading the message body (if any)  let body = [];  req.on('data', (chunk) => {    body.push(chunk);  });    req.on('end', () => {    body = Buffer.concat(body).toString();    console.log('Request body:', body);        // Now that we have the body, send a response    res.writeHead(200, { 'Content-Type': 'application/json' });    res.end(JSON.stringify({      httpVersion: req.httpVersion,      method: req.method,      url: req.url,      headers: req.headers,      body: body || null    }));  });    // Handle errors  req.on('error', (err) => {    console.error('Request error:', err);    res.statusCode = 400;    res.end('Error: ' + err.message);  });});// Start serverconst PORT = 8080;server.listen(PORT, () => {  console.log(`Server running at http://localhost:${PORT}/`);    // Make a test request  http.request({    hostname: 'localhost',    port: PORT,    path: '/test?param1=value1¶m2=value2',    method: 'POST',    headers: {      'Content-Type': 'application/json',      'Custom-Header': 'Custom Value'    }  }, (res) => {    res.resume(); // Consume response data  }).end('{"message":"Hello from the client!"}');});
```

* * *

### Client-side Message (Response)

This example demonstrates handling the IncomingMessage object on the client side:

```javascript
const http = require('http');// Make an HTTP requestconst req = http.request('http://example.com', (res) => {  // 'res' is the IncomingMessage object (response)    // Basic message properties  console.log('Status Code:', res.statusCode);  console.log('Status Message:', res.statusMessage);  console.log('HTTP Version:', res.httpVersion);    // Headers  console.log('Headers:', res.headers);  console.log('Content-Type:', res.headers['content-type']);  console.log('Raw Headers:', res.rawHeaders);    // Socket information  console.log('Remote Address:', res.socket.remoteAddress);  console.log('Remote Port:', res.socket.remotePort);    // Reading the message body  let body = [];    // Data events emit when chunks of the body are received  res.on('data', (chunk) => {    body.push(chunk);    console.log('Received chunk of', chunk.length, 'bytes');  });    // End event is emitted when the entire body has been received  res.on('end', () => {    body = Buffer.concat(body).toString();    console.log('Body length:', body.length);    console.log('Body preview:', body.substring(0, 100) + '...');        // Check trailers (if any)    console.log('Trailers:', res.trailers);    console.log('Raw Trailers:', res.rawTrailers);        // Check if message is complete    console.log('Message complete:', res.complete);  });    // Handle message errors  res.on('error', (err) => {    console.error('Response error:', err);  });});// Handle request errorsreq.on('error', (err) => {  console.error('Request error:', err);});// End the requestreq.end();
```

* * *

### Handling Message Body with Streams

This example demonstrates using stream methods to handle a message body:

```javascript
const http = require('http');const fs = require('fs');const path = require('path');// Create a server to handle file uploadsconst server = http.createServer((req, res) => {  if (req.method === 'POST' && req.url === '/upload') {    // Create a write stream to a file    const filePath = path.join(__dirname, 'uploaded-file.txt');    const fileStream = fs.createWriteStream(filePath);        // Pipe the request body directly to the file    req.pipe(fileStream);        // Handle completion    fileStream.on('finish', () => {      // Get file stats to check size      fs.stat(filePath, (err, stats) => {        if (err) {          console.error('Error getting file stats:', err);          res.writeHead(500, {'Content-Type': 'text/plain'});          res.end('Error processing upload');          return;        }                // Send response        res.writeHead(200, {'Content-Type': 'application/json'});        res.end(JSON.stringify({          success: true,          message: 'File uploaded successfully',          size: stats.size,          path: filePath        }));                console.log(`File uploaded to ${filePath}`);        console.log(`File size: ${stats.size} bytes`);                // Clean up the file after a delay        setTimeout(() => {          fs.unlink(filePath, (err) => {            if (err) console.error('Error removing uploaded file:', err);            else console.log('Uploaded file removed');          });        }, 5000);      });    });        // Handle errors    fileStream.on('error', (err) => {      console.error('File write error:', err);      res.writeHead(500, {'Content-Type': 'text/plain'});      res.end('Error saving file');    });        req.on('error', (err) => {      console.error('Request error:', err);      fileStream.destroy(err);    });  }  else if (req.method === 'GET' && req.url === '/') {    // Provide a simple HTML form for uploading    res.writeHead(200, {'Content-Type': 'text/html'});    res.end(`      <!DOCTYPE html>      <html>      <head>        <title>File Upload Example</title>      </head>      <body>        <h1>Upload a Text File</h1>        <form action="/upload" method="post" enctype="multipart/form-data">          <input type="file" name="file" accept=".txt">          <button type="submit">Upload</button>        </form>        <p>Note: This is a simple example. A real implementation would need to parse multipart form data.</p>      </body>      </html>    `);  }  else {    // Handle all other requests    res.writeHead(404, {'Content-Type': 'text/plain'});    res.end('Not Found');  }});// Start serverconst PORT = 8080;server.listen(PORT, () => {  console.log(`Server running at http://localhost:${PORT}/`);    // Make a test upload  setTimeout(() => {    const req = http.request({      hostname: 'localhost',      port: PORT,      path: '/upload',      method: 'POST',      headers: {        'Content-Type': 'text/plain'      }    }, (res) => {      let data = '';      res.on('data', (chunk) => { data += chunk; });      res.on('end', () => {        console.log('Upload response:', data);      });    });        req.on('error', (e) => {      console.error('Test request error:', e.message);    });        // Write some content to upload    req.write('This is a test file content uploaded using http.request.\n');    req.write('It demonstrates streaming data to the server.\n');    req.end();  }, 1000);});
```

* * *

### Handling Message Trailers

This example demonstrates handling HTTP trailers (headers that come after the message body):

```javascript
const http = require('http');const zlib = require('zlib');// Create an HTTP server that sends trailersconst server = http.createServer((req, res) => {  // Inform the client we'll be sending trailers  res.writeHead(200, {    'Content-Type': 'text/plain',    'Transfer-Encoding': 'chunked', // Required for trailers    'Trailer': 'Content-MD5, X-Response-Time' // Declare which trailers will be sent  });    // Write some response data  res.write('Beginning of the response\n');    // Simulate processing time  setTimeout(() => {    res.write('Middle of the response\n');        setTimeout(() => {      // Final part of the body      res.write('End of the response\n');            // Add trailers      res.addTrailers({        'Content-MD5': 'e4e68fb7bd0e697a0ae8f1bb342846d3', // Would normally be the hash of the body        'X-Response-Time': `${Date.now() - req.start}ms` // Processing time      });            // End the response      res.end();    }, 500);  }, 500);});// Track request start timeserver.on('request', (req) => {  req.start = Date.now();});// Start serverconst PORT = 8080;server.listen(PORT, () => {  console.log(`Server running at http://localhost:${PORT}/`);    // Make a request to test trailers  http.get(`http://localhost:${PORT}`, (res) => {    console.log('Response status:', res.statusCode);    console.log('Response headers:', res.headers);        // Check if trailers are declared    if (res.headers.trailer) {      console.log('Trailer headers declared:', res.headers.trailer);    }        // Read the response body    let body = '';        res.on('data', (chunk) => {      body += chunk;      console.log('Received chunk:', chunk.toString());    });        // The 'end' event is emitted when the entire body has been received    res.on('end', () => {      console.log('Complete response body:', body);      console.log('Trailers received:', res.trailers);            // Server should close after test is complete      server.close();    });  }).on('error', (err) => {    console.error('Request error:', err);  });});
```

* * *

### Handling Large Messages with Flow Control

This example demonstrates handling large message bodies with flow control:

```javascript
const http = require('http');// Create a server to handle large uploads with flow controlconst server = http.createServer((req, res) => {  if (req.method === 'POST' && req.url === '/large-upload') {    // Set up variables to track data    let dataSize = 0;    let chunks = 0;        // Switch to pause mode (by default it's in flowing mode)    req.pause();        console.log('Incoming large upload - using flow control');        // Process data in chunks    function processNextChunk() {      // Resume the stream to get more data      req.resume();            // Set a timeout to pause after a bit      setTimeout(() => {        // Pause the stream again        req.pause();                console.log(`Processed chunk ${++chunks}, total ${dataSize} bytes so far`);                // If there's more data to process, schedule the next chunk        // Otherwise, wait for 'end' event to finish        if (!req.complete) {          // Schedule next chunk processing          setTimeout(processNextChunk, 100);        }      }, 100); // Process for 100ms, then pause    }        // Listen for data events    req.on('data', (chunk) => {      dataSize += chunk.length;    });        // Handle request end    req.on('end', () => {      console.log(`Upload complete: ${dataSize} bytes received in ${chunks} chunks`);            // Send a response      res.writeHead(200, {'Content-Type': 'application/json'});      res.end(JSON.stringify({        success: true,        bytesReceived: dataSize,        chunks: chunks      }));    });        // Handle errors    req.on('error', (err) => {      console.error('Request error:', err);            res.writeHead(500, {'Content-Type': 'text/plain'});      res.end('Error processing upload: ' + err.message);    });        // Start processing    processNextChunk();  }  else {    // Handle other requests    res.writeHead(404, {'Content-Type': 'text/plain'});    res.end('Not Found');  }});// Start serverconst PORT = 8080;server.listen(PORT, () => {  console.log(`Server running at http://localhost:${PORT}/`);    // Create a test client to simulate large upload  console.log('Simulating large upload...');    const req = http.request({    hostname: 'localhost',    port: PORT,    path: '/large-upload',    method: 'POST',    headers: {      'Content-Type': 'application/octet-stream'    }  }, (res) => {    // Handle response    let responseData = '';        res.on('data', (chunk) => {      responseData += chunk;    });        res.on('end', () => {      console.log('Server response:', responseData);            // Close the server after the test      server.close();    });  });    req.on('error', (err) => {    console.error('Upload request error:', err);  });    // Generate and send a large body in chunks  function sendChunk(i, total) {    if (i >= total) {      // All chunks sent, end the request      req.end();      return;    }        // Create a 10KB chunk    const chunk = Buffer.alloc(10240);    chunk.fill(65 + (i % 26)); // Fill with repeating letters        // Write the chunk    const canContinue = req.write(chunk);        // Log progress    if (i % 10 === 0) {      console.log(`Sent chunk ${i}/${total} (${i * 10240} bytes)`);    }        // If we can continue writing, schedule next chunk    if (canContinue) {      // Schedule next chunk      setImmediate(() => sendChunk(i + 1, total));    } else {      // If backpressure is applied, wait for drain event      console.log('Backpressure applied, waiting for drain');      req.once('drain', () => {        console.log('Drained, continuing upload');        sendChunk(i + 1, total);      });    }  }    // Start sending chunks (50 chunks = ~500KB)  sendChunk(0, 50);});
```

* * *

## Best Practices

1.  **Check for complete messages**: Use `message.complete` to ensure the entire message has been received.
2.  **Handle errors**: Always listen for the 'error' event on message objects.
3.  **Flow control**: For large messages, use `pause()` and `resume()` to control data flow.
4.  **Stream processing**: Use stream methods like `pipe()` for efficient processing of message bodies.
5.  **Memory management**: For large messages, process data in chunks rather than loading the entire message into memory.
6.  **URL parsing**: Use the `url` module to parse URL strings from `request.url`.
7.  **Header handling**: Be aware that HTTP headers are case-insensitive, but Node.js converts them to lowercase.

* * *