# Node.js File System Module

* * *

## Introduction to Node.js File System

The Node.js File System module (fs) provides a comprehensive set of methods for working with the file system on your computer.

It allows you to perform file I/O operations in both synchronous and asynchronous ways.

**Note:** The File System module is a core Node.js module, so no installation is required.

### Importing the File System Module

You can import the File System module using CommonJS `require()` or ES modules `import` syntax:

```javascript
const fs = require('fs');
```
```javascript
import fs from 'fs';// Or for specific methods:// import { readFile, writeFile } from 'fs/promises';
```

### Promise-based API

Node.js provides promise-based versions of the File System API in the `fs/promises` namespace, which is recommended for modern applications:

```javascript
// Using promises (Node.js 10.0.0+)const fs = require('fs').promises;// Or with destructuringconst { readFile, writeFile } = require('fs').promises;// Or with ES modules// import { readFile, writeFile } from 'fs/promises';
```

### Common Use Cases

#### File Operations

*   Read and write files
*   Create and delete files
*   Append to files
*   Rename and move files
*   Change file permissions

#### Directory Operations

*   Create and remove directories
*   List directory contents
*   Watch for file changes
*   Get file/directory stats
*   Check file existence

#### Advanced Features

*   File streams
*   File descriptors
*   Symbolic links
*   File watching
*   Working with file permissions

**Performance Tip:** For large files, consider using streams (`fs.createReadStream` and `fs.createWriteStream`) to avoid high memory usage.

* * *

## Reading Files

Node.js provides several methods to read files, including both callback-based and promise-based approaches.

The most common method is `fs.readFile()`.

**Note:** Always handle errors when working with file operations to prevent your application from crashing.

### Reading Files with Callbacks

Here's how to read a file using the traditional callback pattern:

```javascript
This is the content of myfile.txt
```

Create a Node.js file that reads the text file, and return the content:

```javascript
const fs = require('fs');// Read file asynchronously with callbackfs.readFile('myfile.txt', 'utf8', (err, data) => {  if (err) {    console.error('Error reading file:', err);    return;  }  console.log('File content:', data);});// For binary data (like images), omit the encodingfs.readFile('image.png', (err, data) => {  if (err) throw err;  // data is a Buffer containing the file content  console.log('Image size:', data.length, 'bytes');});
```

### Reading Files with Promises (Modern Approach)

Using `fs.promises` or `util.promisify` for cleaner async/await syntax:

```javascript
// Using fs.promises (Node.js 10.0.0+)const fs = require('fs').promises;async function readFileExample() {  try {    const data = await fs.readFile('myfile.txt', 'utf8');    console.log('File content:', data);  } catch (err) {    console.error('Error reading file:', err);  }}readFileExample();// Or with util.promisify (Node.js 8.0.0+)const { promisify } = require('util');const readFileAsync = promisify(require('fs').readFile);async function readWithPromisify() {  try {    const data = await readFileAsync('myfile.txt', 'utf8');    console.log(data);  } catch (err) {    console.error(err);  }}readWithPromisify();
```

### Reading Files Synchronously

For simple scripts, you can use synchronous methods, but avoid them in production servers as they block the event loop:

```javascript
const fs = require('fs');try {  // Read file synchronously  const data = fs.readFileSync('myfile.txt', 'utf8');  console.log('File content:', data);} catch (err) {  console.error('Error reading file:', err);}
```

**Best Practice:** Always specify the character encoding (like 'utf8') when reading text files to get a string instead of a Buffer.

* * *

* * *

## Creating and Writing Files

Node.js provides several methods for creating and writing to files.

Here are the most common approaches:

### 1\. Using `fs.writeFile()`

Creates a new file or overwrites an existing file with the specified content:

```javascript
const fs = require('fs').promises;async function writeFileExample() {  try {    // Write text to a file    await fs.writeFile('myfile.txt', 'Hello, World!', 'utf8');    // Write JSON data    const data = { name: 'John', age: 30, city: 'New York' };    await fs.writeFile('data.json', JSON.stringify(data, null, 2), 'utf8');    console.log('Files created successfully');  } catch (err) {    console.error('Error writing files:', err);  }}writeFileExample();
```

### 2\. Using `fs.appendFile()`

Appends content to a file, creating the file if it doesn't exist:

```javascript
const fs = require('fs').promises;async function appendToFile() {  try {    // Append a timestamped log entry    const logEntry = `${new Date().toISOString()}: Application started\n`;    await fs.appendFile('app.log', logEntry, 'utf8');    console.log('Log entry added');  } catch (err) {    console.error('Error appending to file:', err);  }}appendToFile();
```

