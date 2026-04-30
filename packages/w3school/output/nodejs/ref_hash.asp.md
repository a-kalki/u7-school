# Node.js Hash Reference

* * *

## Hash Object

The Hash class is part of Node.js's `crypto` module. It provides a way to create cryptographic hash digests of data. Hash instances are created using the `crypto.createHash()` method.

Hash functions are one-way functions that map data of arbitrary size to a fixed-size value called a digest. They are designed to be fast to compute but practically impossible to reverse.

### Import Crypto Module

```javascript
// Import the crypto moduleconst crypto = require('crypto');// Create a hash objectconst hash = crypto.createHash('sha256');
```

* * *

## Hash Methods

Method

Description

hash.update(data\[, inputEncoding\])

Updates the hash content with the given `data`. If `inputEncoding` is provided, `data` is a string using the specified encoding; otherwise, `data` is a Buffer, TypedArray, or DataView. This method can be called multiple times with new data.

hash.digest(\[encoding\])

Calculates the digest of all the data passed to the hash using `hash.update()`. If `encoding` is provided, a string is returned; otherwise, a Buffer is returned. After this method is called, the Hash object can no longer be used.

hash.copy()

Creates a new Hash object that contains a deep copy of the internal state of the current Hash object. This is useful when you want to generate multiple hashes based on the same partial data.

* * *

## Supported Hash Algorithms

Node.js supports many hash algorithms. You can get a list of all supported algorithms with:

```javascript
const crypto = require('crypto');// Get all supported hash algorithmsconsole.log(crypto.getHashes());
```

Common hash algorithms include:

Algorithm

Output Size

Description

Recommended Use

md5

128 bits (16 bytes)

Fast, but cryptographically broken

Only for non-security purposes (e.g., checksums)

sha1

160 bits (20 bytes)

Fast, but cryptographically broken

Only for non-security purposes

sha256

256 bits (32 bytes)

Part of SHA-2 family

General cryptographic use

sha512

512 bits (64 bytes)

Part of SHA-2 family

High-security applications

sha3-256

256 bits (32 bytes)

Part of SHA-3 family

Modern cryptographic applications

sha3-512

512 bits (64 bytes)

Part of SHA-3 family

High-security modern applications

* * *

* * *

## Basic Hash Example

The following example demonstrates how to create a hash digest of a string:

```javascript
const crypto = require('crypto');// Data to hashconst data = 'Hello, World!';// Create a hash objectconst hash = crypto.createHash('sha256');// Update the hash with datahash.update(data);// Get the digest in hex formatconst digest = hash.digest('hex');console.log('Data:', data);console.log('SHA-256 Hash:', digest);
```

* * *

## Comparing Different Hash Algorithms

This example compares different hash algorithms:

```javascript
const crypto = require('crypto');// Data to hashconst data = 'Node.js Crypto Hash Example';// Function to hash data with different algorithmsfunction hashWithAlgorithm(algorithm, data) {  const hash = crypto.createHash(algorithm);  hash.update(data);  return hash.digest('hex');}// Test various hash algorithmsconst algorithms = ['md5', 'sha1', 'sha256', 'sha512', 'sha3-256', 'sha3-512'];console.log(`Data: "${data}"`);console.log('------------------------------------');algorithms.forEach(algorithm => {  try {    const digest = hashWithAlgorithm(algorithm, data);    console.log(`${algorithm}: ${digest}`);    console.log(`Length: ${digest.length / 2} bytes (${digest.length * 4} bits)`);    console.log('------------------------------------');  } catch (error) {    console.log(`${algorithm}: Not supported - ${error.message}`);    console.log('------------------------------------');  }});
```

* * *

## Hashing with Multiple Updates

You can update a hash with multiple pieces of data before calculating the digest:

```javascript
const crypto = require('crypto');// Create a hash objectconst hash = crypto.createHash('sha256');// Update the hash with multiple pieces of datahash.update('First part of the data.');hash.update(' Second part of the data.');hash.update(' Third part of the data.');// Calculate the final digestconst digest = hash.digest('hex');console.log('Combined data: First part of the data. Second part of the data. Third part of the data.');console.log('SHA-256 Hash:', digest);// You can achieve the same result with a single updateconst singleHash = crypto.createHash('sha256');singleHash.update('First part of the data. Second part of the data. Third part of the data.');const singleDigest = singleHash.digest('hex');console.log('Single update hash matches multiple updates?', singleDigest === digest);
```

