# Node.js Socket Reference

* * *

## Socket Object

The Socket class is a duplex stream that allows for reading and writing data across network connections. It is used for both client and server connections in Node.js's `net` module.

A Socket represents a TCP or IPC connection to a remote endpoint, providing methods and events for managing the connection lifecycle and transferring data.

### Import Net Module

```javascript
// Import the net moduleconst net = require('net');// Create a Socketconst socket = new net.Socket();
```

* * *

## Socket Properties

Property

Description

socket.bufferSize

The number of bytes in the write buffer that have not yet been sent.

socket.bytesRead

The number of bytes received by the socket.

socket.bytesWritten

The number of bytes sent by the socket.

socket.connecting

Boolean indicating if the socket is connecting.

socket.destroyed

Boolean indicating if the socket has been destroyed.

socket.localAddress

The local IP address of the socket.

socket.localPort

The local port of the socket.

socket.remoteAddress

The remote IP address of the socket.

socket.remoteFamily

The IP family of the remote socket (e.g., 'IPv4' or 'IPv6').

socket.remotePort

The remote port of the socket.

* * *

* * *

## Socket Methods

Method

Description

socket.connect(options\[, connectListener\])

Connects the socket to the specified address and port. `options` can include `port`, `host`, `localAddress`, `localPort`, and more.

socket.connect(path\[, connectListener\])

Connects the socket to the specified IPC path.

socket.connect(port\[, host\]\[, connectListener\])

Connects the socket to the specified port and host.

socket.destroy(\[error\])

Destroys the socket. If `error` is provided, it will be emitted in an 'error' event.

socket.end(\[data\]\[, encoding\]\[, callback\])

Sends optional `data` and closes the socket, indicating no more data will be sent.

socket.pause()

Pauses the reading of data, allowing buffering of incoming data.

socket.resume()

Resumes reading data after a call to `socket.pause()`.

socket.setEncoding(\[encoding\])

Sets the socket to encode data in the specified encoding (default is `null`, which means Buffer objects are returned).

socket.setKeepAlive(\[enable\]\[, initialDelay\])

Enables/disables keep-alive functionality with optional `initialDelay` in milliseconds.

socket.setNoDelay(\[noDelay\])

Enables/disables Nagle's algorithm. When set to `true`, data is sent immediately rather than buffered.

socket.setTimeout(timeout\[, callback\])

Sets a timeout for the socket after which a 'timeout' event will be emitted if there's no activity.

socket.write(data\[, encoding\]\[, callback\])

Writes data to the socket. Returns `true` if data was flushed, or `false` if it was buffered.

* * *

## Socket Events

Event

Description

'close'

Emitted when the socket is fully closed. The argument `hadError` indicates if the socket was closed due to an error.

'connect'

Emitted when a socket connection is successfully established.

'data'

Emitted when data is received. The argument is the received data (Buffer or String).

'drain'

Emitted when the write buffer becomes empty.

'end'

Emitted when the other end of the socket signals the end of transmission.

'error'

Emitted when an error occurs. The 'close' event will be emitted directly after this event.

'lookup'

Emitted after resolving the hostname but before connecting. Includes details about the lookup.

'ready'

Emitted when a socket is ready to be used.

'timeout'

Emitted if the socket times out from inactivity. It's just a notification - the socket will not be closed automatically.

* * *

## Creating a TCP Client

This example shows how to create a TCP client that connects to a server:

```javascript
const net = require('net');// Create a new socketconst client = new net.Socket();// Connect to a serverclient.connect(8080, '127.0.0.1', () => {  console.log('Connected to server');    // Send data to the server  client.write('Hello, server! From client.');});// Handle data received from the serverclient.on('data', (data) => {  console.log(`Received from server: ${data.toString()}`);    // Close the connection after receiving a response  client.end();});// Handle connection closureclient.on('close', () => {  console.log('Connection closed');});// Handle errorsclient.on('error', (err) => {  console.error(`Error: ${err.message}`);});
```

