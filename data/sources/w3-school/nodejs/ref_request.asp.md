# Node.js Request Reference

* * *

## HTTP Request Object

The HTTP Request object is created internally by Node.js and passed as the first parameter to the request event callback when making HTTP requests. It represents an incoming message from the client when used with HTTP servers, or an outgoing message when used with HTTP clients.

There are two main types of Request objects in Node.js:

*   `http.ClientRequest` - Created when making outgoing HTTP requests
*   `http.IncomingMessage` - Received by the server when handling client requests

* * *

## ClientRequest Object

The `http.ClientRequest` object is an instance of `Writable Stream` created when calling `http.request()` or `http.get()`. It represents an outgoing HTTP request that you send to a server.

### Creating a ClientRequest

```javascript
const http = require('http');// Create a client requestconst req = http.request({  hostname: 'example.com',  port: 80,  path: '/',  method: 'GET'}, (res) => {  // Handle response (IncomingMessage)  console.log(`Status: ${res.statusCode}`);});// End the requestreq.end();
```

* * *

## ClientRequest Properties

Property

Description

request.aborted

A boolean indicating if the request has been aborted.

request.connection

Reference to the underlying socket.

request.socket

Reference to the underlying socket. Alias of `request.connection`.

request.finished

A boolean indicating if the request has completed sending data.

request.path

The request path.

request.method

The request method (GET, POST, etc.).

request.host

The request host.

* * *

* * *

## ClientRequest Methods

Method

Description

request.abort()

Marks the request as aborted.

request.destroy(\[error\])

Destroys the request. Optionally emits the passed error.

request.end(\[data\[, encoding\]\]\[, callback\])

Finishes sending the request. If any parts of the body are unsent, it will flush them to the stream.

request.flushHeaders()

Flushes the request headers.

request.getHeader(name)

Gets the value of a header which has already been queued but not sent.

request.removeHeader(name)

Removes a header that's queued for sending.

request.setHeader(name, value)

Sets a single header value for headers object.

request.setNoDelay(\[noDelay\])

Sets the socket's `noDelay` option.

request.setSocketKeepAlive(\[enable\]\[, initialDelay\])

Sets the socket's `keepAlive` option.

request.setTimeout(timeout\[, callback\])

Sets the timeout value for the request.

request.write(chunk\[, encoding\]\[, callback\])

Sends a chunk of the body.

* * *

## ClientRequest Events

Event

Description

'abort'

Emitted when the request has been aborted.

'connect'

Emitted when a server responds to a request with a CONNECT method.

'continue'

Emitted when the server sends a '100 Continue' HTTP response.

'information'

Emitted when the server sends a 1xx response (excluding 101 Upgrade).

'response'

Emitted when a response is received to this request. This event is emitted only once.

'socket'

Emitted when a socket is assigned to this request.

'timeout'

Emitted when the request times out.

'upgrade'

Emitted when the server responds with an upgrade.

'close'

Emitted when the request is closed.

'error'

Emitted when an error occurs.

* * *

## IncomingMessage Object

The `http.IncomingMessage` object is created by an HTTP server and passed as the first argument to the 'request' event. It represents an incoming message, typically a request from a client or a response from a server.

### Accessing IncomingMessage on a Server

```javascript
const http = require('http');// Create HTTP serverconst server = http.createServer((req, res) => {  // 'req' is an IncomingMessage object  console.log(`Received ${req.method} request for ${req.url}`);  res.end('Hello World');});server.listen(8080);
```

* * *

## IncomingMessage Properties

Property

Description

message.headers

The request/response headers object.

message.httpVersion

The HTTP version sent by the client (e.g., '1.1', '1.0').

message.method

The request method as a string (only for request objects).

message.rawHeaders

The raw request/response headers list exactly as they were received.

message.rawTrailers

The raw request/response trailer keys and values exactly as they were received.

message.socket

The `net.Socket` object associated with the connection.

message.statusCode

The HTTP response status code (only for response objects).

message.statusMessage

The HTTP response status message (only for response objects).

message.trailers

The request/response trailer headers object.

