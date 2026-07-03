# Node.js Streams

* * *

## What are Streams?

In Node.js, streams are collections of data, which might not be available in full at once and don't have to fit in memory.

Think of them as conveyor belts that move data from one place to another, allowing you to work with each piece as it arrives rather than waiting for the whole dataset.

Streams are one of Node.js's most powerful features and are used extensively in:

*   File system operations (reading/writing files)
*   HTTP requests and responses
*   Data compression and decompression
*   Database operations
*   Real-time data processing

* * *

## Getting Started with Streams

Streams are one of the fundamental concepts in Node.js for handling data efficiently.

They allow you to process data in chunks as it becomes available, rather than loading everything into memory at once.

```javascript
const fs = require('fs');// Create a readable stream from a fileconst readableStream = fs.createReadStream('input.txt', 'utf8');// Create a writable stream to a fileconst writableStream = fs.createWriteStream('output.txt');// Pipe the data from readable to writable streamreadableStream.pipe(writableStream);// Handle completion and errorswritableStream.on('finish', () => {  console.log('File copy completed!');});readableStream.on('error', (err) => {  console.error('Error reading file:', err);});writableStream.on('error', (err) => {  console.error('Error writing file:', err);});
```

* * *

## Why Use Streams?

There are several advantages to using streams:

*   **Memory Efficiency:** Process large files without loading them entirely into memory
*   **Time Efficiency:** Start processing data as soon as you have it, instead of waiting for all the data
*   **Composability:** Build powerful data pipelines by connecting streams
*   **Better User Experience:** Deliver data to users as it becomes available (e.g., video streaming)

Imagine reading a 1GB file on a server with 512MB of RAM:

*   **Without streams:** You'd crash the process attempting to load the entire file into memory
*   **With streams:** You process the file in small chunks (e.g., 64KB at a time)

* * *

## Core Stream Types

Node.js provides four fundamental types of streams, each serving a specific purpose in data handling:

Stream Type

Description

Common Examples

**Readable**

Streams from which data can be read (data source)

fs.createReadStream(), HTTP responses, process.stdin

**Writable**

Streams to which data can be written (data destination)

fs.createWriteStream(), HTTP requests, process.stdout

**Duplex**

Streams that are both Readable and Writable

TCP sockets, Zlib streams

**Transform**

Duplex streams that can modify or transform data as it's written and read

Zlib streams, crypto streams

**Note:** All streams in Node.js are instances of EventEmitter, which means they emit events that can be listened to and handled.

* * *

* * *

## Readable Streams

Readable streams let you read data from a source. Examples include:

*   Reading from a file
*   HTTP responses on the client
*   HTTP requests on the server
*   process.stdin

### Creating a Readable Stream

```javascript
const fs = require('fs');// Create a readable stream from a fileconst readableStream = fs.createReadStream('myfile.txt', {  encoding: 'utf8',  highWaterMark: 64 * 1024 // 64KB chunks});// Events for readable streamsreadableStream.on('data', (chunk) => {  console.log(`Received ${chunk.length} bytes of data.`);  console.log(chunk);});readableStream.on('end', () => {  console.log('No more data to read.');});readableStream.on('error', (err) => {  console.error('Error reading from stream:', err);});
```

### Reading Modes

Readable streams operate in one of two modes:

*   **Flowing Mode:** Data is read from the source and provided to your application as quickly as possible using events
*   **Paused Mode:** You must explicitly call `stream.read()` to get chunks of data from the stream

```javascript
const fs = require('fs');// Paused mode exampleconst readableStream = fs.createReadStream('myfile.txt', {  encoding: 'utf8',  highWaterMark: 64 * 1024 // 64KB chunks});// Manually consume the stream using read()readableStream.on('readable', () => {  let chunk;  while (null !== (chunk = readableStream.read())) {    console.log(`Read ${chunk.length} bytes of data.`);    console.log(chunk);  } });readableStream.on('end', () => {  console.log('No more data to read.');});
```

* * *

## Writable Streams

Writable streams let you write data to a destination. Examples include:

*   Writing to a file
*   HTTP requests on the client
*   HTTP responses on the server
*   process.stdout

### Creating a Writable Stream

```javascript
const fs = require('fs');// Create a writable stream to a fileconst writableStream = fs.createWriteStream('output.txt');// Write data to the streamwritableStream.write('Hello, ');writableStream.write('World!');writableStream.write('\nWriting to a stream is easy!');// End the streamwritableStream.end();// Events for writable streamswritableStream.on('finish', () => {  console.log('All data has been written to the file.');});writableStream.on('error', (err) => {  console.error('Error writing to stream:', err);});
```

### Handling Backpressure

When writing to a stream, if the data is being written faster than it can be processed, backpressure occurs.

The `write()` method returns a boolean indicating if it's safe to continue writing.

```javascript
const fs = require('fs');const writableStream = fs.createWriteStream('output.txt');function writeData() {  let i = 100;  function write() {    let ok = true;    do {      i--;      if (i === 0) {        // Last time, close the stream        writableStream.write('Last chunk!\n');        writableStream.end();      } else {        // Continue writing data        const data = `Data chunk ${i}\n`;        // Write and check if we should continue        ok = writableStream.write(data);      }    }    while (i > 0 && ok);    if (i > 0) {      // We need to wait for the drain event before writing more      writableStream.once('drain', write);    }  }  write();}writeData();writableStream.on('finish', () => {  console.log('All data written successfully.');});
```

* * *

## Pipe

The `pipe()` method connects a readable stream to a writable stream, automatically managing the flow of data and handling backpressure.

It's the easiest way to consume streams.

```javascript
const fs = require('fs');// Create readable and writable streamsconst readableStream = fs.createReadStream('source.txt');const writableStream = fs.createWriteStream('destination.txt');// Pipe the readable stream to the writable streamreadableStream.pipe(writableStream);// Handle completion and errorsreadableStream.on('error', (err) => {  console.error('Read error:', err);});writableStream.on('error', (err) => {  console.error('Write error:', err);});writableStream.on('finish', () => {  console.log('File copy completed!');});
```

### Chaining Pipes

You can chain multiple streams together using `pipe()`.

This is especially useful when working with transform streams.

```javascript
const fs = require('fs');const zlib = require('zlib');// Create a pipeline to read a file, compress it, and write to a new filefs.createReadStream('source.txt')  .pipe(zlib.createGzip()) // Compress the data  .pipe(fs.createWriteStream('destination.txt.gz'))  .on('finish', () => {    console.log('File compressed successfully!');  });
```

**Note:** The `pipe()` method returns the destination stream, which enables chaining.

* * *

## Duplex and Transform Streams

### Duplex Streams

Duplex streams are both readable and writable, like a two-way pipe.

A TCP socket is a good example of a duplex stream.

```javascript
const net = require('net');// Create a TCP serverconst server = net.createServer((socket) => {  // 'socket' is a duplex stream  // Handle incoming data (readable side)  socket.on('data', (data) => {    console.log('Received:', data.toString());    // Echo back (writable side)    socket.write(`Echo: ${data}`);  });  socket.on('end', () => {    console.log('Client disconnected');  });});server.listen(8080, () => {  console.log('Server listening on port 8080');});// To test, you can use a tool like netcat or telnet:// $ nc localhost 8080// or create a client:/*const client = net.connect({ port: 8080 }, () => {  console.log('Connected to server');  client.write('Hello from client!');});client.on('data', (data) => {  console.log('Server says:', data.toString());  client.end(); // Close the connection});*/
```

### Transform Streams

Transform streams are duplex streams that can modify data as it passes through.

They're ideal for processing data in pipelines.

```javascript
const { Transform } = require('stream');const fs = require('fs');// Create a transform stream that converts text to uppercaseclass UppercaseTransform extends Transform {  _transform(chunk, encoding, callback) {    // Transform the chunk to uppercase    const upperChunk = chunk.toString().toUpperCase();    // Push the transformed data    this.push(upperChunk);    // Signal that we're done with this chunk    callback();  }}// Create an instance of our transform streamconst uppercaseTransform = new UppercaseTransform();// Create a readable stream from a fileconst readableStream = fs.createReadStream('input.txt');// Create a writable stream to a fileconst writableStream = fs.createWriteStream('output-uppercase.txt');// Pipe the data through our transform streamreadableStream  .pipe(uppercaseTransform)  .pipe(writableStream)  .on('finish', () => {    console.log('Transformation completed!');  });
```

