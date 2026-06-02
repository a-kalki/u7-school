# Node.js Agent Reference

* * *

## Agent Object

The Agent class in Node.js is responsible for managing connection persistence and reuse for HTTP/HTTPS client requests. It maintains a queue of pending requests for a given host and port, reusing a single socket connection for each in-flight request to that host and port.

There are two primary Agent implementations:

*   `http.Agent` - For managing HTTP connections
*   `https.Agent` - For managing HTTPS connections

### Importing Agent

```javascript
// Import HTTP moduleconst http = require('http');// The default agentconst defaultAgent = http.globalAgent;// Create a custom agentconst customAgent = new http.Agent({  keepAlive: true,  maxSockets: 25});
```

* * *

## Agent Properties

Property

Description

agent.freeSockets

An object which contains sockets currently awaiting use by the Agent when `keepAlive` is enabled. Not to be modified directly.

agent.maxFreeSockets

Sets the maximum number of sockets that will be left open in the free state. Only relevant if `keepAlive` is set to `true`. Default: 256.

agent.maxSockets

Sets the maximum number of sockets the agent can have open per origin. Default: Infinity.

agent.maxTotalSockets

Sets the maximum number of sockets that can be open on all origins. Default: Infinity.

agent.requests

An object which contains queued requests that have not yet been assigned to sockets. Not to be modified directly.

agent.sockets

An object which contains arrays of sockets currently in use by the Agent. Not to be modified directly.

* * *

* * *

## Agent Methods

Method

Description

agent.createConnection(options\[, callback\])

Creates a socket/stream to be used for HTTP requests. By default, this function uses `net.createConnection()` but it can be overridden.

agent.destroy()

Destroys any sockets that are currently in use by the agent.

agent.getName(options)

Gets a unique name for a set of request options, to determine if a connection can be reused.

agent.keepSocketAlive(socket)

Called when `socket` is detached from a request and could be persisted by the Agent. Default behavior is to add socket to the `freeSockets` list.

agent.reuseSocket(socket, request)

Called when `socket` is attached to `request` after being persisted because of the keep-alive options.

* * *

## Using the Default Agent

By default, HTTP/HTTPS client requests use the global agent (`http.globalAgent` or `https.globalAgent`):

```javascript
const http = require('http');// Make a request using the default agenthttp.get('http://example.com', (res) => {  console.log(`Status Code: ${res.statusCode}`);    // Display global agent information  const agent = http.globalAgent;  console.log(`Current sockets: ${Object.keys(agent.sockets).length}`);  console.log(`Free sockets: ${Object.keys(agent.freeSockets).length}`);  console.log(`Queued requests: ${Object.keys(agent.requests).length}`);    // Consume response data  res.resume();}).on('error', (err) => {  console.error(`Error: ${err.message}`);});
```

* * *

## Creating a Custom Agent

You can create a custom agent with specific settings:

```javascript
const http = require('http');// Create a custom agent with keep-alive enabledconst keepAliveAgent = new http.Agent({  keepAlive: true,           // Keep connections open for reuse  keepAliveMsecs: 1000,      // Milliseconds to wait before sending TCP KeepAlive packet  maxSockets: 10,            // Maximum number of sockets per host  maxFreeSockets: 5,         // Maximum number of idle sockets when keepAlive is true  timeout: 60000,            // Socket timeout in milliseconds  scheduling: 'fifo'         // FIFO request scheduling (instead of LIFO)});// Make a request using the custom agentconst options = {  hostname: 'example.com',  path: '/',  method: 'GET',  agent: keepAliveAgent     // Use our custom agent};const req = http.request(options, (res) => {  console.log(`Status Code: ${res.statusCode}`);    // Display custom agent information  console.log(`Current sockets: ${Object.keys(keepAliveAgent.sockets).length}`);  console.log(`Free sockets: ${Object.keys(keepAliveAgent.freeSockets).length}`);    // Consume response data  res.resume();    // Make a second request to demonstrate socket reuse  setTimeout(() => {    console.log('Making second request to demonstrate socket reuse...');        http.request(options, (res2) => {      console.log(`Second request status: ${res2.statusCode}`);      console.log(`Current sockets: ${Object.keys(keepAliveAgent.sockets).length}`);      console.log(`Free sockets: ${Object.keys(keepAliveAgent.freeSockets).length}`);            // Cleanup      setTimeout(() => {        keepAliveAgent.destroy();        console.log('Agent destroyed');      }, 1000);            res2.resume();    }).end();  }, 2000);});req.on('error', (err) => {  console.error(`Error: ${err.message}`);});req.end();
```

