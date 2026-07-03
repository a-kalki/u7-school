# Node.js WriteStream Reference

* * *

## WriteStream Object

A WriteStream is a stream that allows you to write data to a destination. Node.js provides WriteStream implementations for different use cases, such as writing to files (`fs.WriteStream`) or standard output (`process.stdout`).

WriteStreams implement the `stream.Writable` interface, which means they provide methods and events for writing data asynchronously and handling backpressure.

### Common WriteStream Types

*   `fs.WriteStream` - For writing to files
*   `process.stdout` and `process.stderr` - For writing to standard output and error
*   `net.Socket` (when writing) - For writing to network connections
*   `http.ServerResponse` - For writing HTTP responses

* * *

## WriteStream Properties

Here are the properties commonly available on Node.js WriteStream objects, primarily based on the `fs.WriteStream` implementation:

Property

Description

writeStream.bytesWritten

The number of bytes written so far.

writeStream.path

The file path that this WriteStream is writing to (`fs.WriteStream` only).

writeStream.pending

If `true`, the underlying file has not been opened yet.

writeStream.writableHighWaterMark

Returns the highWaterMark value for this WriteStream.

writeStream.writableLength

Returns the number of bytes (or objects) in the write queue ready to be written.

writeStream.writableEnded

Becomes `true` after `end()` has been called.

writeStream.writableFinished

Becomes `true` after the 'finish' event is emitted.

writeStream.writableObjectMode

Indicates whether the WriteStream is in object mode.

writeStream.destroyed

Indicates if the stream has been destroyed.

* * *

* * *

## WriteStream Methods

Here are the most important methods available on WriteStream objects:

Method

Description

writeStream.write(chunk\[, encoding\]\[, callback\])

Writes `chunk` to the stream. Returns `true` if the data was handled completely, or `false` if it was buffered. The `callback` is called when the chunk is flushed.

writeStream.end(\[chunk\]\[, encoding\]\[, callback\])

Signals that no more data will be written to the WriteStream. If `chunk` is provided, it's equivalent to `writeStream.write(chunk, encoding)` followed by `writeStream.end(callback)`.

writeStream.cork()

Forces all written data to be buffered in memory, which will be flushed when `uncork()` or `end()` is called.

writeStream.uncork()

Flushes all data buffered since `cork()` was called.

writeStream.destroy(\[error\])

Destroys the stream, and optionally emits an error event. After this call, the WriteStream is no longer usable.

writeStream.setDefaultEncoding(encoding)

Sets the default encoding for strings written to the stream.

* * *

## WriteStream Events

WriteStream objects emit the following events:

Event

Description

'close'

Emitted when the stream and any of its underlying resources have been closed.

'drain'

Emitted when the write buffer becomes empty and it's safe to write again. This is used for flow control when `write()` returns `false`.

'error'

Emitted if an error occurred during writing.

'finish'

Emitted after `end()` is called and all data has been processed.

'open'

Emitted when the underlying resource (e.g., file descriptor) has been opened (`fs.WriteStream` specific).

'pipe'

Emitted when the `pipe()` method is called on a ReadStream, adding this WriteStream as its destination.

'unpipe'

Emitted when the `unpipe()` method is called on a ReadStream that previously piped to this WriteStream.

'ready'

Emitted when the stream is ready to be used.

* * *

## Writing to a File

This example shows how to create a file WriteStream and write data to it:

```javascript
const fs = require('fs');const path = require('path');// Define the output file pathconst outputFile = path.join(__dirname, 'writestream-example.txt');// Create a WriteStream to write to the fileconst writeStream = fs.createWriteStream(outputFile, {  // Options  flags: 'w',          // 'w' for write (overwrites existing file)  encoding: 'utf8',    // Set the encoding for strings  mode: 0o666,         // File mode (permissions)  autoClose: true      // Automatically close the file descriptor when the stream ends});console.log('File WriteStream properties:');console.log(`- Path: ${writeStream.path}`);console.log(`- Pending: ${writeStream.pending}`);console.log(`- High Water Mark: ${writeStream.writableHighWaterMark} bytes`);// Handle stream eventswriteStream.on('open', (fd) => {  console.log(`File opened with descriptor: ${fd}`);});writeStream.on('ready', () => {  console.log('WriteStream is ready');    // Write data to the stream  writeStream.write('Hello, this is the first line.\n');  writeStream.write('This is the second line.\n');  writeStream.write('And this is the third line.\n');    // End the stream after writing all data  writeStream.end('This is the final line.\n', () => {    console.log('Finished writing to the file');    console.log(`Total bytes written: ${writeStream.bytesWritten}`);  });});// Handle drain event (when buffer is empty)writeStream.on('drain', () => {  console.log('Write buffer drained');});// Handle finish event (after end() and all data is flushed)writeStream.on('finish', () => {  console.log('All writes have been completed');    // Read back the file contents to verify  fs.readFile(outputFile, 'utf8', (err, data) => {    if (err) {      console.error(`Error reading file: ${err.message}`);      return;    }        console.log('\nFile content:');    console.log('-'.repeat(20));    console.log(data);    console.log('-'.repeat(20));        // Clean up the sample file    fs.unlink(outputFile, (err) => {      if (err) {        console.error(`Error removing file: ${err.message}`);        return;      }      console.log('Sample file removed');    });  });});writeStream.on('close', () => {  console.log('Stream closed');});writeStream.on('error', (err) => {  console.error(`Error: ${err.message}`);});
```