message.url

The request URL string (only for request objects).

* * *

## IncomingMessage Methods

Method

Description

message.destroy(\[error\])

Destroys the message. Optionally emits the passed error.

message.setTimeout(msecs, callback)

Sets the socket's timeout value.

* * *

## Basic GET Request Example

A basic example using `http.get()` to make a GET request:

```javascript
const http = require('http');// Make a simple GET requesthttp.get('http://example.com', (res) => {  const { statusCode } = res;  const contentType = res.headers['content-type'];    console.log(`Status Code: ${statusCode}`);  console.log(`Content-Type: ${contentType}`);    let error;  if (statusCode !== 200) {    error = new Error(`Request Failed. Status Code: ${statusCode}`);  } else if (!/^text\/html/.test(contentType)) {    error = new Error(`Invalid content-type. Expected text/html but received ${contentType}`);  }    if (error) {    console.error(error.message);    // Consume response data to free up memory    res.resume();    return;  }    res.setEncoding('utf8');  let rawData = '';    // Collect response data as it arrives  res.on('data', (chunk) => { rawData += chunk; });    // Process the complete response  res.on('end', () => {    try {      console.log(`Response length: ${rawData.length} characters`);      console.log('First 100 characters:');      console.log(rawData.substring(0, 100) + '...');    } catch (e) {      console.error(e.message);    }  });}).on('error', (e) => {  console.error(`Got error: ${e.message}`);});
```

* * *

## POST Request Example

Making a POST request with data:

```javascript
const http = require('http');// Data to send in the POST requestconst postData = JSON.stringify({  'name': 'John Doe',  'email': 'john@example.com',  'message': 'Hello from Node.js HTTP client!'});// Request optionsconst options = {  hostname: 'postman-echo.com',  port: 80,  path: '/post',  method: 'POST',  headers: {    'Content-Type': 'application/json',    'Content-Length': Buffer.byteLength(postData)  }};// Create the requestconst req = http.request(options, (res) => {  console.log(`STATUS: ${res.statusCode}`);  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);    res.setEncoding('utf8');  let responseData = '';    res.on('data', (chunk) => {    responseData += chunk;  });    res.on('end', () => {    console.log('Response body:');        try {      // Try to parse as JSON      const parsedData = JSON.parse(responseData);      console.log(JSON.stringify(parsedData, null, 2));    } catch (e) {      // If not JSON, show as text      console.log(responseData);    }  });});req.on('error', (e) => {  console.error(`Problem with request: ${e.message}`);});// Write data to request bodyreq.write(postData);// End the requestreq.end();
```

* * *

## Handling Request Headers

Working with request headers:

```javascript
const http = require('http');// Create a server to demonstrate request headersconst server = http.createServer((req, res) => {  // Display request information  console.log(`Request received: ${req.method} ${req.url}`);  console.log(`HTTP Version: ${req.httpVersion}`);    // Display standard headers  console.log('\nStandard Headers:');  const stdHeaders = ['host', 'user-agent', 'accept', 'accept-language', 'content-type', 'content-length'];  stdHeaders.forEach(header => {    if (req.headers[header]) {      console.log(`${header}: ${req.headers[header]}`);    }  });    // Display raw headers (name-value pairs)  console.log('\nRaw Headers:');  for (let i = 0; i < req.rawHeaders.length; i += 2) {    console.log(`${req.rawHeaders[i]}: ${req.rawHeaders[i+1]}`);  }    // Create response  res.writeHead(200, {'Content-Type': 'text/html'});    // Send response with headers information  res.end(`    <!DOCTYPE html>    <html>    <head>    <title>Request Headers</title>    </head>    <body>      <h1>Your Request Headers</h1>      <pre>${JSON.stringify(req.headers, null, 2)}</pre>    </body>    </html>  `);});// Start serverconst PORT = 8080;server.listen(PORT, () => {  console.log(`Server running at http://localhost:${PORT}/`);    // Make a request to demonstrate headers  const req = http.request({    hostname: 'localhost',    port: PORT,    path: '/headers-demo',    method: 'GET',    headers: {      'User-Agent': 'Node.js HTTP Client',      'X-Custom-Header': 'Custom Value',      'Accept': 'text/html,application/json'    }  }, (res) => {    res.resume(); // Consume response data  });    req.on('error', (e) => {    console.error(`Demo request error: ${e.message}`);  });    req.end();});
```

* * *

## File Upload Example

Using a request to upload a file:

```javascript
const http = require('http');const fs = require('fs');const path = require('path');// Create a sample file for uploadconst sampleFile = path.join(__dirname, 'upload-sample.txt');fs.writeFileSync(sampleFile, 'This is a sample file for upload demonstration.\n'.repeat(10));// Function to create multipart form-data boundary and bodyfunction createMultipartFormData(fields, files) {  const boundary = `----NodeJSUploadExample${Math.random().toString(16).substr(2)}`;  let body = '';    // Add regular fields  Object.keys(fields).forEach(field => {    body += `--${boundary}\r\n`;    body += `Content-Disposition: form-data; name="${field}"\r\n\r\n`;    body += `${fields[field]}\r\n`;  });    // Add files  Object.keys(files).forEach(fileField => {    const filePath = files[fileField];    const filename = path.basename(filePath);    const fileContent = fs.readFileSync(filePath);        body += `--${boundary}\r\n`;    body += `Content-Disposition: form-data; name="${fileField}"; filename="${filename}"\r\n`;    body += `Content-Type: application/octet-stream\r\n\r\n`;    body += fileContent.toString() + '\r\n';  });    // Add final boundary  body += `--${boundary}--\r\n`;    return {    boundary,    body  };}// Prepare form dataconst formData = createMultipartFormData(  {    name: 'Node.js Upload Example',    description: 'Uploading a file using HTTP client request'  },  {    file: sampleFile  });// Request optionsconst options = {  hostname: 'httpbin.org',  port: 80,  path: '/post',  method: 'POST',  headers: {    'Content-Type': `multipart/form-data; boundary=${formData.boundary}`,    'Content-Length': Buffer.byteLength(formData.body)  }};// Create the requestconst req = http.request(options, (res) => {  console.log(`Upload Status: ${res.statusCode}`);    let responseData = '';  res.setEncoding('utf8');    res.on('data', (chunk) => {    responseData += chunk;  });    res.on('end', () => {    console.log('Upload Response:');    try {      const response = JSON.stringify(JSON.parse(responseData), null, 2);      console.log(response);    } catch (e) {      console.log(responseData);    }        // Clean up sample file    fs.unlinkSync(sampleFile);    console.log('Sample file removed');  });});req.on('error', (e) => {  console.error(`Upload error: ${e.message}`);});// Send the form datareq.write(formData.body);req.end();console.log('Uploading file...');
```

* * *

## Handling Request Timeouts

Setting and handling request timeouts:

```javascript
const http = require('http');// Create a request with timeoutconst req = http.request({  hostname: 'example.com',  port: 80,  path: '/',  method: 'GET',  timeout: 8080 // 3 second timeout}, (res) => {  console.log(`STATUS: ${res.statusCode}`);  res.resume(); // Consume response data});// Handle timeout eventreq.on('timeout', () => {  console.log('Request timed out after 3 seconds');  req.abort(); // Abort the request});// Handle errors, including those caused by abort()req.on('error', (err) => {  console.error(`Request error: ${err.message}`);});// End the requestreq.end();
```

* * *

## Best Practices

1.  **Error handling**: Always attach an error event handler to HTTP requests.
2.  **Consume response data**: Always consume response data, even if you don't need it, to prevent memory leaks.
3.  **Set timeouts**: Set appropriate timeouts to prevent hanging requests.
4.  **Content-Length**: Always specify Content-Length for POST/PUT requests to ensure data is sent correctly.
5.  **End the request**: Always call `request.end()` to finish sending the request.
6.  **Handle redirects**: Be aware that Node.js does not follow redirects automatically - you need to handle them.
7.  **Reuse connections**: Use a custom Agent with keepAlive for multiple requests to the same server.

* * *