* * *

## Stream Events

All streams are instances of EventEmitter and emit several events:

### Readable Stream Events

*   `data`: Emitted when the stream has data available to read
*   `end`: Emitted when there's no more data to be consumed
*   `error`: Emitted if an error occurs while reading
*   `close`: Emitted when the stream's underlying resource has been closed
*   `readable`: Emitted when data is available to be read

### Writable Stream Events

*   `drain`: Emitted when the stream is ready to accept more data after a `write()` method has returned `false`
*   `finish`: Emitted when all data has been flushed to the underlying system
*   `error`: Emitted if an error occurs while writing
*   `close`: Emitted when the stream's underlying resource has been closed
*   `pipe`: Emitted when the `pipe()` method is called on a readable stream
*   `unpipe`: Emitted when the `unpipe()` method is called on a readable stream

* * *

## The stream.pipeline() Method

The `pipeline()` function (available since Node.js v10.0.0) is a more robust way to pipe streams together, especially for error handling.

```javascript
const { pipeline } = require('stream');const fs = require('fs');const zlib = require('zlib');// Create a pipeline that handles errors properlypipeline(  fs.createReadStream('source.txt'),  zlib.createGzip(),  fs.createWriteStream('destination.txt.gz'),  (err) => {    if (err) {      console.error('Pipeline failed:', err);    } else {      console.log('Pipeline succeeded!');    }  });
```

**Note:** `pipeline()` will properly clean up all the streams if an error occurs in any of them, preventing potential memory leaks.

* * *

## Object Mode Streams

By default, streams work with strings and Buffer objects.

However, streams can be set to 'object mode' to work with JavaScript objects.

```javascript
const { Readable, Writable, Transform } = require('stream');// Create a readable stream in object modeconst objectReadable = new Readable({  objectMode: true,  read() {} // Implementation required but can be no-op});// Create a transform stream in object modeconst objectTransform = new Transform({  objectMode: true,  transform(chunk, encoding, callback) {    // Add a property to the object    chunk.transformed = true;    chunk.timestamp = new Date();    this.push(chunk);    callback();  } });// Create a writable stream in object modeconst objectWritable = new Writable({  objectMode: true,  write(chunk, encoding, callback) {    console.log('Received object:', chunk);    callback();  } });// Connect the streamsobjectReadable  .pipe(objectTransform)  .pipe(objectWritable);// Push some objects to the streamobjectReadable.push({ name: 'Object 1', value: 10 });objectReadable.push({ name: 'Object 2', value: 20 });objectReadable.push({ name: 'Object 3', value: 30 });objectReadable.push(null); // Signal the end of data
```

* * *

## Advanced Stream Patterns

### 1\. Error Handling with pipeline()

The `pipeline()` method is the recommended way to handle errors in stream chains:

```javascript
const { pipeline } = require('stream');const fs = require('fs');const zlib = require('zlib');pipeline(  fs.createReadStream('input.txt'),  zlib.createGzip(),  fs.createWriteStream('output.txt.gz'),  (err) => {   if (err) {    console.error('Pipeline failed:', err);   } else {    console.log('Pipeline succeeded');   }  });
```

### 2\. Object Mode Streams

Streams can work with JavaScript objects instead of just strings and buffers:

```javascript
const { Readable } = require('stream');// Create a readable stream in object modeconst objectStream = new Readable({  objectMode: true,  read() {}});// Push objects to the streamobjectStream.push({ id: 1, name: 'Alice' });objectStream.push({ id: 2, name: 'Bob' });objectStream.push(null); // Signal end of stream// Consume the streamobjectStream.on('data', (obj) => {  console.log('Received:', obj);});
```

## Practical Examples

