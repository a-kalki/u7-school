# Node.js Hmac Reference

* * *

## Hmac Object

The Hmac class is part of Node.js's `crypto` module. It provides a way to create cryptographic HMAC (Hash-based Message Authentication Code) digests. HMAC instances are created using the `crypto.createHmac()` method.

HMAC combines a cryptographic hash function with a secret key to produce a message authentication code, providing both data integrity and authentication.

### Import Crypto Module

```javascript
// Import the crypto moduleconst crypto = require('crypto');// Create an Hmac objectconst hmac = crypto.createHmac('sha256', 'your-secret-key');
```

* * *

## Hmac Methods

Method

Description

hmac.update(data\[, inputEncoding\])

Updates the Hmac content with the given `data`. If `inputEncoding` is provided, `data` is a string using the specified encoding; otherwise, `data` is a Buffer, TypedArray, or DataView. This method can be called multiple times with new data.

hmac.digest(\[encoding\])

Calculates the HMAC digest of all the data passed to the Hmac using `hmac.update()`. If `encoding` is provided, a string is returned; otherwise, a Buffer is returned. After this method is called, the Hmac object can no longer be used.

* * *

## Basic Hmac Example

The following example demonstrates how to create an HMAC digest of a string:

```javascript
const crypto = require('crypto');// Data to authenticateconst data = 'Hello, World!';// Secret keyconst secretKey = 'my-secret-key';// Create an Hmac objectconst hmac = crypto.createHmac('sha256', secretKey);// Update the hmac with datahmac.update(data);// Get the digest in hex formatconst digest = hmac.digest('hex');console.log('Data:', data);console.log('Secret Key:', secretKey);console.log('HMAC-SHA256:', digest);
```

* * *

* * *

## Comparing Different HMAC Algorithms

This example compares different hash algorithms with HMAC:

```javascript
const crypto = require('crypto');// Data to authenticateconst data = 'Node.js Crypto HMAC Example';// Secret keyconst secretKey = 'my-secret-key';// Function to create HMAC with different algorithmsfunction createHmacWithAlgorithm(algorithm, data, key) {  const hmac = crypto.createHmac(algorithm, key);  hmac.update(data);  return hmac.digest('hex');}// Test various HMAC algorithmsconst algorithms = ['md5', 'sha1', 'sha256', 'sha512', 'sha3-256', 'sha3-512'];console.log(`Data: "${data}"`);console.log(`Secret Key: "${secretKey}"`);console.log('------------------------------------');algorithms.forEach(algorithm => {  try {    const digest = createHmacWithAlgorithm(algorithm, data, secretKey);    console.log(`HMAC-${algorithm}: ${digest}`);    console.log(`Length: ${digest.length / 2} bytes (${digest.length * 4} bits)`);    console.log('------------------------------------');  } catch (error) {    console.log(`HMAC-${algorithm}: Not supported - ${error.message}`);    console.log('------------------------------------');  }});
```

* * *

## HMAC with Multiple Updates

You can update an HMAC with multiple pieces of data before calculating the digest:

```javascript
const crypto = require('crypto');// Secret keyconst secretKey = 'my-secret-key';// Create an Hmac objectconst hmac = crypto.createHmac('sha256', secretKey);// Update the hmac with multiple pieces of datahmac.update('First part of the data.');hmac.update(' Second part of the data.');hmac.update(' Third part of the data.');// Calculate the final digestconst digest = hmac.digest('hex');console.log('Combined data: First part of the data. Second part of the data. Third part of the data.');console.log('Secret Key:', secretKey);console.log('HMAC-SHA256:', digest);// You can achieve the same result with a single updateconst singleHmac = crypto.createHmac('sha256', secretKey);singleHmac.update('First part of the data. Second part of the data. Third part of the data.');const singleDigest = singleHmac.digest('hex');console.log('Single update HMAC matches multiple updates?', singleDigest === digest);
```

* * *

## HMAC with Different Encodings

You can get an HMAC digest in different encodings:

```javascript
const crypto = require('crypto');// Data to authenticateconst data = 'Hello, Node.js!';// Secret keyconst secretKey = 'my-secret-key';// Function to create HMAC and get digest in different encodingsfunction createHmacWithEncoding(algorithm, data, key, encoding) {  const hmac = crypto.createHmac(algorithm, key);  hmac.update(data);  return hmac.digest(encoding);}// Create HMAC with SHA-256 and display in different encodingsconsole.log(`Data: "${data}"`);console.log(`Secret Key: "${secretKey}"`);console.log(`HMAC-SHA256 (hex): ${createHmacWithEncoding('sha256', data, secretKey, 'hex')}`);console.log(`HMAC-SHA256 (base64): ${createHmacWithEncoding('sha256', data, secretKey, 'base64')}`);console.log(`HMAC-SHA256 (base64url): ${createHmacWithEncoding('sha256', data, secretKey, 'base64url')}`);console.log(`HMAC-SHA256 (binary): ${createHmacWithEncoding('sha256', data, secretKey, 'binary')}`);// Get the digest as a Buffer (no encoding)const hmac = crypto.createHmac('sha256', secretKey);hmac.update(data);const buffer = hmac.digest();console.log('HMAC-SHA256 (Buffer):', buffer);console.log('Buffer length:', buffer.length, 'bytes');
```

* * *

## File Authentication with HMAC

You can create an HMAC digest of a file's contents:

```javascript
const crypto = require('crypto');const fs = require('fs');// Function to create HMAC for a file using streamsfunction createHmacForFile(filePath, algorithm, key) {  return new Promise((resolve, reject) => {    // Create Hmac object    const hmac = crypto.createHmac(algorithm, key);        // Create read stream    const stream = fs.createReadStream(filePath);        // Handle stream events    stream.on('data', (data) => {      hmac.update(data);    });        stream.on('end', () => {      const digest = hmac.digest('hex');      resolve(digest);    });        stream.on('error', (error) => {      reject(error);    });  });}// Secret keyconst secretKey = 'file-authentication-key';// Example usage (adjust file path as needed)const filePath = 'example.txt';// Create a test file if it doesn't existif (!fs.existsSync(filePath)) {  fs.writeFileSync(filePath, 'This is a test file for HMAC authentication.\n'.repeat(100));  console.log(`Created test file: ${filePath}`);}// Create HMAC for the file with different algorithmsPromise.all([  createHmacForFile(filePath, 'md5', secretKey),  createHmacForFile(filePath, 'sha1', secretKey),  createHmacForFile(filePath, 'sha256', secretKey)]).then(([md5Digest, sha1Digest, sha256Digest]) => {  console.log(`File: ${filePath}`);  console.log(`Secret Key: ${secretKey}`);  console.log(`HMAC-MD5: ${md5Digest}`);  console.log(`HMAC-SHA1: ${sha1Digest}`);  console.log(`HMAC-SHA256: ${sha256Digest}`);    // Store the HMAC for later verification  fs.writeFileSync(`${filePath}.hmac`, sha256Digest);  console.log(`HMAC stored in: ${filePath}.hmac`);}).catch(error => {  console.error('Error creating HMAC for file:', error.message);});
```

* * *

## Verifying File Integrity with HMAC

This example demonstrates how to verify a file's integrity using a previously generated HMAC:

```javascript
const crypto = require('crypto');const fs = require('fs');// Function to create HMAC for a filefunction createHmacForFile(filePath, algorithm, key) {  return new Promise((resolve, reject) => {    const hmac = crypto.createHmac(algorithm, key);    const stream = fs.createReadStream(filePath);        stream.on('data', (data) => {      hmac.update(data);    });        stream.on('end', () => {      const digest = hmac.digest('hex');      resolve(digest);    });        stream.on('error', (error) => {      reject(error);    });  });}// Function to verify file integrityasync function verifyFileIntegrity(filePath, storedHmacPath, algorithm, key) {  try {    // Read the stored HMAC    const storedHmac = fs.readFileSync(storedHmacPath, 'utf8').trim();        // Calculate the current HMAC    const currentHmac = await createHmacForFile(filePath, algorithm, key);        // Compare the HMACs    const isValid = currentHmac === storedHmac;        return {      isValid,      storedHmac,      currentHmac    };  } catch (error) {    throw new Error(`Verification failed: ${error.message}`);  }}// Secret key (must be the same as used to create the original HMAC)const secretKey = 'file-authentication-key';// Example usageconst filePath = 'example.txt';const hmacPath = `${filePath}.hmac`;// Verify the file integrityverifyFileIntegrity(filePath, hmacPath, 'sha256', secretKey)  .then(result => {    console.log(`File: ${filePath}`);    console.log(`HMAC file: ${hmacPath}`);    console.log(`Integrity verified: ${result.isValid}`);        if (!result.isValid) {      console.log('Stored HMAC:', result.storedHmac);      console.log('Current HMAC:', result.currentHmac);      console.log('The file has been modified!');    } else {      console.log('The file is intact and has not been tampered with.');    }  })  .catch(error => {    console.error('Error:', error.message);  });
```

