# Node.js Worker Reference

* * *

## Worker Object

The Worker class is part of the Node.js `cluster` module, which enables the creation of child processes (workers) that run simultaneously and share server ports. This is particularly useful for taking advantage of multi-core systems to handle load.

### Import Worker

Worker objects are created automatically when using the cluster module:

```javascript
// Workers are created via the cluster moduleconst cluster = require('cluster');// To access a Worker objectif (cluster.isPrimary) {  // Fork workers  const worker = cluster.fork();    // Now 'worker' is a Worker object}
```

* * *

## Worker Properties

Property

Description

worker.id

Each worker is assigned a unique id.

worker.process

All workers are created using `child_process.fork()`, and this property contains the result of that call.

worker.exitedAfterDisconnect

This property is `true` if the worker exited due to `.kill()` or `.disconnect()`, otherwise it's `undefined`.

worker.isConnected()

Returns `true` if the worker is connected to its primary, otherwise `false`.

worker.isDead()

Returns `true` if the worker's process is terminated (by signal or exit code), otherwise `false`.

* * *

* * *

## Worker Methods

Method

Description

worker.disconnect()

In a worker, this function closes all servers, waits for the 'close' event on those servers, and then disconnects the IPC channel.  
  
In the primary, an internal message is sent to the worker causing it to call `.disconnect()` on itself.

worker.kill(\[signal='SIGTERM'\])

Kills the worker process. This function is the same as `worker.process.kill()`. The optional `signal` parameter specifies what signal to send to the worker.

worker.send(message\[, sendHandle\[, options\]\]\[, callback\])

Sends a message to the worker that is received as a 'message' event. Uses `child_process.send()` internally.

* * *

## Worker Events

Event

Description

'disconnect'

Emitted after a worker IPC channel has disconnected. This occurs when a worker exits gracefully, is killed, or is disconnected manually (using `worker.disconnect()`).

'error'

Emitted if the worker thread throws an uncaught exception.

'exit'

Emitted when the worker process terminates. Listener receives arguments `(code, signal)` where `code` is the exit code and `signal` is the name of the signal that caused the process to terminate.

'listening'

Emitted when a server within a worker starts listening for connections. Listener receives arguments `(address)` with information about the address being used.

'message'

Emitted when a worker receives a message. Listener receives arguments `(message, handle)` where `message` is the sent message and `handle` is a net.Socket or net.Server object or undefined.

'online'

Emitted when the worker process is forked and ready to receive messages.

* * *

## Basic Cluster Example

Here's a basic example of using cluster with Worker objects to create a multi-process HTTP server:

```javascript
const cluster = require('cluster');const http = require('http');const numCPUs = require('os').cpus().length;if (cluster.isPrimary) {  console.log(`Primary ${process.pid} is running`);  // Fork workers  for (let i = 0; i < numCPUs; i++) {    cluster.fork();  }  // Listen for dying workers  cluster.on('exit', (worker, code, signal) => {    console.log(`Worker ${worker.process.pid} died with code: ${code} and signal: ${signal}`);    console.log('Starting a new worker');    cluster.fork();  });    // Event handlers for Worker objects  cluster.on('fork', (worker) => {    console.log(`Worker ${worker.id} (PID: ${worker.process.pid}) has been forked`);  });    cluster.on('online', (worker) => {    console.log(`Worker ${worker.id} is online`);  });    cluster.on('listening', (worker, address) => {    console.log(`Worker ${worker.id} is listening on ${address.address}:${address.port}`);  });    cluster.on('disconnect', (worker) => {    console.log(`Worker ${worker.id} has disconnected`);  });} else {  // Workers can share any TCP connection  // In this case it is an HTTP server  http.createServer((req, res) => {    res.writeHead(200);    res.end(`Hello from Worker ${process.pid}\n`);  }).listen(8000);  console.log(`Worker ${process.pid} started`);}
```

* * *

## Worker Communication

You can send messages between the primary process and worker processes:

```javascript
const cluster = require('cluster');const http = require('http');if (cluster.isPrimary) {  // Keep track of http requests  let numRequests = 0;    // Create two workers  const worker1 = cluster.fork();  const worker2 = cluster.fork();    // Count requests  function messageHandler(msg) {    if (msg.cmd && msg.cmd === 'notifyRequest') {      numRequests += 1;      console.log(`Total requests: ${numRequests}`);    }  }    // Listen for messages from workers  worker1.on('message', messageHandler);  worker2.on('message', messageHandler);    // Send periodic messages to workers  setInterval(() => {    // Send a message to both workers    worker1.send({ cmd: 'updateTime', time: Date.now() });    worker2.send({ cmd: 'updateTime', time: Date.now() });  }, 5000);} else {  // Worker process    // Track the last update time  let lastUpdate = Date.now();    // Receive messages from the primary  process.on('message', (msg) => {    if (msg.cmd && msg.cmd === 'updateTime') {      lastUpdate = msg.time;      console.log(`Worker ${process.pid} received time update: ${new Date(lastUpdate)}`);    }  });    // Create an HTTP server  http.createServer((req, res) => {    // Notify the primary about the request    process.send({ cmd: 'notifyRequest' });        // Respond to the request    res.writeHead(200);    res.end(`Hello from Worker ${process.pid}. Last update: ${new Date(lastUpdate)}\n`);  }).listen(8000);    console.log(`Worker ${process.pid} started`);}
```

