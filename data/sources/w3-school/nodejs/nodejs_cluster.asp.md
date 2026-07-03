# Node.js Cluster Module

* * *

## What is the Cluster Module?

The Cluster module provides a way to create multiple worker processes that share the same server port.

Since Node.js is single-threaded by default, the Cluster module helps your application utilize multiple CPU cores, significantly improving performance on multi-core systems.

Each worker runs in its own process with its own event loop and memory space, but they all share the same server port.

The master process is responsible for creating workers and distributing incoming connections among them.

* * *

## Importing the Cluster Module

The Cluster module is included in Node.js by default.

You can use it by requiring it in your script:

```javascript
const cluster = require('cluster');const os = require('os');// Check if this is the master processif (cluster.isMaster) {  console.log(`Master process ${process.pid} is running`);} else {  console.log(`Worker process ${process.pid} started`);}
```

* * *

## How Clustering Works

The Cluster module works by creating a master process that spawns multiple worker processes.

The master process doesn't execute the application code but manages the workers.

Each worker process is a new Node.js instance that runs your application code independently.

**Note:** Under the hood, the Cluster module uses the Child Process module's `fork()` method to create new workers.

Process Type

Responsibility

**Master**

*   Creating and managing worker processes
*   Monitoring worker health
*   Restarting crashed workers
*   Load balancing (distributing connections)

**Worker**

*   Running the actual application code
*   Handling incoming requests
*   Processing data
*   Executing business logic

* * *

* * *

## Creating a Basic Cluster

Here's a simple example of creating a cluster with worker processes for each CPU:

```javascript
const cluster = require('cluster');const http = require('http');const numCPUs = require('os').cpus().length;if (cluster.isMaster) {  // This is the master process  console.log(`Master ${process.pid} is running`);  // Fork workers for each CPU core  for (let i = 0; i < numCPUs; i++) {    cluster.fork();  }  // Listen for worker exits  cluster.on('exit', (worker, code, signal) => {    console.log(`Worker ${worker.process.pid} died`);    // You can fork a new worker to replace the dead one    console.log('Forking a new worker...');    cluster.fork();  });} else {  // This is a worker process  // Create an HTTP server  http.createServer((req, res) => {    res.writeHead(200);    res.end(`Hello from Worker ${process.pid}\n`);    // Simulate CPU work    let i = 1e7;    while (i > 0) { i--; }  }).listen(8000);  console.log(`Worker ${process.pid} started`);}
```

In this example:

1.  The master process detects the number of CPU cores
2.  It forks one worker per CPU
3.  Each worker creates an HTTP server on the same port (8000)
4.  The cluster module automatically load balances the incoming connections
5.  If a worker crashes, the master creates a new one

* * *

## Worker Communication

You can communicate between master and worker processes using the `send()` method and `message` events, similar to how IPC works in the Child Process module.