* * *

## Using Different Types of Keys

HMAC can work with different types of keys:

```javascript
const crypto = require('crypto');// Data to authenticateconst data = 'Data to authenticate with HMAC';// Function to create HMAC with different key typesfunction createHmacWithKey(algorithm, data, key, keyType) {  const hmac = crypto.createHmac(algorithm, key);  hmac.update(data);  return {    keyType,    hmac: hmac.digest('hex')  };}console.log(`Data: "${data}"`);console.log('------------------------------------');// 1. String keyconst stringKey = 'my-secret-key';console.log(createHmacWithKey('sha256', data, stringKey, 'String key'));// 2. Buffer keyconst bufferKey = Buffer.from('buffer-secret-key');console.log(createHmacWithKey('sha256', data, bufferKey, 'Buffer key'));// 3. TypedArray keyconst uint8ArrayKey = new Uint8Array([72, 101, 108, 108, 111]); // "Hello" in ASCIIconsole.log(createHmacWithKey('sha256', data, uint8ArrayKey, 'Uint8Array key'));// 4. DataView keyconst arrayBuffer = new ArrayBuffer(5);const dataView = new DataView(arrayBuffer);dataView.setUint8(0, 72);  // HdataView.setUint8(1, 101); // edataView.setUint8(2, 108); // ldataView.setUint8(3, 108); // ldataView.setUint8(4, 111); // oconsole.log(createHmacWithKey('sha256', data, dataView, 'DataView key'));// 5. KeyObject (recommended for sensitive keys)const keyObject = crypto.createSecretKey(Buffer.from('key-object-secret'));console.log(createHmacWithKey('sha256', data, keyObject, 'KeyObject'));
```

* * *

## HMAC for API Authentication

HMAC is commonly used for API authentication, where the server and client share a secret key:

