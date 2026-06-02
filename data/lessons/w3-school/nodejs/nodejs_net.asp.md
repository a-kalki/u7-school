# Node.js Net Module

* * *

## Introduction to the Net Module

The Net module is one of Node.js's core networking modules, allowing you to create TCP servers and clients. TCP (Transmission Control Protocol) is a reliable, ordered, and error-checked delivery of a stream of bytes between applications running on networked devices.

Unlike the HTTP module, which is built on top of the Net module, the Net module provides lower-level networking capabilities, giving you more control over the communication protocol.

**Note:** The Net module is best suited for scenarios where you need a custom TCP protocol or want to implement your own application-level protocol on top of TCP.

* * *

## Importing the Net Module

To use the Net module, you need to import it in your Node.js application:

```javascript
const net = require('net');
```

* * *

## Creating a TCP Server

The Net module makes it easy to create a TCP server that listens for connections:

```javascript
const net = require('net');// Create a TCP serverconst server = net.createServer((socket) => {  console.log('Client connected');    // Set encoding to utf8 so we receive strings instead of Buffer objects  socket.setEncoding('utf8');    // Handle data from client  socket.on('data', (data) => {    console.log(`Received from client: ${data}`);        // Echo the data back to the client    socket.write(`Echo: ${data}`);  });    // Handle client disconnection  socket.on('end', () => {    console.log('Client disconnected');  });    // Handle errors  socket.on('error', (err) => {    console.error('Socket error:', err);  });    // Send a welcome message to the client  socket.write('Welcome to the TCP server!\r\n');});// Start the server and listen on port 8080server.listen(8080, () => {  console.log('TCP Server running on port 8080');});
```

In this example:

*   `net.createServer()` creates a new TCP server
*   The callback function is called when a client connects
*   The `socket` object represents the connection to the client
*   We set up event handlers for `data`, `end`, and `error` events
*   `server.listen(8080)` starts the server on port 8080

* * *

* * *

## Creating a TCP Client

You can also create a TCP client to connect to a TCP server:

```javascript
const net = require('net');// Create a TCP clientconst client = net.createConnection({ port: 8080 }, () => {  console.log('Connected to server');    // Send a message to the server  client.write('Hello from client!');});// Set encodingclient.setEncoding('utf8');// Handle data from serverclient.on('data', (data) => {  console.log(`Received from server: ${data}`);    // Send another message  client.write('More data from client');});// Handle connection endclient.on('end', () => {  console.log('Disconnected from server');});// Handle errorsclient.on('error', (err) => {  console.error('Connection error:', err);});
```

In this example:

*   `net.createConnection()` creates a client connection to a TCP server
*   We provide the port (and optionally host) to connect to
*   The callback function is called when the connection is established
*   We set up event handlers for `data`, `end`, and `error` events

**Note:** To test the client and server together, run the server script in one terminal and the client script in another terminal.

* * *

## Socket Properties and Methods

The Socket object provided to the server connection callback and returned by `createConnection()` has many useful properties and methods:

Property/Method

Description

`socket.write(data[, encoding][, callback])`

Writes data to the socket, optionally with the specified encoding

`socket.end([data][, encoding][, callback])`

Closes the socket after all data is written and flushed

`socket.setEncoding(encoding)`

Sets the encoding for data received on the socket

`socket.setTimeout(timeout[, callback])`

Sets the socket to timeout after the specified number of milliseconds of inactivity

`socket.setKeepAlive([enable][, initialDelay])`

Enables/disables keep-alive functionality

`socket.address()`

Returns an object with connection's address, family, and port

`socket.remoteAddress`

Remote IP address as a string

`socket.remotePort`

Remote port as a number

`socket.localAddress`

Local IP address the server is listening on

`socket.localPort`

Local port the server is listening on

`socket.bytesRead`

Number of bytes received

`socket.bytesWritten`

Number of bytes sent

* * *

## Server Properties and Methods

The Server object returned by `createServer()` has these useful properties and methods:

Property/Method

Description

`server.listen(port[, hostname][, backlog][, callback])`

Starts the server listening for connections

`server.close([callback])`

Stops the server from accepting new connections

`server.address()`

Returns an object with server's address info

`server.maxConnections`

Set this property to reject connections when the connection count exceeds it

`server.connections`

Number of concurrent connections

`server.listening`

Boolean indicating whether the server is listening

* * *

## Creating a Chat Server

Let's create a simple chat server that broadcasts messages to all connected clients:

```javascript
const net = require('net');// Store all client connectionsconst clients = [];// Create a chat serverconst server = net.createServer((socket) => {  // Generate a client ID  const clientId = `${socket.remoteAddress}:${socket.remotePort}`;  console.log(`Client connected: ${clientId}`);    // Set encoding  socket.setEncoding('utf8');    // Add client to the list  clients.push(socket);    // Send welcome message  socket.write(`Welcome to the chat server! There are ${clients.length} users online.\r\n`);    // Broadcast message to all clients except the sender  function broadcast(message, sender) {    clients.forEach(client => {      if (client !== sender) {        client.write(message);      }    });  }    // Notify all clients about the new connection  broadcast(`User ${clientId} joined the chat.\r\n`, socket);    // Handle client messages  socket.on('data', (data) => {    console.log(`${clientId}: ${data.trim()}`);        // Broadcast the message to all other clients    broadcast(`${clientId}: ${data}`, socket);  });    // Handle client disconnection  socket.on('end', () => {    console.log(`Client disconnected: ${clientId}`);        // Remove client from the list    const index = clients.indexOf(socket);    if (index !== -1) {      clients.splice(index, 1);    }        // Notify all clients about the disconnection    broadcast(`User ${clientId} left the chat.\r\n`, null);  });    // Handle errors  socket.on('error', (err) => {    console.error(`Socket error from ${clientId}:`, err);  });});// Start the serverconst PORT = 8080;server.listen(PORT, () => {  console.log(`Chat server running on port ${PORT}`);});// Handle server errorsserver.on('error', (err) => {  console.error('Server error:', err);});
```

To connect to this chat server, you can use a TCP client or a terminal tool like telnet:

```javascript
telnet localhost 8080
```

You can also create a dedicated chat client using the Net module:

```javascript
const net = require('net');const readline = require('readline');// Create interface for reading from the terminalconst rl = readline.createInterface({  input: process.stdin,  output: process.stdout});// Create a client connectionconst client = net.createConnection({ port: 8080 }, () => {  console.log('Connected to chat server');  console.log('Type a message and press Enter to send');    // Start reading user input  rl.prompt();});// Set encodingclient.setEncoding('utf8');// Handle data from serverclient.on('data', (data) => {  // Move cursor to beginning of line and clear it  process.stdout.write('\r\x1b[K');    // Print the server message  console.log(data.trim());    // Re-display the prompt  rl.prompt();});// Handle connection endclient.on('end', () => {  console.log('Disconnected from server');  rl.close();  process.exit(0);});// Handle errorsclient.on('error', (err) => {  console.error('Connection error:', err);  rl.close();  process.exit(1);});// Handle user inputrl.on('line', (input) => {  // Send the user input to the server  client.write(input);  rl.prompt();});// Close the connection when the user exitsrl.on('close', () => {  console.log('Exiting chat...');  client.end();});
```

* * *

## Building a Simple Protocol

One of the advantages of using the Net module is the ability to create your own application protocols. Let's create a simple JSON-based protocol:

```javascript
const net = require('net');// Create a server that supports a JSON-based protocolconst server = net.createServer((socket) => {  console.log('Client connected');    // Buffer for incoming data  let buffer = '';    // Handle data  socket.on('data', (data) => {    // Add the new data to our buffer    buffer += data.toString();        // Process complete messages    let boundary = buffer.indexOf('\n');    while (boundary !== -1) {      // Extract the complete message      const message = buffer.substring(0, boundary);      buffer = buffer.substring(boundary + 1);            // Process the message      try {        const parsedMessage = JSON.parse(message);        console.log('Received message:', parsedMessage);                // Handle different message types        switch (parsedMessage.type) {          case 'greeting':            socket.write(JSON.stringify({              type: 'welcome',              message: `Hello, ${parsedMessage.name}!`,              timestamp: Date.now()            }) + '\n');            break;                      case 'query':            socket.write(JSON.stringify({              type: 'response',              queryId: parsedMessage.queryId,              result: handleQuery(parsedMessage.query),              timestamp: Date.now()            }) + '\n');            break;                      default:            socket.write(JSON.stringify({              type: 'error',              message: 'Unknown message type',              timestamp: Date.now()            }) + '\n');        }      } catch (err) {        console.error('Error processing message:', err);        socket.write(JSON.stringify({          type: 'error',          message: 'Invalid JSON format',          timestamp: Date.now()        }) + '\n');      }            // Look for the next message      boundary = buffer.indexOf('\n');    }  });    // Handle disconnection  socket.on('end', () => {    console.log('Client disconnected');  });    // Handle errors  socket.on('error', (err) => {    console.error('Socket error:', err);  });});// Simple function to handle queriesfunction handleQuery(query) {  if (query === 'time') {    return { time: new Date().toISOString() };  } else if (query === 'stats') {    return {      uptime: process.uptime(),      memory: process.memoryUsage(),      platform: process.platform    };  } else {    return { error: 'Unknown query' };  }}// Start the serverconst PORT = 8080;server.listen(PORT, () => {  console.log(`JSON protocol server running on port ${PORT}`);});
```

And here's a client that uses this protocol:

```javascript
const net = require('net');// Connect to the serverconst client = net.createConnection({ port: 8080 }, () => {  console.log('Connected to server');    // Send a greeting  send({    type: 'greeting',    name: 'Client'  });    // Send a query  send({    type: 'query',    queryId: 1,    query: 'time'  });    // Send another query  setTimeout(() => {    send({      type: 'query',      queryId: 2,      query: 'stats'    });  }, 1000);});// Buffer for incoming datalet buffer = '';// Handle data from serverclient.on('data', (data) => {  // Add the new data to our buffer  buffer += data.toString();    // Process complete messages  let boundary = buffer.indexOf('\n');  while (boundary !== -1) {    // Extract the complete message    const message = buffer.substring(0, boundary);    buffer = buffer.substring(boundary + 1);        // Process the message    try {      const parsedMessage = JSON.parse(message);      console.log('Received from server:', parsedMessage);    } catch (err) {      console.error('Error parsing message:', err);    }        // Look for the next message    boundary = buffer.indexOf('\n');  }});// Helper function to send messagesfunction send(message) {  const jsonString = JSON.stringify(message) + '\n';  console.log('Sending:', message);  client.write(jsonString);}// Handle connection endclient.on('end', () => {  console.log('Disconnected from server');});// Handle errorsclient.on('error', (err) => {  console.error('Connection error:', err);});// Close the connection after some timesetTimeout(() => {  console.log('Closing connection');  client.end();}, 5000);
```

**Note:** In this protocol, we use JSON for message serialization and newline characters (\\n) as message boundaries. This makes it easy to parse messages and allows for a variety of message types and payloads.

* * *

## Socket Timeouts

To handle inactive connections, you can set a timeout on the socket:

```javascript
const net = require('net');const server = net.createServer((socket) => {  console.log('Client connected');    // Set a timeout of 10 seconds  socket.setTimeout(10000);    // Handle timeout  socket.on('timeout', () => {    console.log('Socket timeout');    socket.write('You have been inactive for too long. Disconnecting...\r\n');    socket.end();  });    // Handle data  socket.on('data', (data) => {    console.log(`Received: ${data.toString().trim()}`);    socket.write(`Echo: ${data}`);  });    // Handle disconnection  socket.on('end', () => {    console.log('Client disconnected');  });});server.listen(8080, () => {  console.log('Server with timeout running on port 8080');});
```

