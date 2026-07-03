# Node.js Performance Hooks Module

* * *

## What are Performance Hooks?

The `perf_hooks` module provides a set of APIs for performance measurement based on the [W3C Performance Timeline specification](https://www.w3.org/TR/performance-timeline/).

These tools are essential for:

*   Measuring the time taken by specific operations
*   Finding performance bottlenecks
*   Comparing the performance of different implementations
*   Tracking application performance over time

The module includes several useful features such as high-resolution timers, performance marks, measures, observers, and histograms.

* * *

## Using the Performance Hooks Module

To use the Performance Hooks module, you need to require it in your code:

```javascript
// Import the entire moduleconst { performance, PerformanceObserver } = require('perf_hooks');// Or using destructuring for specific partsconst { performance } = require('perf_hooks');
```

* * *

## Basic Time Measurement

The most basic use of the performance API is to measure elapsed time with high precision:

```javascript
const { performance } = require('perf_hooks');// Get the current high-resolution timeconst startTime = performance.now();// Perform some operationlet sum = 0;for (let i = 0; i < 1000000; i++) {  sum += i;}// Get the end timeconst endTime = performance.now();// Calculate and display the elapsed time in millisecondsconsole.log(`Operation took ${(endTime - startTime).toFixed(2)} milliseconds`);
```

The `performance.now()` method returns a high-resolution timestamp in milliseconds, measured from the time the current Node.js process started.

* * *

* * *

## Performance Marks and Measures

### Marks

Performance marks are specific points in time that you want to track:

```javascript
const { performance } = require('perf_hooks');// Create marks at specific points in your codeperformance.mark('startProcess');// Simulate some worklet result = 0;for (let i = 0; i < 1000000; i++) {  result += Math.sqrt(i);}// Create another markperformance.mark('endProcess');// Get all the marksconsole.log(performance.getEntriesByType('mark'));
```

### Measures

Performance measures calculate the time duration between two marks:

```javascript
const { performance } = require('perf_hooks');// Create a start markperformance.mark('start');// Simulate some worklet result = 0;for (let i = 0; i < 1000000; i++) {  result += Math.sqrt(i);}// Create an end markperformance.mark('end');// Create a measure between the two marksperformance.measure('processTime', 'start', 'end');// Get the measureconst measure = performance.getEntriesByName('processTime')[0];console.log(`Process took ${measure.duration.toFixed(2)} milliseconds`);// Clear marks and measuresperformance.clearMarks();performance.clearMeasures();
```

* * *

## Performance Observer

The `PerformanceObserver` allows you to observe performance events asynchronously:

```javascript
const { performance, PerformanceObserver } = require('perf_hooks');// Create a performance observerconst obs = new PerformanceObserver((items) => {  // Process all entries  const entries = items.getEntries();  entries.forEach((entry) => {    console.log(`Name: ${entry.name}, Type: ${entry.entryType}, Duration: ${entry.duration.toFixed(2)}ms`);  });});// Subscribe to specific entry typesobs.observe({ entryTypes: ['measure'] });// First taskperformance.mark('task1Start');// Simulate worksetTimeout(() => {  performance.mark('task1End');  performance.measure('Task 1', 'task1Start', 'task1End');    // Second task  performance.mark('task2Start');  setTimeout(() => {    performance.mark('task2End');    performance.measure('Task 2', 'task2Start', 'task2End');        // Clean up    performance.clearMarks();    performance.clearMeasures();    obs.disconnect();  }, 1000);}, 1000);
```

* * *

## Performance Timeline API

The Performance Timeline API provides methods to retrieve performance entries:

```javascript
const { performance } = require('perf_hooks');// Create some performance entriesperformance.mark('mark1');performance.mark('mark2');let sum = 0;for (let i = 0; i < 100000; i++) {  sum += i;}performance.mark('mark3');performance.measure('measure1', 'mark1', 'mark2');performance.measure('measure2', 'mark2', 'mark3');// Get all performance entriesconsole.log('All entries:');console.log(performance.getEntries());// Get entries by typeconsole.log('\nMarks:');console.log(performance.getEntriesByType('mark'));// Get entries by nameconsole.log('\nMeasure 1:');console.log(performance.getEntriesByName('measure1'));
```

* * *

## Performance Timing Levels

Node.js provides different performance timing APIs with varying levels of precision:

```javascript
const { performance, monitorEventLoopDelay } = require('perf_hooks');// 1. Date.now() - millisecond precisionconst dateStart = Date.now();const dateEnd = Date.now();console.log(`Date.now() difference: ${dateEnd - dateStart}ms`);// 2. process.hrtime() - nanosecond precisionconst hrStart = process.hrtime();const hrEnd = process.hrtime(hrStart);console.log(`process.hrtime() difference: ${hrEnd[0]}s ${hrEnd[1]}ns`);// 3. performance.now() - microsecond precisionconst perfStart = performance.now();const perfEnd = performance.now();console.log(`performance.now() difference: ${(perfEnd - perfStart).toFixed(6)}ms`);// 4. Event loop delay monitoring (available in Node.js 12.0.0+)const histogram = monitorEventLoopDelay({ resolution: 20 });histogram.enable();setTimeout(() => {  histogram.disable();  console.log('Event loop delay metrics:');  console.log(`  Min: ${histogram.min}ns`);  console.log(`  Max: ${histogram.max}ns`);  console.log(`  Mean: ${histogram.mean.toFixed(2)}ns`);  console.log(`  Stddev: ${histogram.stddev.toFixed(2)}ns`);  console.log(`  Percentiles: 50=${histogram.percentile(50).toFixed(2)}ns, 99=${histogram.percentile(99).toFixed(2)}ns`);}, 1000);
```

* * *

## Event Loop Monitoring

The `monitorEventLoopDelay` function provides a way to monitor the delay in the event loop:

```javascript
const { monitorEventLoopDelay } = require('perf_hooks');// Create a histogramconst histogram = monitorEventLoopDelay({ resolution: 10 });// Enable monitoringhistogram.enable();// Simulate load on the event loopconst operations = [];for (let i = 0; i < 10; i++) {  operations.push(new Promise((resolve) => {    setTimeout(() => {      // Simulate CPU-intensive work      let sum = 0;      for (let j = 0; j < 10000000; j++) {        sum += j;      }      resolve(sum);    }, 100);  }));}// After all operations completePromise.all(operations).then(() => {  // Disable monitoring  histogram.disable();    // Print statistics  console.log('Event Loop Delay Statistics:');  console.log(`  Min: ${histogram.min}ns`);  console.log(`  Max: ${histogram.max}ns`);  console.log(`  Mean: ${histogram.mean.toFixed(2)}ns`);  console.log(`  Stddev: ${histogram.stddev.toFixed(2)}ns`);    // Percentiles  console.log('\nPercentiles:');  [1, 10, 50, 90, 99, 99.9].forEach((p) => {    console.log(`  p${p}: ${histogram.percentile(p).toFixed(2)}ns`);  });});
```

Event loop monitoring is particularly useful for detecting when your application might be experiencing issues with responsiveness due to long-running tasks blocking the event loop.

* * *

## Performance Tracking in Async Operations

Tracking performance in asynchronous operations requires careful mark placement:

```javascript
const { performance, PerformanceObserver } = require('perf_hooks');const fs = require('fs');// Create observer for the measuresconst obs = new PerformanceObserver((items) => {  items.getEntries().forEach((entry) => {    console.log(`${entry.name}: ${entry.duration.toFixed(2)}ms`);  });});obs.observe({ entryTypes: ['measure'] });// Measure async file read operationperformance.mark('readStart');fs.readFile(__filename, (err, data) => {  if (err) throw err;    performance.mark('readEnd');  performance.measure('File Read', 'readStart', 'readEnd');    // Measure async processing time  performance.mark('processStart');    // Simulate processing the file data  setTimeout(() => {    const lines = data.toString().split('\n').length;        performance.mark('processEnd');    performance.measure('File Processing', 'processStart', 'processEnd');        console.log(`File has ${lines} lines`);        // Clean up    performance.clearMarks();    performance.clearMeasures();  }, 100);});
```

* * *

## Tracking Promises

Measuring the performance of promises requires similar techniques:

```javascript
const { performance, PerformanceObserver } = require('perf_hooks');// Set up the observerconst obs = new PerformanceObserver((items) => {  items.getEntries().forEach((entry) => {    console.log(`${entry.name}: ${entry.duration.toFixed(2)}ms`);  });});obs.observe({ entryTypes: ['measure'] });// Function that returns a promisefunction fetchData(delay) {  return new Promise((resolve) => {    setTimeout(() => {      resolve({ data: 'Sample data' });    }, delay);  });}// Function to process datafunction processData(data) {  return new Promise((resolve) => {    setTimeout(() => {      resolve({ processed: data.data.toUpperCase() });    }, 200);  });}// Measure Promise chainasync function run() {  performance.mark('fetchStart');    const data = await fetchData(300);    performance.mark('fetchEnd');  performance.mark('processStart');    const processed = await processData(data);    performance.mark('processEnd');    // Create measures  performance.measure('Fetch Data', 'fetchStart', 'fetchEnd');  performance.measure('Process Data', 'processStart', 'processEnd');  performance.measure('Total Operation', 'fetchStart', 'processEnd');    console.log('Result:', processed);}run().finally(() => {  // Clear after execution  performance.clearMarks();  performance.clearMeasures();});
```

* * *

## Performance Timing Caveats

When using performance APIs, be aware of certain caveats:

*   Timing resolution varies between platforms
*   Clock drift can occur in long-running processes
*   Background activity can affect timing measurements
*   JavaScript JIT compilation can cause inconsistent first-run times

```javascript
const { performance } = require('perf_hooks');// For accurate benchmarking, perform multiple runsfunction benchmark(fn, iterations = 1000) {  // Warm-up run (for JIT optimization)  fn();    const times = [];    for (let i = 0; i < iterations; i++) {    const start = performance.now();    fn();    const end = performance.now();    times.push(end - start);  }    // Calculate statistics  times.sort((a, b) => a - b);    const sum = times.reduce((a, b) => a + b, 0);  const avg = sum / times.length;  const median = times[Math.floor(times.length / 2)];  const min = times[0];  const max = times[times.length - 1];    return {    average: avg,    median: median,    min: min,    max: max,    samples: times.length  };}// Example usagefunction testFunction() {  // Function to benchmark  let x = 0;  for (let i = 0; i < 10000; i++) {    x += i;  }  return x;}const results = benchmark(testFunction);console.log('Benchmark Results:');console.log(`  Samples: ${results.samples}`);console.log(`  Average: ${results.average.toFixed(4)}ms`);console.log(`  Median: ${results.median.toFixed(4)}ms`);console.log(`  Min: ${results.min.toFixed(4)}ms`);console.log(`  Max: ${results.max.toFixed(4)}ms`);
```

* * *

## NodeJS Performance Hooks vs Browser Performance API

The Node.js Performance Hooks API is based on the W3C Performance Timeline specification, but there are some differences compared to the browser's Performance API:

Feature

Browser Performance API

Node.js Performance Hooks

Time Origin

Page navigation start

Process start time

Resource Timing

Available

Not applicable

Navigation Timing

Available

Not applicable

User Timing (mark/measure)

Available

Available

High-Resolution Time

Available

Available

Event Loop Monitoring

Limited

Available

* * *

## Practical Example: API Performance Monitoring

A practical example of using performance hooks to monitor API endpoints:

```javascript
const { performance, PerformanceObserver } = require('perf_hooks');const express = require('express');const app = express();const port = 8080;// Set up performance observer for loggingconst obs = new PerformanceObserver((items) => {  items.getEntries().forEach((entry) => {    console.log(`[${new Date().toISOString()}] ${entry.name}: ${entry.duration.toFixed(2)}ms`);  });});obs.observe({ entryTypes: ['measure'] });// Middleware to track request processing timeapp.use((req, res, next) => {  const start = performance.now();  const requestId = `${req.method} ${req.url} ${Date.now()}`;    // Mark the start of request processing  performance.mark(`${requestId}-start`);    // Override end method to capture when response is sent  const originalEnd = res.end;  res.end = function(...args) {    performance.mark(`${requestId}-end`);    performance.measure(      `Request ${req.method} ${req.url}`,      `${requestId}-start`,      `${requestId}-end`    );        // Clean up marks    performance.clearMarks(`${requestId}-start`);    performance.clearMarks(`${requestId}-end`);        return originalEnd.apply(this, args);  };    next();});// API routesapp.get('/', (req, res) => {  res.send('Hello World!');});app.get('/fast', (req, res) => {  res.send('Fast response!');});app.get('/slow', (req, res) => {  // Simulate a slow API endpoint  setTimeout(() => {    res.send('Slow response after delay');  }, 500);});app.get('/process', (req, res) => {  // Simulate CPU-intensive processing  const requestId = `process-${Date.now()}`;  performance.mark(`${requestId}-process-start`);    let result = 0;  for (let i = 0; i < 1000000; i++) {    result += Math.sqrt(i);  }    performance.mark(`${requestId}-process-end`);  performance.measure(    'CPU Processing',    `${requestId}-process-start`,    `${requestId}-process-end`  );    res.send(`Processed result: ${result}`);});// Start serverapp.listen(port, () => {  console.log(`Performance monitoring example running at http://localhost:${port}`);});
```

* * *

## Advanced Performance Monitoring

For production-grade applications, consider these advanced monitoring techniques:

### 1\. Memory Leak Detection

Detect and analyze memory leaks using performance hooks and Node.js memory monitoring:

```javascript
const { performance, PerformanceObserver } = require('perf_hooks');const { performance: perf } = require('process');class MemoryMonitor {  constructor() {    this.leakThreshold = 10 * 1024 * 1024; // 10MB    this.checkInterval = 10000; // 10 seconds    this.interval = null;    this.lastMemoryUsage = process.memoryUsage();    this.leakDetected = false;        // Set up performance observer for GC events    const obs = new PerformanceObserver((items) => {      items.getEntries().forEach((entry) => {        if (entry.name === 'gc') {          this.checkMemoryLeak();        }      });    });    obs.observe({ entryTypes: ['gc'] });  }    start() {    console.log('Memory monitoring started');    this.interval = setInterval(() => this.checkMemoryLeak(), this.checkInterval);  }    stop() {    if (this.interval) {      clearInterval(this.interval);      console.log('Memory monitoring stopped');    }  }    checkMemoryLeak() {    const current = process.memoryUsage();    const heapDiff = current.heapUsed - this.lastMemoryUsage.heapUsed;        if (heapDiff > this.leakThreshold) {      this.leakDetected = true;      console.warn(`⚠️  Possible memory leak detected: Heap increased by ${(heapDiff / 1024 / 1024).toFixed(2)}MB`);      console.log('Memory snapshot:', {        rss: this.formatMemory(current.rss),        heapTotal: this.formatMemory(current.heapTotal),        heapUsed: this.formatMemory(current.heapUsed),        external: this.formatMemory(current.external)      });            // Take a heap snapshot if needed      if (process.env.NODE_ENV === 'development') {        this.takeHeapSnapshot();      }    }        this.lastMemoryUsage = current;  }    formatMemory(bytes) {    return `${(bytes / 1024 / 1024).toFixed(2)}MB`;  }    takeHeapSnapshot() {    const heapdump = require('heapdump');    const filename = `heapdump-${Date.now()}.heapsnapshot`;    heapdump.writeSnapshot(filename, (err, filename) => {      if (err) {        console.error('Failed to take heap snapshot:', err);      } else {        console.log(`Heap snapshot written to ${filename}`);      }    });  }}// Usage exampleconst monitor = new MemoryMonitor();monitor.start();// Simulate a memory leakconst leaks = [];setInterval(() => {  for (let i = 0; i < 1000; i++) {    leaks.push(new Array(1000).fill('*'.repeat(100)));  }}, 1000);// Stop monitoring after 1 minutesetTimeout(() => {  monitor.stop();  console.log('Memory monitoring completed');}, 60000);
```

Note: The memory leak detection example requires the `heapdump` package. Install it using `npm install heapdump`.

### 2\. Custom Performance Metrics

Create and track custom performance metrics with detailed timing information:

```javascript
const { performance, PerformanceObserver, PerformanceEntry } = require('perf_hooks');class PerformanceTracker {  constructor() {    this.metrics = new Map();    this.observers = new Map();        // Set up default observer for custom metrics    this.setupDefaultObserver();  }    setupDefaultObserver() {    const obs = new PerformanceObserver((items) => {      items.getEntries().forEach((entry) => {        if (!this.metrics.has(entry.name)) {          this.metrics.set(entry.name, []);        }        this.metrics.get(entry.name).push(entry);                // Log detailed metrics        this.logMetric(entry);      });    });        obs.observe({ entryTypes: ['measure'] });    this.observers.set('default', obs);  }    startTimer(name) {    performance.mark(`${name}-start`);  }    endTimer(name, attributes = {}) {    performance.mark(`${name}-end`);    performance.measure(name, {      start: `${name}-start`,      end: `${name}-end`,      ...attributes    });        // Clean up marks    performance.clearMarks(`${name}-start`);    performance.clearMarks(`${name}-end`);  }    logMetric(entry) {    const { name, duration, startTime, entryType, detail } = entry;    console.log(`📊 [${new Date().toISOString()}] ${name}: ${duration.toFixed(2)}ms`);        if (detail) {      console.log('   Details:', JSON.stringify(detail, null, 2));    }  }    getMetrics(name) {    return this.metrics.get(name) || [];  }    getStats(name) {    const metrics = this.getMetrics(name);    if (metrics.length === 0) return null;        const durations = metrics.map(m => m.duration);    const sum = durations.reduce((a, b) => a + b, 0);    const avg = sum / durations.length;        return {      count: durations.length,      total: sum,      average: avg,      min: Math.min(...durations),      max: Math.max(...durations),      p90: this.percentile(durations, 90),      p95: this.percentile(durations, 95),      p99: this.percentile(durations, 99)    };  }    percentile(arr, p) {    if (!arr.length) return 0;    const sorted = [...arr].sort((a, b) => a - b);    const pos = (sorted.length - 1) * p / 100;    const base = Math.floor(pos);    const rest = pos - base;        if (sorted[base + 1] !== undefined) {      return sorted[base] + rest * (sorted[base + 1] - sorted[base]);    } else {      return sorted[base];    }  }}// Usage exampleconst tracker = new PerformanceTracker();// Track a simple operationtracker.startTimer('database-query');setTimeout(() => {  tracker.endTimer('database-query', {    detail: {      query: 'SELECT * FROM users',      params: { limit: 100 },      success: true    }  });    // Get statistics  console.log('Stats:', tracker.getStats('database-query'));}, 200);
```

* * *

## Distributed Tracing with Performance Hooks

Implement distributed tracing across microservices using performance hooks:

```javascript
const { performance, PerformanceObserver } = require('perf_hooks');const crypto = require('crypto');class Tracer {  constructor(serviceName) {    this.serviceName = serviceName;    this.spans = new Map();    this.exportInterval = setInterval(() => this.exportSpans(), 10000);  }    startSpan(name, parentSpanId = null) {    const spanId = crypto.randomBytes(8).toString('hex');    const traceId = parentSpanId ? this.spans.get(parentSpanId)?.traceId : crypto.randomBytes(16).toString('hex');        const span = {      id: spanId,      traceId,      parentSpanId,      name,      service: this.serviceName,      startTime: performance.now(),      endTime: null,      duration: null,      tags: {},      logs: []    };        this.spans.set(spanId, span);    return spanId;  }    endSpan(spanId, status = 'OK') {    const span = this.spans.get(spanId);    if (!span) return;        span.endTime = performance.now();    span.duration = span.endTime - span.startTime;    span.status = status;        // Auto-export if this is a root span    if (!span.parentSpanId) {      this.exportSpan(span);    }        return span;  }    addTag(spanId, key, value) {    const span = this.spans.get(spanId);    if (span) {      span.tags[key] = value;    }  }    log(spanId, message, data = {}) {    const span = this.spans.get(spanId);    if (span) {      span.logs.push({        timestamp: new Date().toISOString(),        message,        data: JSON.stringify(data)      });    }  }    exportSpan(span) {    // In a real application, this would send the span to a tracing backend    // like Jaeger, Zipkin, or AWS X-Ray    console.log('Exporting span:', JSON.stringify(span, null, 2));        // Clean up    this.spans.delete(span.id);  }    exportSpans() {    // Export any remaining spans that have ended    for (const [id, span] of this.spans.entries()) {      if (span.endTime) {        this.exportSpan(span);      }    }  }    injectContext(spanId, headers = {}) {    const span = this.spans.get(spanId);    if (!span) return headers;        return {      ...headers,      'x-trace-id': span.traceId,      'x-span-id': span.id,      'x-service': this.serviceName    };  }    extractContext(headers) {    const traceId = headers['x-trace-id'] || crypto.randomBytes(16).toString('hex');    const parentSpanId = headers['x-span-id'] || null;        return { traceId, parentSpanId };  }}// Usage exampleconst tracer = new Tracer('user-service');// Simulate a requestfunction handleRequest(req) {  const { traceId, parentSpanId } = tracer.extractContext(req.headers);  const spanId = tracer.startSpan('handle-request', parentSpanId);    tracer.addTag(spanId, 'http.method', req.method);  tracer.addTag(spanId, 'http.url', req.url);    // Simulate work  setTimeout(() => {    // Call another service    const childSpanId = tracer.startSpan('call-auth-service', spanId);        setTimeout(() => {      tracer.endSpan(childSpanId, 'OK');            // End the request      tracer.endSpan(spanId, 'OK');    }, 100);  }, 50);    return { status: 'processing', traceId };}// Simulate an incoming requestconst request = {  method: 'GET',  url: '/api/users/123',  headers: {}};const response = handleRequest(request);console.log('Response:', response);// Wait for spans to completesetTimeout(() => {}, 200);
```

* * *

## Performance Optimization Techniques

Advanced techniques for optimizing Node.js application performance:

### 1\. Worker Threads for CPU-Intensive Tasks

Offload CPU-intensive operations to worker threads to prevent blocking the event loop:

```javascript
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');const { performance, PerformanceObserver } = require('perf_hooks');if (isMainThread) {  // Main thread  function runWorker(data) {    return new Promise((resolve, reject) => {      const start = performance.now();            const worker = new Worker(__filename, {        workerData: data      });            worker.on('message', (result) => {        const duration = performance.now() - start;        resolve({          ...result,          duration: `${duration.toFixed(2)}ms`        });      });            worker.on('error', reject);      worker.on('exit', (code) => {        if (code !== 0) {          reject(new Error(`Worker stopped with exit code ${code}`));        }      });    });  }    // Example usage  async function main() {    try {      const result = await runWorker({        task: 'processData',        data: Array(1000000).fill().map((_, i) => i)      });            console.log('Worker result:', result);    } catch (err) {      console.error('Worker error:', err);    }  }    main();} else {  // Worker thread  function processData(data) {    // Simulate CPU-intensive work    return data.map(x => Math.sqrt(x) * Math.PI);  }    try {    const result = processData(workerData.data);    parentPort.postMessage({      task: workerData.task,      resultLength: result.length,      sample: result.slice(0, 5)    });  } catch (err) {    parentPort.postMessage({ error: err.message });  }}
```

### 2\. Efficient Data Processing

Use streams and buffers for efficient large data processing:

```javascript
const { Transform } = require('stream');const { performance } = require('perf_hooks');class ProcessingPipeline {  constructor() {    this.startTime = performance.now();    this.processedItems = 0;  }    createTransformStream(transformFn) {    return new Transform({      objectMode: true,      transform(chunk, encoding, callback) {        try {          const result = transformFn(chunk);          this.processedItems++;          callback(null, result);        } catch (err) {          callback(err);        }      }    });  }    async processData(data, batchSize = 1000) {    const batches = [];        // Process in batches    for (let i = 0; i < data.length; i += batchSize) {      const batch = data.slice(i, i + batchSize);      const processedBatch = await this.processBatch(batch);      batches.push(processedBatch);            // Log progress      const progress = ((i + batchSize) / data.length * 100).toFixed(1);      console.log(`Processed ${Math.min(i + batchSize, data.length)}/${data.length} (${progress}%)`);    }        return batches.flat();  }    processBatch(batch) {    return new Promise((resolve) => {      const results = [];            // Create a transform stream for processing      const processor = this.createTransformStream((item) => {        // Simulate processing        return {          ...item,          processed: true,          timestamp: new Date().toISOString()        };      });            // Collect results      processor.on('data', (data) => {        results.push(data);      });            processor.on('end', () => {        resolve(results);      });            // Process each item in the batch      for (const item of batch) {        processor.write(item);      }            processor.end();    });  }    getStats() {    const endTime = performance.now();    const duration = endTime - this.startTime;        return {      processedItems: this.processedItems,      duration: `${duration.toFixed(2)}ms`,      itemsPerSecond: (this.processedItems / (duration / 1000)).toFixed(2)    };  }}// Example usageasync function main() {  // Generate test data  const testData = Array(10000).fill().map((_, i) => ({    id: i,    value: Math.random() * 1000  }));    console.log('Starting data processing...');  const pipeline = new ProcessingPipeline();    // Process data in batches  const result = await pipeline.processData(testData, 1000);    // Print statistics  console.log('Processing complete!');  console.log('Statistics:', pipeline.getStats());  console.log('Sample result:', result[0]);}main().catch(console.error);
```

* * *

## Performance Testing Best Practices

When conducting performance testing, follow these best practices:

1.  **Test in Production-Like Environments**
    *   Use hardware similar to production
    *   Include realistic data volumes
    *   Simulate production traffic patterns
2.  **Use Statistical Significance**
    *   Run multiple test iterations
    *   Calculate confidence intervals
    *   Ignore outliers appropriately
3.  **Monitor System Resources**
    *   Track CPU and memory usage
    *   Monitor garbage collection
    *   Watch for memory leaks
4.  **Profile Before Optimizing**
    *   Identify actual bottlenecks
    *   Measure before and after changes
    *   Focus on high-impact optimizations

* * *

* * *