* * *

## Creating a TCP Server

This example demonstrates creating a TCP server that handles socket connections:

```javascript
const net = require('net');// Create a TCP serverconst server = net.createServer((socket) => {  // 'socket' is the client connection - an instance of net.Socket    console.log(`Client connected: ${socket.remoteAddress}:${socket.remotePort}`);    // Set encoding  socket.setEncoding('utf8');    // Handle data from client  socket.on('data', (data) => {    console.log(`Received from client: ${data}`);        // Echo the data back to the client    socket.write(`You said: ${data}`);  });    // Handle client disconnection  socket.on('end', () => {    console.log('Client disconnected');  });    // Handle socket errors  socket.on('error', (err) => {    console.error(`Socket error: ${err.message}`);  });    // Send a welcome message to the client  socket.write('Welcome to the TCP server!\n');});// Start the server on port 8080server.listen(8080, '127.0.0.1', () => {  console.log('Server listening on port 8080');});// Handle server errorsserver.on('error', (err) => {  console.error(`Server error: ${err.message}`);});
```

* * *

## Socket Timeout

This example demonstrates how to set and handle socket timeouts:

```javascript
const net = require('net');// Create a server with timeoutsconst server = net.createServer((socket) => {  console.log('Client connected');    // Set socket timeout to 10 seconds  socket.setTimeout(10000);    // Handle socket timeout  socket.on('timeout', () => {    console.log('Socket timeout - no activity for 10 seconds');    socket.write('You have been inactive for too long. The connection will be closed.');    socket.end();  });    // Handle data  socket.on('data', (data) => {    console.log(`Received: ${data.toString()}`);    socket.write('Data received');        // Each time we receive data, the timeout is reset    console.log('Timeout timer reset');  });    // Handle socket closure  socket.on('close', () => {    console.log('Socket closed');  });    // Send welcome message  socket.write('Welcome! This connection will timeout after 10 seconds of inactivity.\n');});// Start the serverconst PORT = 8081;server.listen(PORT, () => {  console.log(`Timeout example server running on port ${PORT}`);    // For testing: create a client that connects but doesn't send data  const client = new net.Socket();  client.connect(PORT, '127.0.0.1', () => {    console.log('Test client connected');        // We'll send a message after 5 seconds (before timeout)    setTimeout(() => {      client.write('Hello after 5 seconds');    }, 5000);        // We won't send anything else, so the connection should timeout    // after another 10 seconds  });    client.on('data', (data) => {    console.log(`Client received: ${data.toString()}`);  });    client.on('close', () => {    console.log('Client disconnected');  });});
```

* * *

## Socket Options

This example shows how to configure various socket options:

```javascript
const net = require('net');// Create a socket with optionsconst socket = new net.Socket();// Configure socket optionssocket.setKeepAlive(true, 1000); // Enable keep-alive with 1 second initial delaysocket.setNoDelay(true); // Disable Nagle's algorithm (no buffering)// Connect to a serversocket.connect({  port: 80,  host: 'example.com',  family: 4, // IPv4  localAddress: '0.0.0.0', // Local interface to bind to  localPort: 8000 // Local port to bind to}, () => {  console.log('Connected with options');    // Display socket information  console.log(`Local address: ${socket.localAddress}:${socket.localPort}`);  console.log(`Remote address: ${socket.remoteAddress}:${socket.remotePort}`);  console.log(`Remote family: ${socket.remoteFamily}`);    // Send a simple HTTP request  socket.write('GET / HTTP/1.1\r\n');  socket.write('Host: example.com\r\n');  socket.write('Connection: close\r\n');  socket.write('\r\n');});// Handle datalet responseData = '';socket.on('data', (data) => {  const chunk = data.toString();  responseData += chunk;    // Show first line of the response  if (responseData.includes('\r\n') && !socket.firstLineShown) {    const firstLine = responseData.split('\r\n')[0];    console.log(`First line of response: ${firstLine}`);    socket.firstLineShown = true;  }});// Handle end of datasocket.on('end', () => {  console.log('Response complete');  console.log(`Total bytes received: ${socket.bytesRead}`);  console.log(`Total bytes sent: ${socket.bytesWritten}`);});// Handle errorssocket.on('error', (err) => {  console.error(`Socket error: ${err.message}`);});
```