### 3\. Using File Handles

For more control over file operations, you can use file handles:

```javascript
const fs = require('fs').promises;async function writeWithFileHandle() {  let fileHandle;  try {    // Open a file for writing (creates if doesn't exist)    fileHandle = await fs.open('output.txt', 'w');    // Write content to the file    await fileHandle.write('First line\n');    await fileHandle.write('Second line\n');    await fileHandle.write('Third line\n');    console.log('Content written successfully');  } catch (err) {    console.error('Error writing to file:', err);  } finally {    // Always close the file handle    if (fileHandle) {      await fileHandle.close();    }  }}writeWithFileHandle();
```

### 4\. Using Streams for Large Files

For writing large amounts of data, use streams to avoid high memory usage:

```javascript
const fs = require('fs');const { pipeline } = require('stream/promises');const { Readable } = require('stream');async function writeLargeFile() {  // Create a readable stream (could be from HTTP request, etc.)  const data = Array(1000).fill().map((_, i) => `Line ${i + 1}: ${'x'.repeat(100)}\n`);  const readable = Readable.from(data);  // Create a writable stream to a file  const writable = fs.createWriteStream('large-file.txt');  try {    // Pipe the data from readable to writable    await pipeline(readable, writable);    console.log('Large file written successfully');  } catch (err) {    console.error('Error writing file:', err);  }}writeLargeFile();
```

**File Flags:** When opening files, you can specify different modes:

*   `'w'` - Open for writing (file is created or truncated)
*   `'wx'` - Like 'w' but fails if the path exists
*   `'w+'` - Open for reading and writing (file is created or truncated)
*   `'a'` - Open for appending (file is created if it doesn't exist)
*   `'ax'` - Like 'a' but fails if the path exists
*   `'r+'` - Open for reading and writing (file must exist)

* * *

## Deleting Files and Directories

Node.js provides several methods to delete files and directories.

Here's how to handle different deletion scenarios:

### 1\. Deleting a Single File

Use `fs.unlink()` to delete a file:

```javascript
const fs = require('fs').promises;async function deleteFile() {  const filePath = 'file-to-delete.txt';  try {    // Check if file exists before deleting    await fs.access(filePath);    // Delete the file    await fs.unlink(filePath);    console.log('File deleted successfully');  } catch (err) {    if (err.code === 'ENOENT') {      console.log('File does not exist');    } else {      console.error('Error deleting file:', err);    }  }}deleteFile();
```

### 2\. Deleting Multiple Files

To delete multiple files, you can use Promise.all() with fs.unlink():

```javascript
const fs = require('fs').promises;const path = require('path');async function deleteFiles() {  const filesToDelete = [    'temp1.txt',    'temp2.txt',    'temp3.txt'  ];  try {    // Delete all files in parallel    await Promise.all(      filesToDelete.map(file =>        fs.unlink(file).catch(err => {          if (err.code !== 'ENOENT') {            console.error(`Error deleting ${file}:`, err);          }        })      )    );    console.log('Files deleted successfully');  } catch (err) {    console.error('Error during file deletion:', err);  }}deleteFiles();
```

### 3\. Deleting Directories

To delete directories, you have several options depending on your needs:

```javascript
const fs = require('fs').promises;const path = require('path');async function deleteDirectory(dirPath) {  try {    // Check if the directory exists    const stats = await fs.stat(dirPath);       if (!stats.isDirectory()) {      console.log('Path is not a directory');      return;    }    // For Node.js 14.14.0+ (recommended)    await fs.rm(dirPath, { recursive: true, force: true });    // For older Node.js versions (deprecated but still works)    // await fs.rmdir(dirPath, { recursive: true });    console.log('Directory deleted successfully');  } catch (err) {    if (err.code === 'ENOENT') {      console.log('Directory does not exist');    } else {      console.error('Error deleting directory:', err);    }  }}// UsagedeleteDirectory('directory-to-delete');
```

### 4\. Emptying a Directory Without Deleting It

To remove all files and subdirectories within a directory but keep the directory itself:

```javascript
const fs = require('fs').promises;const path = require('path');async function emptyDirectory(dirPath) {  try {    // Read the directory    const files = await fs.readdir(dirPath, { withFileTypes: true });    // Delete all files and directories in parallel    await Promise.all(      files.map(file => {        const fullPath = path.join(dirPath, file.name);        return file.isDirectory()          ? fs.rm(fullPath, { recursive: true, force: true })          : fs.unlink(fullPath);      })    );    console.log('Directory emptied successfully');  } catch (err) {    console.error('Error emptying directory:', err);  }}// UsageemptyDirectory('directory-to-empty');
```

**Security Note:** Be extremely careful with file deletion, especially when using recursive options or wildcards. Always validate and sanitize file paths to prevent directory traversal attacks.

* * *

## Renaming and Moving Files

The `fs.rename()` method can be used for both renaming and moving files.

It's a versatile method for file system operations that involve changing file paths.

### 1\. Basic File Renaming

To rename a file in the same directory:

```javascript
const fs = require('fs').promises;async function renameFile() {  const oldPath = 'old-name.txt';  const newPath = 'new-name.txt';  try {    // Check if source file exists    await fs.access(oldPath);    // Check if destination file already exists    try {      await fs.access(newPath);      console.log('Destination file already exists');      return;    } catch (err) {      // Destination doesn't exist, safe to proceed    }    // Perform the rename    await fs.rename(oldPath, newPath);    console.log('File renamed successfully');  } catch (err) {    if (err.code === 'ENOENT') {      console.log('Source file does not exist');    } else {      console.error('Error renaming file:', err);    }  }}// UsagerenameFile();
```

### 2\. Moving Files Between Directories

You can use `fs.rename()` to move files between directories:

```javascript
const fs = require('fs').promises;const path = require('path');async function moveFile() {  const sourceFile = 'source/file.txt';  const targetDir = 'destination';  const targetFile = path.join(targetDir, 'file.txt');  try {    // Ensure source file exists    await fs.access(sourceFile);    // Create target directory if it doesn't exist    await fs.mkdir(targetDir, { recursive: true });    // Move the file    await fs.rename(sourceFile, targetFile);    console.log('File moved successfully');  } catch (err) {    if (err.code === 'ENOENT') {      console.log('Source file does not exist');    } else if (err.code === 'EXDEV') {      console.log('Cross-device move detected, using copy+delete fallback');      await moveAcrossDevices(sourceFile, targetFile);    } else {      console.error('Error moving file:', err);    }  }}// Helper function for cross-device movesasync function moveAcrossDevices(source, target) {  try {    // Copy the file    await fs.copyFile(source, target);    // Delete the original    await fs.unlink(source);    console.log('File moved across devices successfully');  } catch (err) {    // Clean up if something went wrong    try { await fs.unlink(target); } catch (e) {}    throw err;  }}// UsagemoveFile();
```

### 3\. Batch Renaming Files

To rename multiple files matching a pattern:

```javascript
const fs = require('fs').promises;const path = require('path');async function batchRename() {  const directory = 'images';  const pattern = /^image(\d+)\.jpg$/;  try {    // Read directory contents    const files = await fs.readdir(directory);    // Process each file    for (const file of files) {      const match = file.match(pattern);      if (match) {        const [_, number] = match;        const newName = `photo-${number.padStart(3, '0')}.jpg`;        const oldPath = path.join(directory, file);        const newPath = path.join(directory, newName);        // Skip if the new name is the same as the old name        if (oldPath !== newPath) {          await fs.rename(oldPath, newPath);          console.log(`Renamed: ${file} - ${newName}`);        }      }    }    console.log('Batch rename completed');  } catch (err) {    console.error('Error during batch rename:', err);  }}batchRename();
```

### 4\. Atomic Rename Operations

For critical operations, use a temporary file to ensure atomicity:

```javascript
const fs = require('fs').promises;const path = require('path');const os = require('os');async function updateFileAtomic(filePath, newContent) {  const tempPath = path.join(    os.tmpdir(),    `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`  );  try {    // 1. Write to temp file    await fs.writeFile(tempPath, newContent, 'utf8');    // 2. Verify the temp file was written correctly    const stats = await fs.stat(tempPath);    if (stats.size === 0) {      throw new Error('Temporary file is empty');    }    // 3. Rename (atomic on most systems)    await fs.rename(tempPath, filePath);    console.log('File updated atomically');  } catch (err) {    // Clean up temp file if it exists    try { await fs.unlink(tempPath); } catch (e) {}    console.error('Atomic update failed:', err);    throw err;  }}// UsageupdateFileAtomic('important-config.json', JSON.stringify({ key: 'value' }, null, 2));
```

**Cross-Platform Note:** The `fs.rename()` operation is atomic on Unix-like systems but may not be on Windows.

For cross-platform atomic operations, consider using a temporary file approach as shown in the example above.

* * *

* * *