* * *

## Working with IPC (Inter-Process Communication)

The Net module can also create IPC (Inter-Process Communication) servers and clients using Unix domain sockets or named pipes on Windows:

```javascript
const net = require('net');const path = require('path');// Define the path for the IPC socketconst socketPath = path.join(__dirname, 'ipc-socket');// Create an IPC serverconst server = net.createServer((socket) => {  console.log('Client connected to IPC server');    socket.on('data', (data) => {    console.log(`Received via IPC: ${data.toString().trim()}`);    socket.write(`Echo: ${data}`);  });    socket.on('end', () => {    console.log('Client disconnected from IPC server');  });});// Start the IPC serverserver.listen(socketPath, () => {  console.log(`IPC server running at ${socketPath}`);});// Clean up the socket file when the server closesserver.on('close', () => {  console.log('Cleaning up socket file');  require('fs').unlinkSync(socketPath);});// Handle process terminationprocess.on('SIGINT', () => {  server.close(() => {    console.log('IPC server closed');    process.exit(0);  });});
```

And here's an IPC client:

```javascript
const net = require('net');const path = require('path');// Define the path for the IPC socketconst socketPath = path.join(__dirname, 'ipc-socket');// Create an IPC clientconst client = net.createConnection({ path: socketPath }, () => {  console.log('Connected to IPC server');  client.write('Hello from IPC client!');});client.on('data', (data) => {  console.log(`Received from IPC server: ${data.toString().trim()}`);  client.end();});client.on('end', () => {  console.log('Disconnected from IPC server');});client.on('error', (err) => {  console.error('Connection error:', err);});
```

**Note:** IPC connections using Unix domain sockets or named pipes are generally faster and more secure than TCP connections because they don't use the network stack and are restricted to the local machine.

* * *

## Best Practices

1.  **Error Handling:** Always handle socket errors to prevent your application from crashing.
2.  **Timeouts:** Implement timeouts to handle inactive connections and prevent resource leaks.
3.  **Keep-Alive:** Use keep-alive for long-lived connections to detect disconnections.
4.  **Buffering:** Implement proper message framing and buffering for your protocol to handle partial messages.
5.  **Connection Limits:** Set `server.maxConnections` to avoid overwhelming your server.
6.  **Graceful Shutdown:** Implement proper cleanup when shutting down servers to release resources.
7.  **Binary Data:** Use Buffer objects for binary data transmission rather than strings to avoid encoding issues.
8.  **Backpressure:** Check the return value of `socket.write()` to handle backpressure when the client can't keep up.

* * *

## Net Module vs. HTTP Module

Feature

Net Module

HTTP Module

Protocol

Raw TCP/IP

HTTP protocol

Message Format

Custom (you define it)

HTTP request/response

Abstraction Level

Lower-level, more control

Higher-level, easier to use

Use Case

Custom protocols, performance-critical apps

Web applications, REST APIs

Use the Net module when:

*   You need to implement a custom protocol
*   You want maximum control over the communication
*   You need to optimize for performance
*   You're building a non-HTTP TCP server (chat, game, etc.)

Use the HTTP module when:

*   You're building a web server or API
*   You need HTTP-specific features like request routing, headers, etc.
*   You want to use higher-level web frameworks like Express

* * *

## Summary

The Node.js Net module provides powerful tools for creating TCP servers and clients. It offers:

*   Low-level socket access for custom protocols
*   Asynchronous, event-driven API for handling connections
*   Support for both TCP/IP and IPC communication
*   Building blocks for higher-level protocols

While it requires more manual work than higher-level modules like HTTP, the Net module gives you the flexibility to implement exactly the protocol you need for your application.

**Note:** Always monitor your TCP server's performance using tools like `netstat`, `ss`, or `lsof` to identify bottlenecks and connection issues.

* * *

* * *