* * *

## Working with Socket Buffers

This example demonstrates socket buffering and the 'drain' event:

```javascript
const net = require('net');// Create server to demonstrate buffer handlingconst server = net.createServer((socket) => {  console.log('Client connected');    // Make buffer small to demonstrate filling it faster  socket.bufferSize = 1024; // Note: This doesn't actually limit the buffer size    // Send a slow response to the client to demonstrate buffering  socket.on('data', (data) => {    console.log(`Received data: ${data.toString().trim()}`);    console.log('Sending large response...');        // Function to write data until buffer is full    const writeUntilBufferFull = () => {      // Generate some data to send      const chunk = 'x'.repeat(1024);            // Keep writing until the buffer is full (write returns false)      let i = 0;      while (i < 100) {        const canContinue = socket.write(`Chunk ${i}: ${chunk}\n`);        console.log(`Wrote chunk ${i}, buffer full? ${!canContinue}`);                // If the buffer is full, wait for it to drain        if (!canContinue) {          console.log(`Buffer is full after ${i} writes. Current buffer size: ${socket.bufferSize} bytes`);          // Stop writing and wait for the 'drain' event          socket.once('drain', () => {            console.log('Buffer drained, resuming writes');            writeUntilBufferFull();          });          return;        }        i++;      }            // All chunks written      console.log('All data sent');      socket.end('\nTransmission complete');    };        // Start the writing process    writeUntilBufferFull();  });    socket.on('end', () => {    console.log('Client disconnected');  });    socket.on('error', (err) => {    console.error(`Socket error: ${err.message}`);  });    socket.write('Send any message to receive a large response\n');});// Start the serverconst PORT = 8082;server.listen(PORT, () => {  console.log(`Buffer demonstration server running on port ${PORT}`);    // For demonstration, create a client that connects and sends a message  const client = new net.Socket();    client.connect(PORT, '127.0.0.1', () => {    console.log('Test client connected');        // Send a message after 1 second    setTimeout(() => {      client.write('Please send me a large response');    }, 1000);  });    let receivedData = 0;  client.on('data', (data) => {    receivedData += data.length;    console.log(`Client received ${data.length} bytes, total: ${receivedData}`);  });    client.on('end', () => {    console.log(`Client disconnected after receiving ${receivedData} bytes`);    process.exit(0);  });    client.on('error', (err) => {    console.error(`Client error: ${err.message}`);  });});
```

* * *

## IPC Socket Communication

This example demonstrates Inter-Process Communication (IPC) using Unix domain sockets:

```javascript
const net = require('net');const path = require('path');const fs = require('fs');// IPC path - depending on OSconst socketPath = process.platform === 'win32'  ? path.join('\\\\?\\pipe', process.cwd(), 'ipc-demo.sock')  : path.join(process.cwd(), 'ipc-demo.sock');// Remove existing socket file if it exists (Unix only)if (process.platform !== 'win32' && fs.existsSync(socketPath)) {  fs.unlinkSync(socketPath);}// Create IPC serverconst server = net.createServer((socket) => {  console.log('Client connected to IPC socket');    socket.on('data', (data) => {    const message = data.toString().trim();    console.log(`Server received: ${message}`);        // Echo back    socket.write(`Echo: ${message}`);  });    socket.on('end', () => {    console.log('Client disconnected from IPC socket');  });    socket.write('Connected to IPC server\n');});// Handle server errorsserver.on('error', (err) => {  console.error(`IPC server error: ${err.message}`);});// Start IPC serverserver.listen(socketPath, () => {  console.log(`IPC server listening on ${socketPath}`);    // Create client that connects to the IPC socket  const client = new net.Socket();    client.on('data', (data) => {    console.log(`Client received: ${data.toString().trim()}`);  });    client.on('end', () => {    console.log('Disconnected from IPC server');  });    client.on('error', (err) => {    console.error(`IPC client error: ${err.message}`);  });    // Connect to the IPC server  client.connect(socketPath, () => {    console.log('Connected to IPC server');    client.write('Hello via IPC socket');        // Send multiple messages    setTimeout(() => {      client.write('Message 1');    }, 1000);        setTimeout(() => {      client.write('Message 2');      client.end(); // Close after sending the last message    }, 2000);  });});// Cleanup on exitprocess.on('exit', () => {  if (process.platform !== 'win32' && fs.existsSync(socketPath)) {    fs.unlinkSync(socketPath);  }});// Handle Ctrl+Cprocess.on('SIGINT', () => {  console.log('Shutting down...');  process.exit(0);});
```

