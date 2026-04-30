# Node.js HTTP/2 Module

* * *

## What is HTTP/2?

The Node.js HTTP/2 module provides an implementation of the HTTP/2 protocol, offering improved performance, server push capabilities, header compression, and multiplexing over a single connection.

HTTP/2 improves upon HTTP/1.1 with several key features:

*   **Binary protocol**: HTTP/2 uses a binary format for data transfer rather than the text format of HTTP/1.1, making it more efficient to parse.
*   **Multiplexing**: Multiple requests and responses can be sent over a single connection simultaneously.
*   **Header compression**: HTTP/2 compresses headers to reduce overhead.
*   **Server push**: Servers can proactively send resources to clients before they request them.
*   **Stream prioritization**: Resources can be delivered with different priorities.

* * *

## Using the HTTP/2 Module

In Node.js, the HTTP/2 module can be accessed using:

```javascript
const http2 = require('http2');
```

The HTTP/2 module is stable as of Node.js v10.0.0. It's important to note that HTTP/2 requires a secure connection (HTTPS) in most browsers, so most examples will use TLS/SSL.

* * *

## Creating an HTTP/2 Server

Here's an example of creating a basic HTTP/2 server using TLS:

```javascript
const http2 = require('http2');const fs = require('fs');const path = require('path');// Read the TLS certificate and keyconst options = {  key: fs.readFileSync(path.join(__dirname, 'server.key')),  cert: fs.readFileSync(path.join(__dirname, 'server.crt'))};// Create an HTTP/2 serverconst server = http2.createSecureServer(options);// Handle stream eventsserver.on('stream', (stream, headers) => {  // Get the path from headers  const path = headers[':path'];    // Send a response  if (path === '/') {    stream.respond({      'content-type': 'text/html',      ':status': 200    });    stream.end('<h1>Hello from HTTP/2!</h1>');  } else {    stream.respond({      ':status': 404    });    stream.end('Not found');  }});// Start the serverconst port = 8080;server.listen(port, () => {  console.log(`HTTP/2 server running at https://localhost:${port}`);});
```

This example assumes you have TLS certificate files. For development, you can generate self-signed certificates using OpenSSL. For production, use a trusted certificate authority.

You can also create an HTTP/2 server without TLS (for direct HTTP/2 connections without encryption):

```javascript
const http2 = require('http2');// Create an HTTP/2 server without TLSconst server = http2.createServer();server.on('stream', (stream, headers) => {  stream.respond({    'content-type': 'text/html',    ':status': 200  });  stream.end('<h1>Hello from HTTP/2 without TLS!</h1>');});server.listen(8080);
```

Most modern browsers only support HTTP/2 over TLS, so the insecure HTTP/2 server will typically only work with dedicated HTTP/2 clients that explicitly support cleartext HTTP/2.

* * *

* * *

## HTTP/2 Client

Creating an HTTP/2 client to connect to an HTTP/2 server:

```javascript
const http2 = require('http2');// Create a clientconst client = http2.connect('https://localhost:8080', {  // For self-signed certificates in development  rejectUnauthorized: false});// Error handlingclient.on('error', (err) => {  console.error('Client error:', err);});// Create a requestconst req = client.request({ ':path': '/' });// Handle response datareq.on('response', (headers) => {  console.log('Status:', headers[':status']);  console.log('Headers:', headers);});req.on('data', (chunk) => {  console.log('Received data:', chunk.toString());});req.on('end', () => {  console.log('Request completed');  client.close();});// Send the requestreq.end();
```

* * *

## HTTP/2 Streams

HTTP/2 uses streams for communication between client and server. Each stream represents an independent, bidirectional sequence of frames exchanged between the client and server.

### Stream Events

Important stream events include:

*   `'headers'`: Emitted when headers are received
*   `'data'`: Emitted when a chunk of data is received
*   `'end'`: Emitted when the stream is finished
*   `'error'`: Emitted when an error occurs

```javascript
const http2 = require('http2');const fs = require('fs');const path = require('path');// Create a serverconst server = http2.createSecureServer({  key: fs.readFileSync(path.join(__dirname, 'server.key')),  cert: fs.readFileSync(path.join(__dirname, 'server.crt'))});server.on('stream', (stream, headers) => {  // Handle stream events  stream.on('error', (error) => {    console.error('Stream error:', error);  });    stream.on('close', () => {    console.log('Stream closed');  });    // Handle request  stream.respond({    'content-type': 'text/plain',    ':status': 200  });    // Send data in multiple chunks  stream.write('First chunk of data\n');    setTimeout(() => {    stream.write('Second chunk of data\n');    stream.end('Final chunk of data');  }, 1000);});server.listen(8080);
```

* * *

## HTTP/2 Server Push

Server push allows the server to proactively send resources to the client before they are explicitly requested. This can improve performance by eliminating round-trip delays.

```javascript
const http2 = require('http2');const fs = require('fs');const path = require('path');const options = {  key: fs.readFileSync(path.join(__dirname, 'server.key')),  cert: fs.readFileSync(path.join(__dirname, 'server.crt'))};const server = http2.createSecureServer(options);server.on('stream', (stream, headers) => {  const requestPath = headers[':path'];    if (requestPath === '/') {    // Push CSS and JavaScript resources    stream.pushStream({ ':path': '/style.css' }, (err, pushStream) => {      if (err) {        console.error('Error pushing stream:', err);        return;      }            pushStream.respond({        'content-type': 'text/css',        ':status': 200      });            pushStream.end('body { color: blue; }');    });        stream.pushStream({ ':path': '/script.js' }, (err, pushStream) => {      if (err) {        console.error('Error pushing stream:', err);        return;      }            pushStream.respond({        'content-type': 'application/javascript',        ':status': 200      });            pushStream.end('console.log("Hello from HTTP/2 server push!");');    });        // Send the main HTML document    stream.respond({      'content-type': 'text/html',      ':status': 200    });        stream.end(`      <!DOCTYPE html>      <html>      <head>        <title>HTTP/2 Server Push Example</title>        <link rel="stylesheet" href="/style.css">        <script src="/script.js"></script>      </head>      <body>        <h1>HTTP/2 Server Push Demo</h1>        <p>CSS and JavaScript were pushed by the server!</p>      </body>    </html>    `);  } else {    // Serve pushed resources if requested directly    if (requestPath === '/style.css') {      stream.respond({        'content-type': 'text/css',        ':status': 200      });      stream.end('body { color: blue; }');    } else if (requestPath === '/script.js') {      stream.respond({        'content-type': 'application/javascript',        ':status': 200      });      stream.end('console.log("Hello from HTTP/2 server push!");');    } else {      // Not found      stream.respond({ ':status': 404 });      stream.end('Not found');    }  }});server.listen(8080);
```

* * *

## HTTP/2 Headers

HTTP/2 uses a different format for headers. Notably, all headers are lowercase, and request pseudo-headers start with a colon (:).

```javascript
const http2 = require('http2');// HTTP/2 pseudo-headersconst {  HTTP2_HEADER_METHOD,  HTTP2_HEADER_PATH,  HTTP2_HEADER_AUTHORITY,  HTTP2_HEADER_SCHEME,  HTTP2_HEADER_STATUS} = http2.constants;// Create a clientconst client = http2.connect('https://localhost:8080', {  rejectUnauthorized: false});// Send a request with custom headersconst req = client.request({  [HTTP2_HEADER_METHOD]: 'GET',  [HTTP2_HEADER_PATH]: '/',  [HTTP2_HEADER_AUTHORITY]: 'localhost:8080',  [HTTP2_HEADER_SCHEME]: 'https',  'user-agent': 'node-http2/client',  'custom-header': 'custom-value'});req.on('response', (headers) => {  console.log('Response status:', headers[HTTP2_HEADER_STATUS]);  console.log('Response headers:', headers);});req.on('data', (chunk) => {  console.log('Received data:', chunk.toString());});req.on('end', () => {  client.close();});req.end();
```

* * *

## HTTP/2 Settings

HTTP/2 allows configuring various protocol settings:

```javascript
const http2 = require('http2');const fs = require('fs');const path = require('path');const options = {  key: fs.readFileSync(path.join(__dirname, 'server.key')),  cert: fs.readFileSync(path.join(__dirname, 'server.crt')),    // HTTP/2 settings  settings: {    // Max concurrent streams per connection    maxConcurrentStreams: 100,        // Initial window size for flow control    initialWindowSize: 1024 * 1024, // 1MB        // Enable server push    enablePush: true  }};const server = http2.createSecureServer(options);server.on('stream', (stream, headers) => {  stream.respond({    'content-type': 'text/html',    ':status': 200  });    stream.end('<h1>HTTP/2 Server with Custom Settings</h1>');});server.listen(8080);
```

* * *

## Compatibility with HTTP/1.1

HTTP/2 servers can also handle HTTP/1.1 requests, providing a seamless upgrade path:

```javascript
const http2 = require('http2');const http = require('http');const fs = require('fs');const path = require('path');// For HTTP/2 secure serverconst options = {  key: fs.readFileSync(path.join(__dirname, 'server.key')),  cert: fs.readFileSync(path.join(__dirname, 'server.crt')),  allowHTTP1: true // Allow HTTP/1.1 connections};const server = http2.createSecureServer(options);// Handler function for both HTTP/1.1 and HTTP/2const handler = (req, res) => {  res.writeHead(200, { 'Content-Type': 'text/plain' });  res.end(`Hello from ${req.httpVersion} server!`);};// HTTP/1.1 compatibility request handlerserver.on('request', handler);// HTTP/2 specific stream handlerserver.on('stream', (stream, headers) => {  stream.respond({    'content-type': 'text/plain',    ':status': 200  });  stream.end(`Hello from HTTP/2 stream API!`);});server.listen(8080, () => {  console.log('Server running at https://localhost:8080/');});
```

* * *

## Performance Considerations

While HTTP/2 offers performance improvements, it's important to optimize your usage:

1.  **Connection Reuse** - With HTTP/2, you should aim to use a single connection for multiple requests, rather than creating new connections.
2.  **Proper Stream Management** - Remember to close streams when they're no longer needed, and monitor the number of concurrent streams.
3.  **Server Push Strategy** - Only push resources that are likely to be needed. Excessive pushing can waste bandwidth and resources.
4.  **Header Compression** - Take advantage of HTTP/2's header compression by minimizing the number and size of custom headers.

* * *

## HTTP/2 vs HTTP/1.1

Key differences between HTTP/2 and HTTP/1.1:

Feature

HTTP/1.1

HTTP/2

Protocol Format

Text-based

Binary-based

Multiplexing

No (requires multiple connections)

Yes (multiple streams over one connection)

Header Compression

None

Yes (HPACK)

Server Push

No

Yes

Flow Control

Basic

Advanced, per-stream

Prioritization

No

Yes

* * *

## Real-World Example: Serving a Complete Website

A complete example of serving a website with HTTP/2:

```javascript
const http2 = require('http2');const fs = require('fs');const path = require('path');const mime = require('mime-types');const options = {  key: fs.readFileSync(path.join(__dirname, 'server.key')),  cert: fs.readFileSync(path.join(__dirname, 'server.crt'))};const server = http2.createSecureServer(options);// Serve files from the public directoryconst publicDir = path.join(__dirname, 'public');server.on('stream', (stream, headers) => {  const reqPath = headers[':path'] === '/' ? '/index.html' : headers[':path'];  const filePath = path.join(publicDir, reqPath);    // Basic security check to prevent path traversal  if (!filePath.startsWith(publicDir)) {    stream.respond({ ':status': 403 });    stream.end('Forbidden');    return;  }    fs.stat(filePath, (err, stats) => {    if (err || !stats.isFile()) {      // File not found      stream.respond({ ':status': 404 });      stream.end('Not found');      return;    }        // Determine content type    const contentType = mime.lookup(filePath) || 'application/octet-stream';        // Serve the file    stream.respond({      'content-type': contentType,      ':status': 200    });        const fileStream = fs.createReadStream(filePath);    fileStream.pipe(stream);        fileStream.on('error', (err) => {      console.error('File stream error:', err);      stream.close(http2.constants.NGHTTP2_INTERNAL_ERROR);    });  });});server.listen(8080, () => {  console.log('HTTP/2 server running at https://localhost:8080/');});
```

This example requires the mime-types package:

```javascript
npm install mime-types
```

* * *

## Advanced Stream Management

HTTP/2's stream management capabilities allow for efficient handling of multiple concurrent requests. Here's an advanced example demonstrating stream prioritization and flow control:

```javascript
const http2 = require('http2');const fs = require('fs');// Create a server with custom settingsconst server = http2.createSecureServer({  key: fs.readFileSync('server.key'),  cert: fs.readFileSync('server.crt'),  settings: {    initialWindowSize: 65535,  // 64KB initial window    maxConcurrentStreams: 100,    enablePush: true  }});server.on('stream', (stream, headers) => {  // Get priority information  const weight = stream.priority && stream.priority.weight || 1;  const parent = stream.priority && stream.priority.parent ? 'with parent' : 'no parent';    console.log(`New stream ${stream.id} (weight: ${weight}, ${parent})`);    // Handle different priority levels  if (headers[':path'] === '/high-priority') {    stream.priority({ weight: 256, exclusive: true });    stream.respond({ ':status': 200, 'content-type': 'text/plain' });    stream.end('High priority content');  } else {    // Default priority    stream.respond({ ':status': 200, 'content-type': 'text/plain' });    stream.end('Standard priority content');  }    // Handle stream errors  stream.on('error', (error) => {    console.error(`Stream ${stream.id} error:`, error);    stream.end();  });    // Handle stream close  stream.on('close', () => {    console.log(`Stream ${stream.id} closed`);  });});server.listen(8443);
```

* * *

## Error Handling and Debugging

Proper error handling is crucial for reliable HTTP/2 applications. Here's how to implement comprehensive error handling:

```javascript
const http2 = require('http2');const fs = require('fs');const { promisify } = require('util');const readFile = promisify(fs.readFile);async function startServer() {  try {    const [key, cert] = await Promise.all([      readFile('server.key'),      readFile('server.crt')    ]);    const server = http2.createSecureServer({ key, cert });        // Global error handler    server.on('error', (err) => {      console.error('Server error:', err);      // Implement proper error recovery    });        // Handle uncaught exceptions    process.on('uncaughtException', (err) => {      console.error('Uncaught exception:', err);      // Graceful shutdown      server.close(() => process.exit(1));    });        // Handle unhandled promise rejections    process.on('unhandledRejection', (reason, promise) => {      console.error('Unhandled Rejection at:', promise, 'reason:', reason);    });        // Stream handler with error boundaries    server.on('stream', (stream, headers) => {      try {        // Simulate async operation        setTimeout(() => {          try {            if (Math.random() > 0.8) {              throw new Error('Random error for demonstration');            }            stream.respond({ ':status': 200 });            stream.end('Success!');          } catch (err) {            handleStreamError(stream, err);          }        }, 100);      } catch (err) {        handleStreamError(stream, err);      }    });        function handleStreamError(stream, error) {      console.error('Stream error:', error);      if (!stream.destroyed) {        stream.respond({          ':status': 500,          'content-type': 'text/plain'        });        stream.end('Internal Server Error');      }    }        server.listen(8443, () => {      console.log('Server running on https://localhost:8443');    });      } catch (err) {    console.error('Failed to start server:', err);    process.exit(1);  }}startServer();
```

* * *

## Performance Optimization

Optimizing HTTP/2 performance requires understanding its unique characteristics. Here are key strategies:

### 1\. Connection Pooling

```javascript
const http2 = require('http2');const { URL } = require('url');class HTTP2ConnectionPool {  constructor() {    this.connections = new Map();  }    async getConnection(url) {    const { origin } = new URL(url);        if (!this.connections.has(origin)) {      const client = http2.connect(origin, {        rejectUnauthorized: false // Only for development      });            // Handle connection errors      client.on('error', (err) => {        console.error('Connection error:', err);        this.connections.delete(origin);      });            // Remove connection when closed      client.on('close', () => {        this.connections.delete(origin);      });            this.connections.set(origin, {        client,        lastUsed: Date.now(),        inUse: 0      });    }        const conn = this.connections.get(origin);    conn.lastUsed = Date.now();    conn.inUse++;        return {      client: conn.client,      release: () => {        conn.inUse--;      }    };  }    // Clean up idle connections  startCleanup(interval = 30000) {    setInterval(() => {      const now = Date.now();      for (const [origin, conn] of this.connections.entries()) {        if (conn.inUse === 0 && (now - conn.lastUsed) > 60000) {          conn.client.destroy();          this.connections.delete(origin);        }      }    }, interval);  }}// Usage exampleconst pool = new HTTP2ConnectionPool();pool.startCleanup();async function makeRequest(url) {  const { client, release } = await pool.getConnection(url);  return new Promise((resolve, reject) => {    const req = client.request({ ':path': new URL(url).pathname });    let data = '';        req.on('response', (headers) => {      console.log('Status:', headers[':status']);    });        req.on('data', (chunk) => data += chunk);    req.on('end', () => {      release();      resolve(data);    });    req.on('error', (err) => {      release();      reject(err);    });        req.end();  });}
```

### 2\. Header Compression Optimization

HTTP/2 uses HPACK compression for headers. Optimize by:

*   Minimizing cookie sizes
*   Using short but descriptive header names
*   Avoiding duplicate headers
*   Using HTTP/2-specific headers when possible

* * *

## Security Best Practices

When using HTTP/2, follow these security practices:

```javascript
const http2 = require('http2');const fs = require('fs');const { createSecureContext } = require('tls');// Security headers middlewarefunction securityHeaders(req, res, next) {  // Set security headers  res.setHeader('X-Content-Type-Options', 'nosniff');  res.setHeader('X-Frame-Options', 'DENY');  res.setHeader('X-XSS-Protection', '1; mode=block');  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');  res.setHeader('Content-Security-Policy', "default-src 'self'");    // Remove server header  res.removeHeader('X-Powered-By');    next();}// Create secure server with modern TLS settingsconst options = {  key: fs.readFileSync('server.key'),  cert: fs.readFileSync('server.crt'),  secureOptions:    require('constants').SSL_OP_NO_SSLv3 |    require('constants').SSL_OP_NO_TLSv1 |    require('constants').SSL_OP_NO_TLSv1_1,  ciphers: [    'TLS_AES_256_GCM_SHA384',    'TLS_CHACHA20_POLY1305_SHA256',    'TLS_AES_128_GCM_SHA256'  ].join(':'),  minVersion: 'TLSv1.3',  maxVersion: 'TLSv1.3',  // OCSP Stapling  requestCert: false,  rejectUnauthorized: true};const server = http2.createSecureServer(options);// Apply security middlewareserver.on('request', (req, res) => {  securityHeaders(req, res, () => {    // Request handling logic    res.setHeader('Content-Type', 'text/plain');    res.end('Secure HTTP/2 Response');  });});// Handle TLS errorsserver.on('tlsClientError', (err, tlsSocket) => {  console.error('TLS Error:', err);  tlsSocket.destroy();});server.listen(8443);
```

* * *

## Real-World Use Cases

### 1\. API Gateway with HTTP/2

Building a high-performance API gateway with HTTP/2:

```javascript
const http2 = require('http2');const { URL } = require('url');const path = require('path');const fs = require('fs');// Service registryconst services = {  '/users': 'http://users-service:3000',  '/products': 'http://products-service:3000',  '/orders': 'http://orders-service:3000'};// Create HTTP/2 serverconst server = http2.createSecureServer({  key: fs.readFileSync('server.key'),  cert: fs.readFileSync('server.crt')});// Route requests to appropriate servicesserver.on('stream', (stream, headers) => {  const path = headers[':path'];  const method = headers[':method'];    try {    // Find matching service    const servicePath = Object.keys(services).find(prefix =>      path.startsWith(prefix)    );        if (!servicePath) {      stream.respond({ ':status': 404 });      return stream.end('Not Found');    }        const targetUrl = new URL(path.slice(servicePath.length), services[servicePath]);        // Forward request to target service    const client = http2.connect(targetUrl.origin);    const req = client.request({      ...headers,      ':path': targetUrl.pathname + targetUrl.search,      ':method': method,      ':authority': targetUrl.host    });        // Pipe the response back to client    req.pipe(stream);    stream.pipe(req);        // Handle errors    req.on('error', (err) => {      console.error('Request error:', err);      if (!stream.destroyed) {        stream.respond({ ':status': 502 });        stream.end('Bad Gateway');      }    });        stream.on('error', (err) => {      console.error('Stream error:', err);      req.destroy();    });      } catch (err) {    console.error('Gateway error:', err);    if (!stream.destroyed) {      stream.respond({ ':status': 500 });      stream.end('Internal Server Error');    }  }});server.listen(443);
```

### 2\. Real-Time Data Streaming

Efficient real-time data streaming with HTTP/2:

```javascript
const http2 = require('http2');const fs = require('fs');const server = http2.createSecureServer({  key: fs.readFileSync('server.key'),  cert: fs.readFileSync('server.crt')});// In-memory storage for active streamsconst streams = new Set();// Broadcast data to all connected clientsfunction broadcast(data) {  const payload = JSON.stringify(data);  for (const stream of streams) {    try {      stream.write(`data: ${payload}\n\n`);    } catch (err) {      console.error('Stream write error:', err);      streams.delete(stream);    }  }}// Simulate data updatessetInterval(() => {  broadcast({    time: new Date().toISOString(),    value: Math.random() * 100  });}, 1000);server.on('stream', (stream, headers) => {  // Only handle GET requests  if (headers[':method'] !== 'GET') {    stream.respond({ ':status': 405 });    return stream.end();  }    // Set up Server-Sent Events headers  stream.respond({    'content-type': 'text/event-stream',    'cache-control': 'no-cache',    'connection': 'keep-alive',    ':status': 200  });    // Add to active streams  streams.add(stream);    // Handle client disconnect  stream.on('close', () => {    streams.delete(stream);  });    // Send initial data  stream.write('event: connect\ndata: Connected\n\n');});server.listen(8443, () => {  console.log('HTTP/2 Server running on https://localhost:8443');});
```

* * *

* * *