* * *

## Graceful Shutdown

Handling graceful shutdown of workers is important for production applications:

```javascript
const cluster = require('cluster');const http = require('http');if (cluster.isPrimary) {  console.log(`Primary ${process.pid} is running`);  // Fork workers  const numCPUs = require('os').cpus().length;  const workers = [];    for (let i = 0; i < numCPUs; i++) {    workers.push(cluster.fork());  }    // Graceful shutdown function  const shutdown = () => {    console.log('Primary: starting graceful shutdown...');        // Disconnect all workers    for (const worker of workers) {      console.log(`Disconnecting worker ${worker.id}`);      worker.disconnect();    }        // Exit after a timeout if workers haven't exited    setTimeout(() => {      console.log('Primary: some workers did not exit, forcing shutdown');      process.exit(1);    }, 5000);  };  // Listen for worker events  cluster.on('exit', (worker, code, signal) => {    console.log(`Worker ${worker.process.pid} died (${signal || code}). ` +                `exitedAfterDisconnect: ${worker.exitedAfterDisconnect}`);        // If it's a planned disconnect, don't restart    if (!worker.exitedAfterDisconnect) {      console.log('Worker died unexpectedly, replacing it...');      workers.push(cluster.fork());    }        // Check if all workers are gone    let activeWorkers = 0;    for (const id in cluster.workers) {      activeWorkers++;    }        console.log(`Active workers: ${activeWorkers}`);        if (activeWorkers === 0) {      console.log('All workers have exited, shutting down primary');      process.exit(0);    }  });  // Handle signals for graceful shutdown  process.on('SIGTERM', shutdown);  process.on('SIGINT', shutdown);} else {  // Worker process    // Create a server  const server = http.createServer((req, res) => {    res.writeHead(200);    res.end(`Hello from worker ${process.pid}\n`);  });    server.listen(8000);    console.log(`Worker ${process.pid} started`);    // Handle disconnect signal from primary  process.on('disconnect', () => {    console.log(`Worker ${process.pid} disconnected, closing server...`);        // Close the server    server.close(() => {      console.log(`Worker ${process.pid} closed server, exiting`);      process.exit(0);    });        // Forcefully exit after timeout    setTimeout(() => {      console.log(`Worker ${process.pid} timed out closing server, forcing exit`);      process.exit(1);    }, 2000);  });}
```

* * *

## Worker Zero-Downtime Restart

Implementing a zero-downtime restart pattern for rolling worker updates:

```javascript
const cluster = require('cluster');const http = require('http');const numCPUs = require('os').cpus().length;if (cluster.isPrimary) {  console.log(`Primary ${process.pid} is running`);  // Fork initial workers  for (let i = 0; i < numCPUs; i++) {    cluster.fork();  }  // Store worker refs  let workers = Object.values(cluster.workers);  // Restart one worker at a time  function restartWorker(workerIndex) {    const worker = workers[workerIndex];    console.log(`Restarting worker #${worker.id}`);    // Create a new worker    const newWorker = cluster.fork();        // Add the new worker to our array    workers.push(newWorker);        // When the new worker is online, disconnect the old worker    newWorker.on('online', () => {      if (worker) {        console.log(`New worker #${newWorker.id} is online, disconnecting old worker #${worker.id}`);        worker.disconnect();      }    });    // When the old worker is disconnected, remove it from the array    worker.on('disconnect', () => {      console.log(`Worker #${worker.id} disconnected`);      workers = workers.filter(w => w.id !== worker.id);    });    // Continue the process if there are more workers to restart    if (workerIndex + 1 < workers.length) {      setTimeout(() => {        restartWorker(workerIndex + 1);      }, 5000);    }  }  // Example: trigger a rolling restart after 15 seconds  setTimeout(() => {    console.log('Starting rolling restart of workers...');    restartWorker(0);  }, 15000);  // Additional event handlers  cluster.on('exit', (worker, code, signal) => {    console.log(`Worker ${worker.process.pid} exited with code ${code}`);  });} else {  // Worker process  http.createServer((req, res) => {    res.writeHead(200);    res.end(`Hello from worker ${process.pid}, started at ${new Date().toISOString()}\n`);  }).listen(8000);  console.log(`Worker ${process.pid} started`);}
```

* * *

## Worker Status Monitoring

Monitoring worker status and collecting metrics:

```javascript
const cluster = require('cluster');const http = require('http');const os = require('os');if (cluster.isPrimary) {  console.log(`Primary ${process.pid} is running`);  // Fork workers  const workers = [];  for (let i = 0; i < os.cpus().length; i++) {    workers.push(cluster.fork());  }  // Store metrics for each worker  const workerMetrics = {};  // Set up metrics collection  for (const worker of workers) {    workerMetrics[worker.id] = {      id: worker.id,      pid: worker.process.pid,      requests: 0,      errors: 0,      lastActive: Date.now(),      memoryUsage: {}    };    // Handle messages from workers    worker.on('message', (msg) => {      if (msg.type === 'metrics') {        // Update metrics        workerMetrics[worker.id] = {          ...workerMetrics[worker.id],          ...msg.data,          lastActive: Date.now()        };      }    });  }  // Create an HTTP server for monitoring  http.createServer((req, res) => {    if (req.url === '/metrics') {      res.writeHead(200, { 'Content-Type': 'application/json' });      res.end(JSON.stringify({        workers: Object.values(workerMetrics),        system: {          loadAvg: os.loadavg(),          totalMem: os.totalmem(),          freeMem: os.freemem(),          uptime: os.uptime()        }      }, null, 2));    } else {      res.writeHead(404);      res.end('Not found');    }  }).listen(8001);  console.log('Primary: Monitoring server running on port 8001');  // Check for unresponsive workers  setInterval(() => {    const now = Date.now();        for (const worker of workers) {      const metrics = workerMetrics[worker.id];            // If worker hasn't reported in 30 seconds      if (now - metrics.lastActive > 80800) {        console.warn(`Worker ${worker.id} appears unresponsive, restarting...`);                // Kill the unresponsive worker        worker.kill();                // Fork a replacement        const newWorker = cluster.fork();                // Set up metrics for new worker        workerMetrics[newWorker.id] = {          id: newWorker.id,          pid: newWorker.process.pid,          requests: 0,          errors: 0,          lastActive: Date.now(),          memoryUsage: {}        };                // Replace in workers array        const index = workers.indexOf(worker);        if (index !== -1) {          workers[index] = newWorker;        }                // Clean up old metrics        delete workerMetrics[worker.id];      }    }  }, 10000);} else {  // Worker process  console.log(`Worker ${process.pid} started`);    // Track metrics  let requestCount = 0;  let errorCount = 0;    // Report metrics to primary every 5 seconds  setInterval(() => {    process.send({      type: 'metrics',      data: {        requests: requestCount,        errors: errorCount,        memoryUsage: process.memoryUsage()      }    });  }, 5000);  // Create HTTP server  http.createServer((req, res) => {    requestCount++;        try {      res.writeHead(200);      res.end(`Hello from worker ${process.pid}\n`);    } catch (error) {      errorCount++;      console.error(`Worker ${process.pid} error:`, error);    }  }).listen(8000);}
```

* * *

## Worker Best Practices

### 1\. Ensure State Isolation

Keep worker processes stateless or ensure proper state management:

```javascript
// BAD - State shared across forked processes won't work as expectedlet requestCount = 0;// GOOD - Each worker has its own isolated stateif (cluster.isPrimary) {  // Primary logic} else {  // Worker-specific state  let workerRequestCount = 0;}
```

### 2\. Handle Unexpected Worker Termination

```javascript
if (cluster.isPrimary) {  cluster.on('exit', (worker, code, signal) => {    if (code !== 0 && !worker.exitedAfterDisconnect) {      console.log(`Worker ${worker.id} crashed. Restarting...`);      cluster.fork();    }  });}
```

### 3\. Use Worker Sticky Sessions

```javascript
const cluster = require('cluster');const http = require('http');if (cluster.isPrimary) {  // Setup sticky session logic  cluster.schedulingPolicy = cluster.SCHED_NONE;    // Start workers  const numCPUs = require('os').cpus().length;  for (let i = 0; i < numCPUs; i++) {    cluster.fork();  }    // Create routes based on connection's remote IP  cluster.on('connection', (connection, address) => {    // Calculate which worker gets connection based on IP    const worker = Object.values(cluster.workers)[      Number(address.toString().split(':')[3]) % Object.keys(cluster.workers).length    ];    worker.send('sticky-session:connection', connection);  });} else {  // Worker code  http.createServer((req, res) => {    res.end(`Handled by worker ${process.pid}`);  }).listen(8000, () => {    console.log(`Worker ${process.pid} listening`);  });    // Receive sticky connections  process.on('message', (message, connection) => {    if (message !== 'sticky-session:connection') return;        // Emulate a connection event on the server    server.emit('connection', connection);    connection.resume();  });}
```

* * *