* * *

## HTTPS Agent

For HTTPS requests, you can create an HTTPS-specific agent with additional SSL/TLS options:

```javascript
const https = require('https');const fs = require('fs');// Create a custom HTTPS agent with SSL optionsconst httpsAgent = new https.Agent({  keepAlive: true,  maxSockets: 10,  // SSL/TLS options  ca: fs.readFileSync('ca-cert.pem'),      // Certificate authority  cert: fs.readFileSync('client-cert.pem'), // Client certificate  key: fs.readFileSync('client-key.pem'),   // Client private key  // Additional TLS options  rejectUnauthorized: true,                // Verify server certificate  secureProtocol: 'TLSv1_2_method',        // Use TLS v1.2  ciphers: 'HIGH:!aNULL:!MD5',             // Set allowed ciphers  honorCipherOrder: true                    // Honor cipher order});// Make a secure request using the HTTPS agentconst options = {  hostname: 'secure-example.com',  path: '/',  method: 'GET',  agent: httpsAgent};const req = https.request(options, (res) => {  console.log(`Status Code: ${res.statusCode}`);    // Display the TLS/SSL-specific information  console.log(`TLS Protocol: ${res.socket.getProtocol()}`);  console.log(`Cipher: ${res.socket.getCipher().name}`);  console.log(`Server Certificate Valid: ${res.socket.authorized}`);    // Consume response data  res.resume();    // Cleanup  setTimeout(() => {    httpsAgent.destroy();    console.log('HTTPS Agent destroyed');  }, 1000);});req.on('error', (err) => {  console.error(`Error: ${err.message}`);});req.end();
```

* * *

## Disabling Connection Pooling

You can disable connection pooling by setting the agent to `false`:

```javascript
const http = require('http');// Make a request with agent: false to disable connection poolingconst options = {  hostname: 'example.com',  path: '/',  method: 'GET',  agent: false  // Disable connection pooling};const req = http.request(options, (res) => {  console.log(`Status Code: ${res.statusCode}`);  console.log('Using a new connection (no agent)');    // Consume response data  res.resume();});req.on('error', (err) => {  console.error(`Error: ${err.message}`);});req.end();
```

* * *

## Connection Pooling Example

This example demonstrates the performance benefits of connection pooling with multiple requests:

```javascript
const http = require('http');const { performance } = require('perf_hooks');// Function to make multiple requests with a given agentasync function makeMultipleRequests(useAgent, numRequests = 10) {  // Define the target  const hostname = 'example.com';  const path = '/';    // Choose agent  const agent = useAgent ? new http.Agent({ keepAlive: true }) : false;    console.log(`Making ${numRequests} requests with ${useAgent ? 'custom agent' : 'no agent'}`);  const startTime = performance.now();    // Make multiple requests  for (let i = 0; i < numRequests; i++) {    await new Promise((resolve, reject) => {      const req = http.request({        hostname,        path,        method: 'GET',        agent      }, (res) => {        // Consume response data        res.resume();        res.on('end', () => {          resolve();        });      });            req.on('error', (err) => {        console.error(`Request ${i + 1} error: ${err.message}`);        reject(err);      });            req.end();    }).catch(() => {}); // Catch to continue the loop even if a request fails  }    const endTime = performance.now();  console.log(`Time taken: ${(endTime - startTime).toFixed(2)}ms`);    // Cleanup  if (useAgent && agent) {    agent.destroy();  }    return endTime - startTime;}// Run the comparisonasync function runComparison() {  console.log('Testing HTTP request performance with and without Agent');  console.log('----------------------------------------------------');    // With no agent (no connection pooling)  const timeWithoutAgent = await makeMultipleRequests(false);    console.log(''); // Separator    // With agent (connection pooling)  const timeWithAgent = await makeMultipleRequests(true);    console.log(''); // Separator  console.log('Results:');  console.log(`Without agent: ${timeWithoutAgent.toFixed(2)}ms`);  console.log(`With agent: ${timeWithAgent.toFixed(2)}ms`);  console.log(`Difference: ${(timeWithoutAgent - timeWithAgent).toFixed(2)}ms`);  console.log(`Performance improvement: ${(100 * (timeWithoutAgent - timeWithAgent) / timeWithoutAgent).toFixed(2)}%`);}// Run the comparisonrunComparison().catch(console.error);
```