```javascript
const crypto = require('crypto');// Simulated API requestfunction createApiRequest(apiKey, secretKey, method, path, queryParams, body, timestamp) {  // Create the string to sign  const stringToSign = [    method.toUpperCase(),    path,    new URLSearchParams(queryParams).toString(),    typeof body === 'string' ? body : JSON.stringify(body || {}),    timestamp  ].join('\n');    // Create HMAC signature  const hmac = crypto.createHmac('sha256', secretKey);  hmac.update(stringToSign);  const signature = hmac.digest('hex');    // Return the request with authentication headers  return {    url: `https://api.example.com${path}?${new URLSearchParams(queryParams)}`,    method,    headers: {      'Content-Type': 'application/json',      'X-Api-Key': apiKey,      'X-Timestamp': timestamp,      'X-Signature': signature    },    body: body || {},    // For debugging/verification    stringToSign  };}// Simulate API server verificationfunction verifyApiRequest(apiKey, secretKey, method, path, queryParams, body, timestamp, signature) {  // Recreate the string that was signed  const stringToSign = [    method.toUpperCase(),    path,    new URLSearchParams(queryParams).toString(),    typeof body === 'string' ? body : JSON.stringify(body || {}),    timestamp  ].join('\n');    // Verify HMAC signature  const hmac = crypto.createHmac('sha256', secretKey);  hmac.update(stringToSign);  const expectedSignature = hmac.digest('hex');    return {    isValid: crypto.timingSafeEqual(      Buffer.from(signature, 'hex'),      Buffer.from(expectedSignature, 'hex')    ),    expectedSignature  };}// API credentialsconst apiKey = 'user123';const secretKey = 'very-secret-api-key';// Create a requestconst timestamp = new Date().toISOString();const request = createApiRequest(  apiKey,  secretKey,  'POST',  '/api/v1/users',  { filter: 'active' },  { name: 'John Doe', email: 'john@example.com' },  timestamp);console.log('API Request:');console.log(`URL: ${request.url}`);console.log(`Method: ${request.method}`);console.log('Headers:', request.headers);console.log('Body:', request.body);console.log('\nString that was signed:');console.log(request.stringToSign);// Server verifies the requestconst verification = verifyApiRequest(  apiKey,  secretKey,  'POST',  '/api/v1/users',  { filter: 'active' },  { name: 'John Doe', email: 'john@example.com' },  timestamp,  request.headers['X-Signature']);console.log('\nVerification result:');console.log(`Is signature valid? ${verification.isValid}`);// Try with tampered dataconst tamperedVerification = verifyApiRequest(  apiKey,  secretKey,  'POST',  '/api/v1/users',  { filter: 'active' },  { name: 'Jane Doe', email: 'jane@example.com' }, // Changed body  timestamp,  request.headers['X-Signature']);console.log('\nTampered verification result:');console.log(`Is signature valid? ${tamperedVerification.isValid}`);
```

* * *

## HMAC vs Plain Hash

This example demonstrates the difference between a plain hash and an HMAC:

```javascript
const crypto = require('crypto');// Data and keysconst data = 'Message to authenticate';const key1 = 'secret-key-1';const key2 = 'secret-key-2';// Plain SHA-256 hash (no key)function createHash(data) {  const hash = crypto.createHash('sha256');  hash.update(data);  return hash.digest('hex');}// HMAC-SHA-256 (with key)function createHmac(data, key) {  const hmac = crypto.createHmac('sha256', key);  hmac.update(data);  return hmac.digest('hex');}// Compare resultsconsole.log(`Data: "${data}"`);console.log('\nPlain SHA-256 (no key):');console.log(createHash(data));console.log('\nHMAC-SHA-256 with key1:');console.log(createHmac(data, key1));console.log('\nHMAC-SHA-256 with key2:');console.log(createHmac(data, key2));// Demonstrate hash extension attack vulnerability// This is a simplified illustration - actual extension attacks are more complexconsole.log('\nHash Extension Attack Vulnerability:');const originalData = 'original-message';const originalHash = createHash(originalData);console.log(`Original data: "${originalData}"`);console.log(`Original SHA-256: ${originalHash}`);// Attacker doesn't know the original data, but knows its hash// and wants to append malicious dataconst appendedData = 'malicious-appendage';const combinedData = `${originalData}${appendedData}`;const combinedHash = createHash(combinedData);console.log(`Appended data: "${appendedData}"`);console.log(`Combined data: "${combinedData}"`);console.log(`Combined SHA-256: ${combinedHash}`);console.log('With plain hash, an attacker who knows the hash of original data can compute valid hash for combined data without knowing the original data');// HMAC is not vulnerable to extension attacksconsole.log('\nHMAC Protection:');const originalHmac = createHmac(originalData, key1);const combinedHmac = createHmac(combinedData, key1);console.log(`Original HMAC: ${originalHmac}`);console.log(`Combined HMAC: ${combinedHmac}`);console.log('With HMAC, an attacker cannot compute a valid HMAC for combined data without knowing the secret key');
```

* * *

## Security Best Practices

When using HMAC, consider these security best practices:

1.  **Use strong hash algorithms**: Prefer SHA-256, SHA-384, SHA-512, or SHA-3 over MD5 and SHA-1.
2.  **Use a strong, random key**: The key should be at least as long as the hash output (e.g., 32 bytes for SHA-256).
3.  **Keep the key secret**: The security of HMAC depends on the secrecy of the key.
4.  **Use constant-time comparison**: When verifying HMAC values, use `crypto.timingSafeEqual()` to avoid timing attacks.
5.  **Use modern key management**: Consider using the KeyObject API or a key management service for sensitive keys.
6.  **Consider HMAC's purpose**: HMAC provides data integrity and authentication, not confidentiality. For encryption, combine HMAC with encryption algorithms.

* * *

## Common Use Cases for HMAC

*   **API Authentication**: Signing API requests to verify the sender's identity and data integrity.
*   **Message Authentication**: Ensuring messages haven't been tampered with during transmission.
*   **Cookie/Token Verification**: Creating and verifying signed cookies or tokens in web applications.
*   **File Integrity Verification**: Checking that files haven't been modified or corrupted.
*   **Password Storage**: Though specialized algorithms like bcrypt are preferred, HMAC can be used as part of a password hashing scheme.
*   **Key Derivation**: As a component in key derivation functions like HKDF.

* * *