* * *

## Hash with Different Encodings

You can get a hash digest in different encodings:

```javascript
const crypto = require('crypto');// Data to hashconst data = 'Hello, Node.js!';// Function to hash data and get digest in different encodingsfunction hashWithEncoding(algorithm, data, encoding) {  const hash = crypto.createHash(algorithm);  hash.update(data);  return hash.digest(encoding);}// Hash the data with SHA-256 and display in different encodingsconsole.log(`Data: "${data}"`);console.log(`SHA-256 (hex): ${hashWithEncoding('sha256', data, 'hex')}`);console.log(`SHA-256 (base64): ${hashWithEncoding('sha256', data, 'base64')}`);console.log(`SHA-256 (base64url): ${hashWithEncoding('sha256', data, 'base64url')}`);console.log(`SHA-256 (binary): ${hashWithEncoding('sha256', data, 'binary')}`);// Get the digest as a Buffer (no encoding)const hash = crypto.createHash('sha256');hash.update(data);const buffer = hash.digest();console.log('SHA-256 (Buffer):', buffer);console.log('Buffer length:', buffer.length, 'bytes');
```

* * *

## File Hashing

You can hash the contents of a file:

```javascript
const crypto = require('crypto');const fs = require('fs');// Function to hash a file using streamsfunction hashFile(filePath, algorithm) {  return new Promise((resolve, reject) => {    // Create hash object    const hash = crypto.createHash(algorithm);        // Create read stream    const stream = fs.createReadStream(filePath);        // Handle stream events    stream.on('data', (data) => {      hash.update(data);    });        stream.on('end', () => {      const digest = hash.digest('hex');      resolve(digest);    });        stream.on('error', (error) => {      reject(error);    });  });}// Example usage (adjust file path as needed)const filePath = 'example.txt';// Create a test file if it doesn't existif (!fs.existsSync(filePath)) {  fs.writeFileSync(filePath, 'This is a test file for hashing.\n'.repeat(100));  console.log(`Created test file: ${filePath}`);}// Hash the file with different algorithmsPromise.all([  hashFile(filePath, 'md5'),  hashFile(filePath, 'sha1'),  hashFile(filePath, 'sha256')]).then(([md5Digest, sha1Digest, sha256Digest]) => {  console.log(`File: ${filePath}`);  console.log(`MD5: ${md5Digest}`);  console.log(`SHA-1: ${sha1Digest}`);  console.log(`SHA-256: ${sha256Digest}`);}).catch(error => {  console.error('Error hashing file:', error.message);});
```

* * *

## Using hash.copy()

The `hash.copy()` method allows you to create a copy of a hash object:

```javascript
const crypto = require('crypto');// Create a hash objectconst hash = crypto.createHash('sha256');// Update with common datahash.update('Common prefix data');// Create a copyconst hashCopy = hash.copy();// Update the original hash with more datahash.update(' with additional data for original');const originalDigest = hash.digest('hex');// Update the copy with different datahashCopy.update(' with different data for copy');const copyDigest = hashCopy.digest('hex');console.log('Original hash:', originalDigest);console.log('Copy hash:', copyDigest);console.log('Are they different?', originalDigest !== copyDigest);// This is useful when you want to create multiple hash variations// from a common starting point, without recalculating the common portion
```

* * *

## Hash Performance Comparison

This example compares the performance of different hash algorithms:

```javascript
const crypto = require('crypto');const { performance } = require('perf_hooks');// Data to hash (1MB of random data)const data = crypto.randomBytes(1024 * 1024);// Function to measure hash algorithm performancefunction measureHashPerformance(algorithm, iterations = 100) {  // Ensure the algorithm is supported  try {    crypto.createHash(algorithm);  } catch (error) {    return { algorithm, error: error.message };  }    const startTime = performance.now();    for (let i = 0; i < iterations; i++) {    const hash = crypto.createHash(algorithm);    hash.update(data);    hash.digest();  }    const endTime = performance.now();  const totalTime = endTime - startTime;    return {    algorithm,    iterations,    totalTimeMs: totalTime.toFixed(2),    timePerHashMs: (totalTime / iterations).toFixed(4),    hashesPerSecond: Math.floor(iterations / (totalTime / 1000))  };}// Test various hash algorithmsconst algorithms = ['md5', 'sha1', 'sha256', 'sha512', 'sha3-256', 'sha3-512'];const results = [];console.log('Measuring hash performance for 1MB of data...');algorithms.forEach(algorithm => {  results.push(measureHashPerformance(algorithm));});// Display results in a table formatconsole.table(results);// Display relative performance (normalized to the fastest algorithm)console.log('\nRelative Performance:');// Find the fastest algorithmconst fastest = results.reduce((prev, current) => {  if (current.error) return prev;  return (prev && prev.hashesPerSecond > current.hashesPerSecond) ? prev : current;}, null);if (fastest) {  results.forEach(result => {    if (!result.error) {      const relativeSpeed = (result.hashesPerSecond / fastest.hashesPerSecond).toFixed(2);      console.log(`${result.algorithm}: ${relativeSpeed}x (${result.hashesPerSecond} hashes/sec)`);    } else {      console.log(`${result.algorithm}: Error - ${result.error}`);    }  });}
```

* * *

## Password Hashing

**Warning:** The following example demonstrates password hashing with general-purpose hash functions. For secure password storage, use specialized algorithms like bcrypt, scrypt, or Argon2, which are specifically designed for password hashing and include salt and work factors.

This example shows how to hash passwords with a salt:

```javascript
const crypto = require('crypto');// Function to hash a password with a saltfunction hashPassword(password, salt) {  // Create hash object  const hash = crypto.createHash('sha256');    // Update with salt and password  hash.update(salt);  hash.update(password);    // Return digest  return hash.digest('hex');}// Generate a random saltfunction generateSalt() {  return crypto.randomBytes(16).toString('hex');}// Example usageconst password = 'mySecurePassword123';// For a new user, generate a salt and hash the passwordconst salt = generateSalt();const hashedPassword = hashPassword(password, salt);console.log('Password:', password);console.log('Salt:', salt);console.log('Hashed Password:', hashedPassword);// To verify a password, hash it with the same salt and comparefunction verifyPassword(password, salt, storedHash) {  const hash = hashPassword(password, salt);  return hash === storedHash;}// Check correct passwordconsole.log('Verification with correct password:',  verifyPassword(password, salt, hashedPassword));// Check incorrect passwordconsole.log('Verification with incorrect password:',  verifyPassword('wrongPassword', salt, hashedPassword));// Note: For production, use crypto.pbkdf2, bcrypt, scrypt, or Argon2 instead
```

### Better Password Hashing with crypto.pbkdf2

A more secure approach to password hashing using PBKDF2:

```javascript
const crypto = require('crypto');// Secure password hashing with PBKDF2function hashPasswordSecure(password, salt, iterations = 100000) {  return new Promise((resolve, reject) => {    crypto.pbkdf2(      password,      salt,      iterations,      64,      // Key length in bytes      'sha512', // Hash function      (err, derivedKey) => {        if (err) reject(err);        resolve(derivedKey.toString('hex'));      }    );  });}// Generate a random saltfunction generateSalt() {  return crypto.randomBytes(16).toString('hex');}// Example usageasync function example() {  try {    const password = 'mySecurePassword123';        // For a new user, generate a salt and hash the password    const salt = generateSalt();    const iterations = 100000; // Higher is more secure but slower        console.log('Password:', password);    console.log('Salt:', salt);    console.log('Iterations:', iterations);        const hashedPassword = await hashPasswordSecure(password, salt, iterations);    console.log('Hashed Password:', hashedPassword);        // To verify a password    const verifyCorrect = await hashPasswordSecure(password, salt, iterations) === hashedPassword;    console.log('Verification with correct password:', verifyCorrect);        const verifyWrong = await hashPasswordSecure('wrongPassword', salt, iterations) === hashedPassword;    console.log('Verification with incorrect password:', verifyWrong);        // For storage, you would save: salt, iterations, and hashedPassword  } catch (error) {    console.error('Error:', error.message);  }}example();
```