### HTTP Streaming

Streams are used extensively in HTTP requests and responses.

```javascript
const http = require('http');const fs = require('fs');// Create an HTTP serverconst server = http.createServer((req, res) => {  // Handle different routes  if (req.url === '/') {    // Send a simple response    res.writeHead(200, { 'Content-Type': 'text/html' });    res.end('<h1>Stream Demo</h1><p>Try <a href="/file">streaming a file</a> or <a href="/video">streaming a video</a>.</p>');  }  else if (req.url === '/file') {    // Stream a large text file    res.writeHead(200, { 'Content-Type': 'text/plain' });    const fileStream = fs.createReadStream('largefile.txt', 'utf8');    // Pipe the file to the response (handles backpressure automatically)    fileStream.pipe(res);    // Handle errors    fileStream.on('error', (err) => {      console.error('File stream error:', err);      res.statusCode = 500;      res.end('Server Error');    });  }  else if (req.url === '/video') {    // Stream a video file with proper headers    const videoPath = 'video.mp4';    const stat = fs.statSync(videoPath);    const fileSize = stat.size;    const range = req.headers.range;    if (range) {      // Handle range requests for video seeking      const parts = range.replace(/bytes=/, "").split("-");      const start = parseInt(parts[0], 10);      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;      const chunksize = (end - start) + 1;      const videoStream = fs.createReadStream(videoPath, { start, end });      res.writeHead(206, {        'Content-Range': `bytes ${start}-${end}/${fileSize}`,        'Accept-Ranges': 'bytes',        'Content-Length': chunksize,        'Content-Type': 'video/mp4'      });      videoStream.pipe(res);      } else {        // No range header, send entire video        res.writeHead(200, {          'Content-Length': fileSize,          'Content-Type': 'video/mp4'        });        fs.createReadStream(videoPath).pipe(res);      }  }&br>   else {    // 404 Not Found    res.writeHead(404, { 'Content-Type': 'text/plain' });    res.end('Not Found');  }});// Start the serverserver.listen(8080, () => {  console.log('Server running at http://localhost:8080/');});
```

### Processing Large CSV Files

```javascript
const fs = require('fs');const { Transform } = require('stream');const csv = require('csv-parser'); // npm install csv-parser// Create a transform stream to filter and transform CSV dataconst filterTransform = new Transform({  objectMode: true,  transform(row, encoding, callback) {    // Only pass through rows that meet our criteria    if (parseInt(row.age) > 18) {      // Modify the row      row.isAdult = 'Yes';      // Push the transformed row      this.push(row);    }    }    callback();  }});// Create a writable stream for the resultsconst results = [];const writeToArray = new Transform({  objectMode: true,  transform(row, encoding, callback) {    results.push(row);    callback();  }});// Create the processing pipelinefs.createReadStream('people.csv')  .pipe(csv())  .pipe(filterTransform)  .pipe(writeToArray)  .on('finish', () => {    console.log(`Processed ${results.length} records:`);    console.log(results);  }  })  .on('error', (err) => {    console.error('Error processing CSV:', err);  }  });
```

* * *

## Best Practices

*   **Error Handling:** Always handle error events on streams to prevent application crashes.
*   **Use pipeline():** Prefer `stream.pipeline()` over `.pipe()` for better error handling and cleanup.
*   **Handle Backpressure:** Respect the return value of `write()` to avoid memory issues.
*   **End Streams:** Always call `end()` on writable streams when you're done.
*   **Avoid Synchronous Operations:** Don't block the event loop with synchronous operations inside stream handlers.
*   **Buffer Size:** Be mindful of highWaterMark (buffer size) settings.

**Warning:** Mishandling streams can lead to memory leaks and performance issues.

Always handle errors and end streams properly.

* * *

## Summary

Streams are a fundamental concept in Node.js that allow for efficient data handling. They:

*   Process data piece by piece without loading everything into memory
*   Provide better memory efficiency for large datasets
*   Allow processing to start before all data is available
*   Enable powerful data processing pipelines
*   Are used extensively in core Node.js APIs

* * *

* * *