```javascript
const cluster = require('cluster');const http = require('http');const numCPUs = require('os').cpus().length;if (cluster.isMaster) {  console.log(`Master ${process.pid} is running`);  // Track request count for each worker  const requestCounts = {};  // Fork workers  for (let i = 0; i < numCPUs; i++) {    const worker = cluster.fork();    requestCounts[worker.id] = 0;    // Listen for messages from this worker    worker.on('message', (msg) => {      if (msg.cmd === 'incrementRequestCount') {        requestCounts[worker.id]++;        console.log(`Worker ${worker.id} (pid ${worker.process.pid}) has handled ${requestCounts[worker.id]} requests`);      }    });  }  // Every 10 seconds, send the request count to each worker  setInterval(() => {    for (const id in cluster.workers) {      cluster.workers[id].send({        cmd: 'requestCount',        requestCount: requestCounts[id]      });    }    console.log('Total request counts:', requestCounts);  }, 10000);  // Handle worker exit  cluster.on('exit', (worker, code, signal) => {    console.log(`Worker ${worker.process.pid} died`);    // Fork a new worker to replace it    const newWorker = cluster.fork();    requestCounts[newWorker.id] = 0;  });} else {  // Worker process  console.log(`Worker ${process.pid} started`);  let localRequestCount = 0;  // Handle messages from the master  process.on('message', (msg) => {    if (msg.cmd === 'requestCount') {      console.log(`Worker ${process.pid} has handled ${msg.requestCount} requests according to master`);    }  });  // Create an HTTP server  http.createServer((req, res) => {    // Notify the master that we handled a request    process.send({ cmd: 'incrementRequestCount' });    // Increment local count    localRequestCount++;    // Send response    res.writeHead(200);    res.end(`Hello from Worker ${process.pid}, I've handled ${localRequestCount} requests locally\n`);  }).listen(8000);}
```

* * *

## Zero-Downtime Restart

One of the main benefits of clustering is the ability to restart workers without downtime. This is useful for deploying updates to your application.

```javascript
const cluster = require('cluster');const http = require('http');const numCPUs = require('os').cpus().length;if (cluster.isMaster) {  console.log(`Master ${process.pid} is running`);  // Store workers  const workers = [];  // Fork initial workers  for (let i = 0; i < numCPUs; i++) {    workers.push(cluster.fork());  }  // Function to restart workers one by one  function restartWorkers() {    console.log('Starting zero-downtime restart...');        let i = 0;    function restartWorker() {      if (i >= workers.length) {        console.log('All workers restarted successfully!');        return;      }      const worker = workers[i++];      console.log(`Restarting worker ${worker.process.pid}...`);      // Create a new worker      const newWorker = cluster.fork();      newWorker.on('listening', () => {        // Once the new worker is listening, kill the old one        worker.disconnect();        // Replace the old worker in our array        workers[workers.indexOf(worker)] = newWorker;        // Continue with the next worker        setTimeout(restartWorker, 1000);      });    }    // Start the recursive process    restartWorker();  }    // Simulate a restart after 20 seconds  setTimeout(restartWorkers, 20000);  // Handle normal worker exit  cluster.on('exit', (worker, code, signal) => {    if (worker.exitedAfterDisconnect !== true) {      console.log(`Worker ${worker.process.pid} died unexpectedly, replacing it...`);      const newWorker = cluster.fork();      workers[workers.indexOf(worker)] = newWorker;    }  });} else {  // Worker process  // Create an HTTP server  http.createServer((req, res) => {    res.writeHead(200);    res.end(`Worker ${process.pid} responding, uptime: ${process.uptime().toFixed(2)} seconds\n`);  }).listen(8000);  console.log(`Worker ${process.pid} started`);}
```

This example demonstrates:

1.  Creating an initial set of workers
2.  Replacing each worker one by one
3.  Ensuring a new worker is listening before disconnecting the old one
4.  Gracefully handling unexpected worker deaths

* * *

## Load Balancing

The Cluster module has built-in load balancing for distributing incoming connections among worker processes.

There are two primary strategies:

### Round-Robin (default)

By default on all platforms except Windows, Node.js distributes connections using a round-robin approach, where the master accepts connections and distributes them across workers in a circular sequence.

**Note:** On Windows, the load distribution behaves differently due to how Windows handles ports. In Windows, the workers compete to accept connections.

### Primary Worker

You can also let each worker accept connections directly by setting `cluster.schedulingPolicy`:

```javascript
const cluster = require('cluster');const http = require('http');const numCPUs = require('os').cpus().length;// Set the scheduling policy to SCHED_NONE (let workers accept connections themselves)cluster.schedulingPolicy = cluster.SCHED_NONE;if (cluster.isMaster) {  console.log(`Master ${process.pid} is running`);  // Fork workers  for (let i = 0; i < numCPUs; i++) {    cluster.fork();  }  cluster.on('exit', (worker, code, signal) => {    console.log(`Worker ${worker.process.pid} died`);    cluster.fork();  });} else {  // Worker process  http.createServer((req, res) => {    res.writeHead(200);    res.end(`Hello from Worker ${process.pid}\n`);  }).listen(8000);  console.log(`Worker ${process.pid} started`);}
```

* * *

## Shared State

Since each worker runs in its own process with its own memory space, they cannot directly share state via variables. Instead, you can:

1.  Use IPC messaging (as shown in the communication example)
2.  Use external storage like Redis, MongoDB, or a file system
3.  Use sticky load balancing for session management

### Sticky Sessions Example

Sticky sessions ensure that requests from the same client always go to the same worker process:

```javascript
const cluster = require('cluster');const http = require('http');const numCPUs = require('os').cpus().length;if (cluster.isMaster) {  console.log(`Master ${process.pid} is running`);  // Fork workers  for (let i = 0; i < numCPUs; i++) {    cluster.fork();  }  // Store worker references by id  const workers = {};  for (const id in cluster.workers) {    workers[id] = cluster.workers[id];  }  // Create a server to route connections to workers  const server = http.createServer((req, res) => {    // Get client IP    const clientIP = req.connection.remoteAddress || req.socket.remoteAddress;    // Simple hash function to determine which worker to use    const workerIndex = clientIP.split('.').reduce((a, b) => a + parseInt(b), 0) % numCPUs;    const workerIds = Object.keys(workers);    const workerId = workerIds[workerIndex];    // Send the request to the selected worker    workers[workerId].send('sticky-session:connection', req.connection);    res.end(`Request routed to worker ${workerId}`);  }).listen(8000);  console.log('Master server listening on port 8000');  // Handle worker exit  cluster.on('exit', (worker, code, signal) => {    console.log(`Worker ${worker.process.pid} died`);    // Remove the dead worker    delete workers[worker.id];    // Create a replacement    const newWorker = cluster.fork();    workers[newWorker.id] = newWorker;  });} else {  // Worker process - just demonstrates the concept  // In a real implementation, you'd need more socket handling  process.on('message', (msg, socket) => {    if (msg === 'sticky-session:connection' && socket) {      console.log(`Worker ${process.pid} received sticky connection`);            // In a real implementation, you'd handle the socket here      // socket.end(`Handled by worker ${process.pid}\n`);    }  });  // Workers would also run their own server  http.createServer((req, res) => {    res.writeHead(200);    res.end(`Direct request to Worker ${process.pid}\n`);  }).listen(8001);  console.log(`Worker ${process.pid} started`);}
```

This is a simplified example showing the concept of sticky sessions. In production, you'd typically:

1.  Use a more sophisticated hashing algorithm
2.  Use cookies or other session identifiers instead of IP addresses
3.  Handle socket connections more carefully

* * *

## Worker Lifecycle

Understanding the worker lifecycle is important for properly managing your cluster:

Event

Description

`fork`

Emitted when a new worker is forked

`online`

Emitted when the worker is running and ready to process messages

`listening`

Emitted when the worker starts listening for connections

`disconnect`

Emitted when a worker's IPC channel is disconnected

`exit`

Emitted when a worker process exits

```javascript
const cluster = require('cluster');const http = require('http');if (cluster.isMaster) {  console.log(`Master ${process.pid} is running`);  // Fork a worker  const worker = cluster.fork();  // Listen for all worker lifecycle events  worker.on('fork', () => {    console.log(`Worker ${worker.process.pid} is being forked`);  });  worker.on('online', () => {    console.log(`Worker ${worker.process.pid} is online`);  });  worker.on('listening', (address) => {    console.log(`Worker ${worker.process.pid} is listening on port ${address.port}`);  });  worker.on('disconnect', () => {    console.log(`Worker ${worker.process.pid} has disconnected`);  });  worker.on('exit', (code, signal) => {    console.log(`Worker ${worker.process.pid} exited with code ${code} and signal ${signal}`);     if (signal) {      console.log(`Worker was killed by signal: ${signal}`);    } else if (code !== 0) {      console.log(`Worker exited with error code: ${code}`);    } else {      console.log('Worker exited successfully');    }  });  // After 10 seconds, gracefully disconnect the worker  setTimeout(() => {    console.log('Gracefully disconnecting worker...');    worker.disconnect();  }, 10000);} else {  // Worker process  console.log(`Worker ${process.pid} started`);  // Create an HTTP server  http.createServer((req, res) => {    res.writeHead(200);    res.end(`Hello from Worker ${process.pid}\n`);  }).listen(8000);  // If worker is disconnected, close the server  process.on('disconnect', () => {    console.log(`Worker ${process.pid} disconnected, closing server...`);    // In a real application, you'd want to close all connections and clean up resources    process.exit(0);  });}
```

* * *

## Graceful Shutdown

A graceful shutdown is important to allow your worker processes to finish handling existing requests before they exit.

```javascript
const cluster = require('cluster');const http = require('http');const numCPUs = require('os').cpus().length;if (cluster.isMaster) {  console.log(`Master ${process.pid} is running`);  // Fork workers  for (let i = 0; i < numCPUs; i++) {    cluster.fork();  }  // Handle termination signals  process.on('SIGTERM', () => {    console.log('Master received SIGTERM, initiating graceful shutdown...');    // Notify all workers to finish their work and exit    Object.values(cluster.workers).forEach(worker => {      console.log(`Sending SIGTERM to worker ${worker.process.pid}`);      worker.send('shutdown');    });    // Set a timeout to force-kill workers if they don't exit gracefully    setTimeout(() => {      console.log('Some workers did not exit gracefully, forcing shutdown...');      Object.values(cluster.workers).forEach(worker => {        if (!worker.isDead()) {          console.log(`Killing worker ${worker.process.pid}`);          worker.process.kill('SIGKILL');        }    });    // Exit the master    console.log('All workers terminated, exiting master...');    process.exit(0);  }, 5000);  });  // Handle worker exits  cluster.on('exit', (worker, code, signal) => {    console.log(`Worker ${worker.process.pid} exited (${signal || code})`);    // If all workers have exited, exit the master    if (Object.keys(cluster.workers).length === 0) {      console.log('All workers have exited, shutting down master...');      process.exit(0);    }  });  // Log to show the master is ready  console.log(`Master ${process.pid} is ready with ${Object.keys(cluster.workers).length} workers`);  console.log('Send SIGTERM to the master process to initiate graceful shutdown');} else {  // Worker process  console.log(`Worker ${process.pid} started`);  // Track if we're shutting down  let isShuttingDown = false;  let activeConnections = 0;  // Create HTTP server  const server = http.createServer((req, res) => {     // Track active connection     activeConnections++;    // Simulate a slow response    setTimeout(() => {      res.writeHead(200);      res.end(`Hello from Worker ${process.pid}\n`);      // Connection complete      activeConnections--;      // If we're shutting down and no active connections, close the server      if (isShuttingDown && activeConnections === 0) {        console.log(`Worker ${process.pid} has no active connections, closing server...`);        server.close(() => {          console.log(`Worker ${process.pid} closed server, exiting...`);          process.exit(0);        });      }    }, 2000);  });  // Start server  server.listen(8000);  // Handle shutdown message from master  process.on('message', (msg) => {     if (msg === 'shutdown') {      console.log(`Worker ${process.pid} received shutdown message, stopping new connections...`);      // Set shutdown flag      isShuttingDown = true;      // Stop accepting new connections      server.close(() => {        console.log(`Worker ${process.pid} closed server`);      // If no active connections, exit immediately      if (activeConnections === 0) {        console.log(`Worker ${process.pid} has no active connections, exiting...`);        process.exit(0);      } else {        console.log(`Worker ${process.pid} waiting for ${activeConnections} connections to finish...`);      }    });  }  });  // Also handle direct termination signal  process.on('SIGTERM', () => {    console.log(`Worker ${process.pid} received SIGTERM directly`);    // Use the same shutdown logic    isShuttingDown = true;    server.close(() => process.exit(0));  });}
```

* * *

## Best Practices

*   **Number of Workers:** In most cases, create one worker per CPU core
*   **Stateless Design:** Design your application to be stateless to work effectively with clusters
*   **Graceful Shutdown:** Implement proper shutdown handling to avoid dropping connections
*   **Worker Monitoring:** Monitor and replace crashed workers promptly
*   **Database Connections:** Each worker has its own connection pool, so configure database connections appropriately
*   **Shared Resources:** Be careful with resources shared between workers (e.g., file locks)
*   **Keep Workers Lean:** Avoid unnecessary memory usage in worker processes

**Warning:** Be careful with file-based locking and other shared resources when using multiple workers. Operations that were safe in a single-process application may cause race conditions with multiple workers.

* * *

## Alternatives to the Cluster Module

While the Cluster module is powerful, there are alternatives for running Node.js applications on multiple cores:

Approach

Description

Use Case

**PM2**

A process manager for Node.js applications with built-in load balancing and clustering

Production applications that need robust process management

**Load Balancer**

Running multiple Node.js instances behind a load balancer like Nginx

Distributing load across multiple servers or containers

**Worker Threads**

Lighter-weight threading for CPU-intensive tasks (Node.js >= 10.5.0)

CPU-intensive operations within a single process

**Containers**

Running multiple containerized instances (e.g., with Docker and Kubernetes)

Scalable, distributed applications in modern cloud environments

* * *

## Advanced Load Balancing Strategies

While the Cluster module's default round-robin load balancing works well for many applications, you might need more sophisticated strategies for specific use cases.

### 1\. Weighted Round-Robin

```javascript
const cluster = require('cluster');const http = require('http');const os = require('os');if (cluster.isMaster) {  console.log(`Master ${process.pid} is running`);  // Create workers with different weights  const workerWeights = [3, 2, 1]; // First worker gets 3x more load than the last  const workers = [];  // Create workers based on weights  workerWeights.forEach((weight, index) => {    for (let i = 0; i < weight; i++) {      const worker = cluster.fork({ WORKER_WEIGHT: weight });      worker.weight = weight;      workers.push(worker);    }  });  // Track the next worker to use  let workerIndex = 0;  // Create a load balancer server  http.createServer((req, res) => {    // Simple round-robin with weights    const worker = workers[workerIndex++ % workers.length];    worker.send('handle-request', req.socket);  }).listen(8000);} else {   // Worker code  process.on('message', (message, socket) => {    if (message === 'handle-request' && socket) {      // Handle the request      socket.end(`Handled by worker ${process.pid}\n`);    }  });}
```

### 2\. Least Connections

```javascript
const cluster = require('cluster');const http = require('http');if (cluster.isMaster) {  console.log(`Master ${process.pid} is running`);  // Create workers and track their connection counts  const workers = [];  const numCPUs = require('os').cpus().length;  for (let i = 0; i < numCPUs; i++) {    const worker = cluster.fork();    worker.connectionCount = 0;    workers.push(worker);    // Track worker connections    worker.on('message', (msg) => {       if (msg.type === 'connection') {         worker.connectionCount = msg.count;       }     });  }  // Create load balancer  http.createServer((req, res) => {    // Find worker with least connections    let minConnections = Infinity;    let selectedWorker = null;    for (const worker of workers) {      if (worker.connectionCount < minConnections) {        minConnections = worker.connectionCount;        selectedWorker = worker;      }    }    if (selectedWorker) {      selectedWorker.send('handle-request', req.socket);    }  }).listen(8000);}
```

* * *

## Performance Monitoring and Metrics

Monitoring your cluster's performance is crucial for maintaining a healthy application. Here's how to implement basic metrics collection:

```javascript
const cluster = require('cluster');const os = require('os');const promClient = require('prom-client');if (cluster.isMaster) {  // Create metrics registry  const register = new promClient.Registry();  promClient.collectDefaultMetrics({ register });  // Custom metrics  const workerRequests = new promClient.Counter({    name: 'worker_requests_total',    help: 'Total requests handled by worker',    labelNames: ['worker_pid']  });register.registerMetric(workerRequests);  // Fork workers  for (let i = 0; i < os.cpus().length; i++) {    const worker = cluster.fork();    worker.on('message', (msg) => {      if (msg.type === 'request_processed') {        workerRequests.inc({ worker_pid: worker.process.pid });      }    });  }  // Expose metrics endpoint  require('http').createServer(async (req, res) => {    if (req.url === '/metrics') {      res.setHeader('Content-Type', register.contentType);      res.end(await register.metrics());    }  }).listen(9090);} else {  // Worker code  let requestCount = 0;  require('http').createServer((req, res) => {    requestCount++;    process.send({ type: 'request_processed' });    res.end(`Request ${requestCount} handled by worker ${process.pid}\n`);  }).listen(8000);}
```

### Key Metrics to Monitor

*   **Request Rate:** Requests per second per worker
*   **Error Rate:** Error responses per second
*   **Response Time:** P50, P90, P99 response times
*   **CPU Usage:** Per-worker CPU utilization
*   **Memory Usage:** Heap and RSS memory per worker
*   **Event Loop Lag:** Delay in the event loop

* * *

## Container Integration

When running in containerized environments like Docker and Kubernetes, consider these best practices:

### 1\. Process Management

```javascript
// Dockerfile example for a Node.js cluster appFROM node:16-slimWORKDIR /appCOPY package*.json ./RUN npm install --production# Copy application codeCOPY . .# Use the node process as PID 1 for proper signal handlingCMD ["node", "cluster.js"]# Health checkHEALTHCHECK --interval=30s --timeout=3s \CMD curl -f http://localhost:8080/health || exit 1
```

### 2\. Kubernetes Deployment

```javascript
# k8s-deployment.yamlapiVersion: apps/v1kind: Deploymentmetadata:  name: node-cluster-appspec:  replicas: 3 # Number of pods  selector:    matchLabels:      app: node-cluster  template:    metadata:      labels:        app: node-cluster    spec:      containers:      - name: node-app        image: your-image:latest        ports:          - containerPort: 8000        resources:          requests:            cpu: "500m"            memory: "512Mi"        limits:          cpu: "1000m"          memory: "1Gi"        livenessProbe:          httpGet:            path: /health            port: 8000            initialDelaySeconds: 5            periodSeconds: 10        readinessProbe:          httpGet:            path: /ready            port: 8000            initialDelaySeconds: 5            periodSeconds: 10
```

* * *

## Common Pitfalls and Solutions

### 1\. Memory Leaks in Workers

**Problem:** Memory leaks in worker processes can cause gradual memory growth.

**Solution:** Implement worker recycling based on memory usage.

```javascript
// In worker processconst MAX_MEMORY_MB = 500; // Max memory in MB before recyclingfunction checkMemory() {  const memoryUsage = process.memoryUsage();  const memoryMB = memoryUsage.heapUsed / 1024 / 1024;  if (memoryMB > MAX_MEMORY_MB) {    console.log(`Worker ${process.pid} memory ${memoryMB.toFixed(2)}MB exceeds limit, exiting...`);    process.exit(1); // Let cluster restart the worker  }}// Check memory every 30 secondssetInterval(checkMemory, 30000);
```

### 2\. Thundering Herd Problem

**Problem:** All workers accepting connections simultaneously after a restart.

**Solution:** Implement staggered startup.

```javascript
// In master processif (cluster.isMaster) {  const numWorkers = require('os').cpus().length;  function forkWorker(delay) {    setTimeout(() => {      const worker = cluster.fork();      console.log(`Worker ${worker.process.pid} started after ${delay}ms delay`);    }, delay);  }  // Stagger worker starts by 1 second  for (let i = 0; i < numWorkers; i++) {    forkWorker(i * 1000);  }}
```

### 3\. Worker Starvation

**Problem:** Some workers get more load than others.

**Solution:** Implement proper load balancing and monitoring.

```javascript
// Track request distributionconst requestDistribution = new Map();// In master processif (cluster.isMaster) {  // ...  // Monitor request distribution  setInterval(() => {    console.log('Request distribution:');    requestDistribution.forEach((count, pid) => {      console.log(` Worker ${pid}: ${count} requests`);    });  }, 60000);  // Track requests per worker  cluster.on('message', (worker, message) => {    if (message.type === 'request_handled') {      const count = requestDistribution.get(worker.process.pid) || 0;      requestDistribution.set(worker.process.pid, count + 1);    }  });}
```

* * *

## Summary

The Node.js Cluster module provides an efficient way to scale your application across multiple CPU cores:

*   Creates a master process that manages multiple worker processes
*   Workers share the same server port, allowing load balancing
*   Improves application performance and resilience
*   Enables zero-downtime restarts and graceful shutdowns
*   Uses IPC for communication between master and workers

By understanding and properly implementing clustering, you can build high-performance, reliable Node.js applications that efficiently utilize all available CPU resources.

* * *

* * *