* * *

## Hash Collisions

Hash collisions occur when two different inputs produce the same hash value. This example demonstrates how to check for hash collisions:

```javascript
const crypto = require('crypto');// Function to generate random stringfunction generateRandomString(length) {  return crypto.randomBytes(length).toString('hex').substring(0, length);}// Function to find a partial hash collision (first few characters match)function findPartialCollision(targetLength) {  const hashMap = new Map();  let attempts = 0;    console.log(`Searching for partial SHA-256 collisions (first ${targetLength} characters)...`);    while (true) {    attempts++;        // Generate a random input    const input = generateRandomString(8);        // Hash the input    const hash = crypto.createHash('sha256').update(input).digest('hex');        // Get the target portion of the hash    const targetPortion = hash.substring(0, targetLength);        // Check if we've seen this target portion before    if (hashMap.has(targetPortion)) {      const previousInput = hashMap.get(targetPortion);            console.log(`Found a collision after ${attempts} attempts!`);      console.log(`Input 1: "${previousInput}"`);      console.log(`Input 2: "${input}"`);      console.log(`SHA-256 (Input 1): ${crypto.createHash('sha256').update(previousInput).digest('hex')}`);      console.log(`SHA-256 (Input 2): ${hash}`);      console.log(`Both hashes start with: ${targetPortion}`);            return {        attempts,        input1: previousInput,        input2: input,        collidingPrefix: targetPortion      };    }        // Store this hash    hashMap.set(targetPortion, input);        // Show progress    if (attempts % 100000 === 0) {      console.log(`Checked ${attempts} values, ${hashMap.size} unique prefixes found...`);    }        // Safety limit    if (attempts >= 1000000) {      console.log('Reached attempt limit without finding a collision.');      break;    }  }    return { attempts, collisionFound: false };}// Find a collision for the first few characters (increase for more challenge)findPartialCollision(4);// Note: Finding a full collision for SHA-256 is computationally infeasible// This example only demonstrates partial collisions
```

* * *

## Incremental Hash Processing

When working with large amounts of data, you can process it incrementally:

```javascript
const crypto = require('crypto');// Simulate processing a large file in chunksfunction processLargeDataIncrementally() {  // Create a hash object  const hash = crypto.createHash('sha256');    // Simulate reading data in chunks  const totalChunks = 10;    console.log(`Processing data in ${totalChunks} chunks...`);    for (let i = 0; i < totalChunks; i++) {    // In a real scenario, this would be data read from a file or stream    const chunk = `Chunk ${i + 1} of data with some random content: ${crypto.randomBytes(10).toString('hex')}`;        console.log(`Processing chunk ${i + 1}/${totalChunks}, size: ${chunk.length} bytes`);        // Update the hash with this chunk    hash.update(chunk);  }    // Calculate final hash after all chunks are processed  const finalHash = hash.digest('hex');  console.log('Final SHA-256 hash:', finalHash);}// Run the exampleprocessLargeDataIncrementally();
```

* * *

## Security Best Practices

When using hash functions, consider these security best practices:

1.  **Choose secure algorithms**: For security-critical applications, use SHA-256, SHA-512, SHA-3, or newer hash functions. Avoid MD5 and SHA-1 for security purposes.
2.  **Use purpose-specific functions**: For password hashing, use specialized functions like bcrypt, scrypt, or Argon2 instead of general-purpose hash functions.
3.  **Always use salts with passwords**: When storing password hashes, always use a unique random salt for each password.
4.  **Consider HMAC for message authentication**: When verifying data integrity with a secret key, use HMAC instead of plain hashes.
5.  **Be aware of length extension attacks**: Some hash functions (SHA-256, SHA-512, but not SHA-3) are vulnerable to length extension attacks when used naively for message authentication.
6.  **Keep dependencies updated**: Security vulnerabilities in cryptographic implementations are regularly discovered and patched.

* * *