* * *

## Creating a Proxy Agent

You can extend the Agent class to create a proxy agent:

```javascript
const http = require('http');const net = require('net');const { URL } = require('url');// A simple HTTP proxy agent implementationclass HttpProxyAgent extends http.Agent {  constructor(proxyUri, options = {}) {    super(options);    this.proxyUri = new URL(proxyUri);  }    // Override createConnection to connect through the proxy  createConnection(options, callback) {    // Connect to the proxy server    const proxySocket = net.connect({      host: this.proxyUri.hostname,      port: this.proxyUri.port || 80,    }, () => {      // Create the HTTP CONNECT request to the target through the proxy      proxySocket.write(        `CONNECT ${options.host}:${options.port} HTTP/1.1\r\n` +        `Host: ${options.host}:${options.port}\r\n` +        `Proxy-Connection: keep-alive\r\n` +        // Add proxy authentication if provided        (this.proxyUri.username && this.proxyUri.password          ? `Proxy-Authorization: Basic ${Buffer.from(              `${this.proxyUri.username}:${this.proxyUri.password}`            ).toString('base64')}\r\n`          : '') +        '\r\n'      );            // Data handler for proxy response      let proxyResponse = '';      const onData = (chunk) => {        proxyResponse += chunk.toString();                // Check if we've received the full proxy response        if (proxyResponse.includes('\r\n\r\n')) {          // Parse status line          const statusLine = proxyResponse.split('\r\n')[0];          const statusCode = parseInt(statusLine.split(' ')[1], 10);                    // If the proxy connection was successful          if (statusCode === 200) {            // Remove data listener, we don't need it anymore            proxySocket.removeListener('data', onData);                        // Callback with the socket            callback(null, proxySocket);          } else {            // Proxy connection failed            proxySocket.destroy();            callback(new Error(`Proxy connection failed: ${statusLine}`));          }        }      };            proxySocket.on('data', onData);    });        // Handle socket errors    proxySocket.on('error', (err) => {      callback(err);    });        return proxySocket;  }}// Example usage of the proxy agentconst proxyAgent = new HttpProxyAgent('http://proxy.example.com:8080', {  keepAlive: true});// Make a request through the proxyconst options = {  hostname: 'target-site.com',  path: '/',  method: 'GET',  agent: proxyAgent};const req = http.request(options, (res) => {  console.log(`Status Code: ${res.statusCode}`);    // Consume response data  res.resume();    // Cleanup  setTimeout(() => {    proxyAgent.destroy();    console.log('Proxy Agent destroyed');  }, 1000);});req.on('error', (err) => {  console.error(`Error: ${err.message}`);});req.end();
```

* * *

## Best Practices

1.  **Use keepAlive**: Enable `keepAlive` for persistent connections to improve performance when making multiple requests to the same server.
2.  **Set maxSockets**: Limit `maxSockets` to prevent overwhelming the target server or your own system's resources.
3.  **Clean up**: Call `agent.destroy()` when the agent is no longer needed to free up resources.
4.  **Use custom agents**: Create different agent instances for different connection requirements or target servers.
5.  **Monitor agent health**: Track the number of active and free sockets to detect connection issues.
6.  **Security**: For HTTPS agents, always set appropriate SSL/TLS options and keep security settings up to date.
7.  **Error handling**: Always handle potential errors in HTTP requests.

* * *