* * *

## Handling Backpressure

This example demonstrates how to handle backpressure when writing large amounts of data:

```javascript
const fs = require('fs');const path = require('path');// Define the output file pathconst backpressureFile = path.join(__dirname, 'backpressure-example.txt');// Create a WriteStream with a small highWaterMark to demonstrate backpressureconst writeStream = fs.createWriteStream(backpressureFile, {  highWaterMark: 1024 // 1KB buffer (small to demonstrate backpressure)});// Counter for how many chunks we've writtenlet chunksWritten = 0;let drainEvents = 0;// Function to write data until backpressure occursfunction writeChunks() {  console.log('Writing chunks...');    // Create a large chunk of data  const chunk = 'a'.repeat(256); // 256 bytes per chunk    // Try to write many chunks  let canContinue = true;    while (canContinue && chunksWritten < 100) {    // Attempt to write the chunk    canContinue = writeStream.write(`Chunk ${chunksWritten}: ${chunk}\n`);    chunksWritten++;        if (chunksWritten % 10 === 0) {      console.log(`Wrote ${chunksWritten} chunks so far`);    }        // If canContinue is false, we hit backpressure    if (!canContinue) {      console.log(`Backpressure hit after ${chunksWritten} chunks. Waiting for drain...`);            // Wait for the drain event before continuing      writeStream.once('drain', () => {        drainEvents++;        console.log(`Drain event #${drainEvents} occurred. Resuming writes...`);        writeChunks(); // Continue writing      });    }  }    // If we've written all chunks, end the stream  if (chunksWritten >= 100) {    writeStream.end('\nAll chunks have been written.\n', () => {      console.log('Ended the WriteStream after writing all chunks');    });  }}// Start writing chunks when the stream is readywriteStream.on('ready', () => {  console.log('WriteStream is ready with highWaterMark =',    writeStream.writableHighWaterMark, 'bytes');    // Start writing chunks  writeChunks();});// Handle finish eventwriteStream.on('finish', () => {  console.log('\nWrite operation completed');  console.log(`Total chunks written: ${chunksWritten}`);  console.log(`Total drain events: ${drainEvents}`);  console.log(`Total bytes written: ${writeStream.bytesWritten}`);    // Clean up the sample file  fs.unlink(backpressureFile, (err) => {    if (err) {      console.error(`Error removing file: ${err.message}`);      return;    }    console.log('Sample file removed');  });});// Handle errorswriteStream.on('error', (err) => {  console.error(`Error: ${err.message}`);});
```

* * *

## Using cork() and uncork()

This example demonstrates using `cork()` and `uncork()` to batch writes together:

```javascript
const fs = require('fs');const path = require('path');// Define the output file pathsconst uncorkedFile = path.join(__dirname, 'uncorked-example.txt');const corkedFile = path.join(__dirname, 'corked-example.txt');// Function to run the demonstrationfunction demonstrateCorkUncork() {  console.log('Demonstrating cork() and uncork() methods');    // 1. Write without corking  const uncorkedStream = fs.createWriteStream(uncorkedFile);    uncorkedStream.on('finish', () => {    console.log(`Uncorked stream finished. Bytes written: ${uncorkedStream.bytesWritten}`);        // 2. Now write with corking    const corkedStream = fs.createWriteStream(corkedFile);        corkedStream.on('finish', () => {      console.log(`Corked stream finished. Bytes written: ${corkedStream.bytesWritten}`);            // Compare files      fs.readFile(uncorkedFile, 'utf8', (err, uncorkedData) => {        if (err) {          console.error(`Error reading uncorked file: ${err.message}`);          return;        }                fs.readFile(corkedFile, 'utf8', (err, corkedData) => {          if (err) {            console.error(`Error reading corked file: ${err.message}`);            return;          }                    console.log('\nFile comparison:');          console.log(`- Uncorked file size: ${uncorkedData.length} bytes`);          console.log(`- Corked file size: ${corkedData.length} bytes`);          console.log(`- Content identical: ${uncorkedData === corkedData}`);                    // Clean up sample files          fs.unlinkSync(uncorkedFile);          fs.unlinkSync(corkedFile);          console.log('Sample files removed');        });      });    });        // Start cork operation    console.log('Writing with cork()...');    corkedStream.cork();        // Write multiple chunks of data    for (let i = 0; i < 1000; i++) {      corkedStream.write(`Line ${i}: This data is being corked.\n`);    }        // Uncork to flush the buffer - in real applications, you might cork/uncork    // multiple times to batch writes together    corkedStream.uncork();        // End the stream    corkedStream.end();  });    // Write without corking  console.log('Writing without cork()...');  for (let i = 0; i < 1000; i++) {    uncorkedStream.write(`Line ${i}: This data is not being corked.\n`);  }    // End the stream  uncorkedStream.end();}// Run the demonstrationdemonstrateCorkUncork();
```

* * *

## Writing to Standard Output

This example shows how to use the `process.stdout` WriteStream:

```javascript
// process.stdout is a WriteStream// Basic writing to stdoutprocess.stdout.write('Hello, ');process.stdout.write('world!\n');// Check if stdout supports color (most terminals do)const supportsColor = process.stdout.hasColors && process.stdout.hasColors();// Simple formatting if color is supportedif (supportsColor) {  // ANSI escape codes for colors  const colors = {    red: '\x1b[31m',    green: '\x1b[32m',    yellow: '\x1b[33m',    blue: '\x1b[34m',    reset: '\x1b[0m'  };    process.stdout.write(`${colors.red}This text is red.\n${colors.reset}`);  process.stdout.write(`${colors.green}This text is green.\n${colors.reset}`);  process.stdout.write(`${colors.blue}This text is blue.\n${colors.reset}`);} else {  process.stdout.write('Your terminal does not support colors.\n');}// Writing tabular dataconst table = [  ['Name', 'Age', 'Country'],  ['John', '28', 'USA'],  ['Maria', '32', 'Spain'],  ['Yuki', '24', 'Japan']];process.stdout.write('\nTable Example:\n');table.forEach(row => {  process.stdout.write(`${row[0].padEnd(10)}${row[1].padEnd(5)}${row[2]}\n`);});// Progress bar exampleprocess.stdout.write('\nProgress Bar Example:\n');function showProgress(percent) {  const width = 40;  const completed = Math.floor(width * (percent / 100));  const remaining = width - completed;    // Create the progress bar  const bar = '[' + '#'.repeat(completed) + ' '.repeat(remaining) + ']';    // Use \r to return to the beginning of the line  process.stdout.write(`\r${bar} ${percent}%`);    // When complete, add a newline  if (percent === 100) {    process.stdout.write('\nComplete!\n');  }}// Simulate progresslet progress = 0;const progressInterval = setInterval(() => {  progress += 10;  showProgress(progress);    if (progress >= 100) {    clearInterval(progressInterval);  }}, 300);// Note: The progress bar example is more effective in a terminal// than in the W3Schools TryIt editor
```

* * *

## HTTP WriteStream Example

This example shows how to use a WriteStream to handle HTTP response data:

```javascript
const http = require('http');// Create an HTTP serverconst server = http.createServer((req, res) => {  // res is an http.ServerResponse, which is a WriteStream  console.log(`Received ${req.method} request to ${req.url}`);    // Set response headers  res.setHeader('Content-Type', 'text/html');    // Check if the client requested a streaming response  if (req.url === '/stream') {    // Demonstrate streaming a large response    streamLargeResponse(res);  } else {    // Default handler - show links to examples    res.writeHead(200, {'Content-Type': 'text/html'});    res.end(`      <!DOCTYPE html>      <html>      <head><title>HTTP WriteStream Example</title></head>      <body>        <h1>HTTP WriteStream Examples</h1>        <ul>          <li><a href="/stream">Stream a large response</a></li>        </ul>      </body>      </html>    `);  }});// Function to stream a large response piece by piecefunction streamLargeResponse(res) {  // Set appropriate headers  res.writeHead(200, {    'Content-Type': 'text/html',    'Transfer-Encoding': 'chunked'  // Enable chunked transfer encoding  });    // Write the HTML header  res.write(`    <!DOCTYPE html>    <html>    <head>      <title>Streaming Response Example</title>      <style>        body { font-family: Arial, sans-serif; margin: 20px; }        .chunk { padding: 10px; margin: 5px; background-color: #f0f0f0; }      </style>    </head>    <body>      <h1>Streaming Response Example</h1>      <p>This response is being streamed in chunks with delays between them.</p>      <div id="chunks">  `);    // Number of chunks to send  const totalChunks = 10;  let sentChunks = 0;    // Function to send a chunk  function sendChunk() {    sentChunks++;        const now = new Date().toISOString();    const chunk = `      <div class="chunk">        <h3>Chunk ${sentChunks} of ${totalChunks}</h3>        <p>Sent at: ${now}</p>        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam vehicula magna eros,        eget gravida dolor fermentum non.</p>      </div>    `;        // Write the chunk to the response    res.write(chunk);        // If we've sent all chunks, end the response    if (sentChunks >= totalChunks) {      // Write HTML footer      res.end(`        </div>        <p>All chunks have been sent.</p>      </body>      </html>      `);      console.log('Finished streaming response');    } else {      // Otherwise, schedule the next chunk      setTimeout(sendChunk, 500); // Send a chunk every 500ms    }  }    // Start sending chunks  console.log('Starting to stream response');  sendChunk();}// Start the serverconst PORT = 8080;server.listen(PORT, () => {  console.log(`HTTP WriteStream example server running at http://localhost:${PORT}`);});// Note: To see this in action, you need to run the server and open the browser at// http://localhost:8080
```

* * *

## Error Handling with WriteStreams

This example demonstrates proper error handling with WriteStreams:

```javascript
const fs = require('fs');const path = require('path');// Function to write to a file with proper error handlingfunction writeWithErrorHandling(filePath, data) {  console.log(`Attempting to write to: ${filePath}`);    // Create the WriteStream  const writeStream = fs.createWriteStream(filePath);    // Set up promise to capture result or error  return new Promise((resolve, reject) => {    // Handle errors    writeStream.on('error', (err) => {      console.error(`Error writing to ${filePath}: ${err.message}`);            // Make sure the stream is destroyed properly      writeStream.destroy();      reject(err);    });        // Handle successful completion    writeStream.on('finish', () => {      console.log(`Successfully wrote ${writeStream.bytesWritten} bytes to ${filePath}`);      resolve(writeStream.bytesWritten);    });        // Write the data    writeStream.write(data, (err) => {      if (err) {        console.error(`Error during write operation: ${err.message}`);        // The 'error' event will also be emitted in this case      } else {        console.log('Data written successfully, ending stream');        writeStream.end();      }    });  });}// Test with valid and invalid file pathsconst validPath = path.join(__dirname, 'valid-path.txt');const invalidPath = path.join('/', 'invalid', 'path', 'file.txt'); // Likely to be invalid on most systems// Example 1: Writing to a valid pathconsole.log('Example 1: Writing to a valid path');writeWithErrorHandling(validPath, 'This is test content for error handling example')  .then(bytesWritten => {    console.log(`Verified: ${bytesWritten} bytes written`);        // Clean up the test file    fs.unlinkSync(validPath);    console.log('Test file removed');        // Example 2: Writing to an invalid path    console.log('\nExample 2: Writing to an invalid path');    return writeWithErrorHandling(invalidPath, 'This should fail');  })  .catch(err => {    console.log('Error caught in Promise catch:', err.message);  });// Example 3: Demonstrating destroyed streamsconsole.log('\nExample 3: Demonstrating destroyed streams');function demonstrateDestroyedStream() {  const destroyTestFile = path.join(__dirname, 'destroy-test.txt');  const writeStream = fs.createWriteStream(destroyTestFile);    writeStream.on('error', (err) => {    console.error(`Destruction error: ${err.message}`);  });    writeStream.on('close', () => {    console.log('Destroyed stream closed');        // Clean up if the file was created    if (fs.existsSync(destroyTestFile)) {      fs.unlinkSync(destroyTestFile);      console.log('Destroy test file removed');    }  });    // Write some data  writeStream.write('Initial data before destruction\n');    // Destroy the stream with an error  console.log('Deliberately destroying the stream');  writeStream.destroy(new Error('Stream manually destroyed'));    // Attempt to write after destruction (should fail silently)  const writeResult = writeStream.write('This should not be written');  console.log(`Attempt to write after destruction returned: ${writeResult}`);}demonstrateDestroyedStream();
```

* * *

## Best Practices for WriteStreams

When working with WriteStreams in Node.js, consider these best practices:

  1.  **Always handle errors**: Always listen for and handle 'error' events from WriteStreams to prevent unhandled exceptions.
  2.  **Handle backpressure**: Pay attention to the return value of `write()` and use the 'drain' event to control flow and prevent memory issues.
3.  **Use cork() for batching**: Use `cork()` and `uncork()` to batch write operations, improving performance for many small writes.
4.  **Clean up resources**: Ensure streams are properly closed with `end()` or destroyed with `destroy()` when no longer needed.
5.  **Set appropriate buffer sizes**: Use the `highWaterMark` option to control memory usage, especially when dealing with high-throughput applications.
6.  **Use pipe() when possible**: The `pipe()` method automatically handles backpressure and is typically the best way to connect streams.
7.  **Consider encoding**: Set the appropriate encoding with `setDefaultEncoding()` when working with text.
8.  **Use stream.finished()**: For cleanup, consider using `stream.finished()` from the `stream` module to detect when a stream is no longer writable or has experienced an error or premature close.

* * *