* * *

## Half-Closed Sockets

This example demonstrates half-closed connections where one side has ended their write stream but can still receive data:

```javascript
const net = require('net');// Create serverconst server = net.createServer((socket) => {  console.log('Client connected');    // Send initial message  socket.write('Welcome to the half-close demonstration server\n');    // Handle data from client  socket.on('data', (data) => {    console.log(`Server received: ${data.toString().trim()}`);  });    // Handle socket end (client ended their write stream)  socket.on('end', () => {    console.log('Client ended their write stream (half-closed)');        // We can still write to the client after they've ended their write stream    socket.write('You have ended your side of the connection, but I can still talk to you.');        // Close our side after a delay    setTimeout(() => {      console.log('Server now closing its write stream');      socket.end('Goodbye! Closing my side of the connection now.');    }, 8080);  });    // Handle complete socket closure  socket.on('close', (hadError) => {    console.log(`Socket fully closed. Had error: ${hadError}`);  });    socket.on('error', (err) => {    console.error(`Socket error: ${err.message}`);  });});// Start serverconst PORT = 8083;server.listen(PORT, () => {  console.log(`Half-close demonstration server running on port ${PORT}`);    // Create a client for demonstration  const client = new net.Socket();    client.connect(PORT, '127.0.0.1', () => {    console.log('Client connected');        // Send some data    client.write('Hello from client');        // After a delay, end the client write stream (half-close)    setTimeout(() => {      console.log('Client ending its write stream (half-closing)');      client.end();            // We can't write anymore, but we can still receive data      console.log('Client waiting to receive more data...');    }, 2000);  });    // Handle data from server  client.on('data', (data) => {    console.log(`Client received: ${data.toString().trim()}`);  });    // Handle server closing its write stream  client.on('end', () => {    console.log('Server ended its write stream, connection fully closed');  });    // Handle complete connection closure  client.on('close', (hadError) => {    console.log(`Client connection fully closed. Had error: ${hadError}`);  });    client.on('error', (err) => {    console.error(`Client error: ${err.message}`);  });});
```

* * *

## Best Practices for Socket Programming

When working with sockets in Node.js, consider these best practices:

1.  **Error handling**: Always handle the 'error' event to prevent unhandled exceptions.
2.  **Clean up resources**: Ensure sockets are properly closed to avoid memory leaks.
3.  **Buffer management**: Monitor `socket.bufferSize` and use the 'drain' event to avoid memory issues when sending large amounts of data.
4.  **Timeouts**: Set appropriate timeouts with `socket.setTimeout()` to handle stale connections.
5.  **Keep-alive**: Configure keep-alive settings for long-running connections.
6.  **Data encoding**: Set appropriate encoding with `socket.setEncoding()` or handle binary data appropriately.
7.  **Security**: For secure communication, use the TLS/SSL module (`tls`) instead of raw TCP sockets.
8.  **Backpressure**: Pay attention to the return value of `socket.write()` to handle backpressure.

* * *