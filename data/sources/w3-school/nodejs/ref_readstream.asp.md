# Node.js ReadStream Reference

* * *

## ReadStream Object

A ReadStream is a stream that allows you to read data from a resource. Node.js provides ReadStream implementations for different use cases, such as reading from files (`fs.ReadStream`) or standard input (`process.stdin`).

ReadStreams implement the `stream.Readable` interface, which means they provide methods and events for reading data asynchronously, handling backpressure, and working with different stream modes (flowing/paused).

### Common ReadStream Types

*   `fs.ReadStream` - For reading from files
*   `process.stdin` - For reading from standard input
*   `net.Socket` (when reading) - For reading from network connections
*   `http.IncomingMessage` - For reading HTTP request bodies

* * *

## ReadStream Properties

Here are the properties commonly available on Node.js ReadStream objects, primarily based on the `fs.ReadStream` implementation:

Property

Description

readStream.bytesRead

The number of bytes that have been read so far.

readStream.path

The file path that this ReadStream is reading from (`fs.ReadStream` only).

readStream.pending

If `true`, the underlying file has not been opened yet.

readStream.readableHighWaterMark

Returns the highWaterMark value for this ReadStream.

readStream.readableLength

Returns the number of bytes (or objects) in the read queue ready to be read.

readStream.readableEnded

Becomes `true` when the 'end' event is emitted.

readStream.readableFlowing

Indicates the state of the ReadStream (null, false, or true).

readStream.destroyed

Indicates if the stream has been destroyed.

* * *

* * *

## ReadStream Methods

Here are the most important methods available on ReadStream objects:

Method

Description

readStream.read(\[size\])

Reads and returns data from the internal buffer. If no data is available, returns `null`. If `size` is specified, attempts to read that many bytes.

readStream.pause()

Pauses the reading of data, switching the stream out of flowing mode.

readStream.resume()

Resumes reading after a call to `pause()`, switching the stream into flowing mode.

readStream.pipe(destination\[, options\])

Attaches a Writable stream to the ReadStream, automatically managing the flow so that the destination will not be overwhelmed by a faster ReadStream.

readStream.unpipe(\[destination\])

Detaches a Writable stream previously attached using `pipe()`.

readStream.unshift(chunk\[, encoding\])

Pushes a chunk of data back into the internal buffer, which will be returned by the next `read()` call.

readStream.wrap(stream)

Wraps an old-style readable stream as a new-style readable stream.

readStream.destroy(\[error\])

Destroys the stream, and optionally emits an error event. After this call, the ReadStream is no longer usable.

readStream.setEncoding(encoding)

Sets the character encoding for data read from the stream. If set, the stream will decode the data to strings instead of `Buffer` objects.

* * *

## ReadStream Events

ReadStream objects emit the following events:

Event

Description

'close'

Emitted when the stream and any of its underlying resources have been closed.

'data'

Emitted when data is available to be read from the stream. The data will be either a Buffer or a string, depending on the encoding set with `setEncoding()`.

'end'

Emitted when there is no more data to be consumed from the stream.

'error'

Emitted if an error occurred during reading. The stream is closed after this event.

'open'

Emitted when the underlying resource (e.g., file descriptor) has been opened (`fs.ReadStream` specific).

'readable'

Emitted when there is data available to be read from the stream or when the end of the stream has been reached.

'ready'

Emitted when the stream is ready to be used.

'pause'

Emitted when the stream is paused.

'resume'

Emitted when the stream is resumed.

* * *

## Reading from a File

This example shows how to create a file ReadStream and read data from it:

```javascript
const fs = require('fs');const path = require('path');// Create a sample file for the exampleconst sampleFile = path.join(__dirname, 'readstream-example.txt');fs.writeFileSync(sampleFile, 'This is a test file.\nIt has multiple lines.\nEach line has its own content.\nStreaming makes file reading efficient.');// Create a ReadStream to read from the fileconst readStream = fs.createReadStream(sampleFile, {  // Options  encoding: 'utf8',  // Set the encoding (utf8, ascii, binary, etc.)  highWaterMark: 64, // Buffer size in bytes  autoClose: true    // Automatically close the file descriptor when the stream ends});console.log('File ReadStream properties:');console.log(`- Path: ${readStream.path}`);console.log(`- Pending: ${readStream.pending}`);console.log(`- High Water Mark: ${readStream.readableHighWaterMark} bytes`);// Handle stream eventsreadStream.on('open', (fd) => {  console.log(`File opened with descriptor: ${fd}`);});readStream.on('ready', () => {  console.log('ReadStream is ready');});// Handle data eventsreadStream.on('data', (chunk) => {  console.log('\nReceived chunk:');  console.log('-'.repeat(20));  console.log(chunk);  console.log('-'.repeat(20));  console.log(`Bytes read so far: ${readStream.bytesRead}`);});readStream.on('end', () => {  console.log('\nReached end of file');  console.log(`Total bytes read: ${readStream.bytesRead}`);    // Clean up the sample file  fs.unlinkSync(sampleFile);  console.log('Sample file removed');});readStream.on('close', () => {  console.log('Stream closed');});readStream.on('error', (err) => {  console.error(`Error: ${err.message}`);});
```

* * *

## Controlling Stream Flow

This example demonstrates how to control the flow of data with `pause()` and `resume()`:

```javascript
const fs = require('fs');const path = require('path');// Create a large sample file for the flow control exampleconst flowFile = path.join(__dirname, 'flow-control-example.txt');let sampleContent = '';for (let i = 1; i <= 1000; i++) {  sampleContent += `This is line ${i} of the test file.\n`;}fs.writeFileSync(flowFile, sampleContent);// Create a ReadStreamconst readStream = fs.createReadStream(flowFile, {  encoding: 'utf8',  highWaterMark: 1024 // 1KB buffer});let chunkCount = 0;let totalBytes = 0;let isPaused = false;// Handle data chunks with flow controlreadStream.on('data', (chunk) => {  chunkCount++;  totalBytes += chunk.length;    console.log(`Chunk #${chunkCount} received, size: ${chunk.length} bytes`);    // Pause the stream every 5 chunks to demonstrate flow control  if (chunkCount % 5 === 0 && !isPaused) {    console.log('\nPausing the stream for 1 second...');    isPaused = true;        // Pause the stream    readStream.pause();        // Resume after 1 second    setTimeout(() => {      console.log('Resuming the stream...\n');      isPaused = false;      readStream.resume();    }, 1000);  }});readStream.on('end', () => {  console.log(`\nFinished reading file. Received ${chunkCount} chunks, ${totalBytes} bytes total.`);    // Clean up the sample file  fs.unlinkSync(flowFile);  console.log('Sample file removed');});readStream.on('error', (err) => {  console.error(`Error: ${err.message}`);});
```

* * *

## Using the read() Method

This example demonstrates using the `read()` method in the 'readable' event:

```javascript
const fs = require('fs');const path = require('path');// Create a sample fileconst readableFile = path.join(__dirname, 'readable-example.txt');fs.writeFileSync(readableFile, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.repeat(100));// Create a ReadStream without auto-flowingconst readStream = fs.createReadStream(readableFile, {  highWaterMark: 32 // Small buffer to demonstrate multiple reads});console.log('Using the readable event and read() method:');// Using the 'readable' event for manual readingreadStream.on('readable', () => {  let chunk;  // read() returns null when there is no more data to read  while (null !== (chunk = readStream.read(16))) {    console.log(`Read ${chunk.length} bytes: ${chunk.toString('utf8').substring(0, 10)}...`);  }});readStream.on('end', () => {  console.log('End of stream reached');    // Clean up the sample file  fs.unlinkSync(readableFile);  console.log('Sample file removed');});readStream.on('error', (err) => {  console.error(`Error: ${err.message}`);});
```

* * *

## Piping between Streams

This example demonstrates how to use `pipe()` to send data from a ReadStream to a WriteStream:

```javascript
const fs = require('fs');const path = require('path');const zlib = require('zlib');// Source and destination file pathsconst sourceFile = path.join(__dirname, 'pipe-source-example.txt');const destFile = path.join(__dirname, 'pipe-destination.txt');const compressedFile = path.join(__dirname, 'pipe-compressed.gz');// Create sample contentfs.writeFileSync(sourceFile, 'This is the source content for the pipe example.\n'.repeat(100));// Create ReadStream and various WriteStreamsconst readStream = fs.createReadStream(sourceFile);const writeStream = fs.createWriteStream(destFile);const compressStream = zlib.createGzip(); // Compression transform streamconst compressedWriteStream = fs.createWriteStream(compressedFile);// Pipe the ReadStream directly to the WriteStreamreadStream.pipe(writeStream);// Listen for completion eventswriteStream.on('finish', () => {  console.log(`File copied from ${sourceFile} to ${destFile}`);    // Create a new ReadStream to demonstrate chained pipes  const readStream2 = fs.createReadStream(sourceFile);    // Chain multiple pipes: read -> compress -> write  readStream2.pipe(compressStream).pipe(compressedWriteStream);    compressedWriteStream.on('finish', () => {    console.log(`File compressed from ${sourceFile} to ${compressedFile}`);        // Compare file sizes    const originalSize = fs.statSync(sourceFile).size;    const compressedSize = fs.statSync(compressedFile).size;    console.log(`Original size: ${originalSize} bytes`);    console.log(`Compressed size: ${compressedSize} bytes`);    console.log(`Compression ratio: ${(compressedSize / originalSize * 100).toFixed(2)}%`);        // Clean up files after demonstration    [sourceFile, destFile, compressedFile].forEach(file => {      fs.unlinkSync(file);    });    console.log('All sample files removed');  });});// Handle errorsreadStream.on('error', (err) => console.error(`Read error: ${err.message}`));writeStream.on('error', (err) => console.error(`Write error: ${err.message}`));compressStream.on('error', (err) => console.error(`Compression error: ${err.message}`));compressedWriteStream.on('error', (err) => console.error(`Compressed write error: ${err.message}`));
```

* * *

## Reading from Standard Input

This example shows how to use the `process.stdin` ReadStream:

```javascript
// process.stdin is a ReadStreamconsole.log('Enter some text (press Ctrl+D or Ctrl+C to end input):');// Set the encoding to utf8 to get strings instead of Buffer objectsprocess.stdin.setEncoding('utf8');let inputData = '';// Handle data from stdinprocess.stdin.on('data', (chunk) => {  console.log(`Received chunk: "${chunk.trim()}"`);  inputData += chunk;});// Handle the end of inputprocess.stdin.on('end', () => {  console.log('\nEnd of input.');  console.log(`Total input received: ${inputData.length} characters`);  console.log('You entered:');  console.log('-'.repeat(20));  console.log(inputData);  console.log('-'.repeat(20));});// Handle Ctrl+C (SIGINT)process.on('SIGINT', () => {  console.log('\nInput interrupted with Ctrl+C');  process.exit();});// Note: This example requires user input in a terminal// Can't be effectively demonstrated in the W3Schools TryIt editor
```

* * *

## HTTP ReadStream Example

This example shows how to use a ReadStream to handle HTTP request data:

```javascript
const http = require('http');// Create an HTTP serverconst server = http.createServer((req, res) => {  // req is an http.IncomingMessage, which is a ReadStream  console.log(`Received ${req.method} request to ${req.url}`);    // Set response headers  res.setHeader('Content-Type', 'text/plain');    // Handle different types of requests  if (req.method === 'GET') {    res.end('Send a POST request with a body to see the ReadStream in action');  }  else if (req.method === 'POST') {    // Set encoding for the request stream    req.setEncoding('utf8');        let body = '';        // Handle data events from the request stream    req.on('data', (chunk) => {      console.log(`Received chunk of ${chunk.length} bytes`);      body += chunk;            // Implement a simple flood protection      if (body.length > 1e6) {        // If body is too large, destroy the stream        body = '';        res.writeHead(413, {'Content-Type': 'text/plain'});        res.end('Request entity too large');        req.destroy();      }    });        // Handle the end of the request stream    req.on('end', () => {      console.log('End of request data');            try {        // Try to parse as JSON        const data = JSON.parse(body);        console.log('Parsed JSON data:', data);                // Send a response        res.writeHead(200, {'Content-Type': 'application/json'});        res.end(JSON.stringify({          message: 'Data received',          size: body.length,          data: data        }));      } catch (e) {        // If not valid JSON, just echo back the raw data        console.log('Could not parse as JSON, treating as plain text');                res.writeHead(200, {'Content-Type': 'text/plain'});        res.end(`Received ${body.length} bytes of data:\n${body}`);      }    });  }  else {    // For other HTTP methods    res.writeHead(405, {'Content-Type': 'text/plain'});    res.end('Method not allowed');  }});// Start the serverconst PORT = 8080;server.listen(PORT, () => {  console.log(`HTTP ReadStream example server running at http://localhost:${PORT}`);  console.log('To test:');  console.log(`1. Open http://localhost:${PORT} in a browser for GET request`);  console.log(`2. Use curl or Postman to send POST requests with a body to http://localhost:${PORT}`);});// Note: To test with curl:// curl -X POST -H "Content-Type: application/json" -d '{"name":"John","age":30}' http://localhost:8080
```

* * *

## Error Handling with ReadStreams

This example demonstrates proper error handling with ReadStreams:

```javascript
const fs = require('fs');const path = require('path');// Function to create and handle a ReadStream with proper error handlingfunction readWithErrorHandling(filePath) {  console.log(`Attempting to read: ${filePath}`);    // Create the ReadStream  const readStream = fs.createReadStream(filePath);    // Set up promise to capture result or error  return new Promise((resolve, reject) => {    let data = '';        // Handle data events    readStream.on('data', (chunk) => {      data += chunk;    });        // Handle successful completion    readStream.on('end', () => {      console.log(`Successfully read ${readStream.bytesRead} bytes from ${filePath}`);      resolve(data);    });        // Handle errors    readStream.on('error', (err) => {      console.error(`Error reading ${filePath}: ${err.message}`);      reject(err);    });        // Handle stream closure (always happens, even if there's an error)    readStream.on('close', () => {      console.log(`Stream for ${filePath} closed`);    });  });}// Test with both existing and non-existing filesconst existingFile = path.join(__dirname, 'test-existing.txt');const nonExistingFile = path.join(__dirname, 'non-existing-file.txt');// Create the test filefs.writeFileSync(existingFile, 'This is test content for error handling example');// Example 1: Reading an existing fileconsole.log('Example 1: Reading an existing file');readWithErrorHandling(existingFile)  .then(data => {    console.log('File content:', data);        // Example 2: Reading a non-existing file    console.log('\nExample 2: Reading a non-existing file');    return readWithErrorHandling(nonExistingFile);  })  .catch(err => {    console.log('Error caught in Promise catch:', err.message);  })  .finally(() => {    // Clean up the test file    if (fs.existsSync(existingFile)) {      fs.unlinkSync(existingFile);      console.log('Test file removed');    }  });// Example 3: Demonstrating destroyed streamsconsole.log('\nExample 3: Demonstrating destroyed streams');const destroyTestFile = path.join(__dirname, 'destroy-test.txt');fs.writeFileSync(destroyTestFile, 'A'.repeat(10000));const destroyStream = fs.createReadStream(destroyTestFile);destroyStream.on('data', (chunk) => {  console.log(`Received ${chunk.length} bytes before destroying the stream`);    // Destroy the stream after receiving the first chunk  console.log('Deliberately destroying the stream');  destroyStream.destroy(new Error('Stream manually destroyed'));});destroyStream.on('error', (err) => {  console.error(`Destruction error: ${err.message}`);});destroyStream.on('close', () => {  console.log('Destroyed stream closed');    // Clean up  fs.unlinkSync(destroyTestFile);  console.log('Destroy test file removed');});
```

* * *

## Best Practices for ReadStreams

When working with ReadStreams in Node.js, consider these best practices:

1.  **Always handle errors**: Always listen for and handle 'error' events from ReadStreams to prevent unhandled exceptions.
2.  **Clean up resources**: Ensure streams are properly closed or destroyed when no longer needed.
3.  **Use pipe() for most cases**: The `pipe()` method automatically handles backpressure and is typically the best way to connect streams.
4.  **Set appropriate buffer sizes**: Use the `highWaterMark` option to control memory usage, especially for large files.
5.  **Choose the right mode**: Understand the difference between flowing and paused modes, and use the appropriate one for your use case.
6.  **Consider encoding**: Set the appropriate encoding with `setEncoding()` if you're working with text.
7.  **Use stream.finished()**: For cleanup, consider using `stream.finished()` from the `stream` module to detect when a stream is no longer readable, writable or has experienced an error or premature close.
8.  **Avoid reading entire files into memory**: Use streams instead of methods like `fs.readFile()` for large files to avoid memory issues.

* * *