# Node.js Cipher Reference

* * *

## Cipher Object

The Cipher class is part of Node.js's `crypto` module. It provides a way to encrypt data using various algorithms. Cipher instances are created using the `crypto.createCipheriv()` method.

**Note:** The `crypto.createCipher()` method is deprecated since Node.js v10.0.0 due to security concerns. Always use `crypto.createCipheriv()` instead, which requires an explicit initialization vector (IV).

### Import Crypto Module

```javascript
// Import the crypto moduleconst crypto = require('crypto');// Create a cipher with createCipherivconst algorithm = 'aes-256-cbc';const key = crypto.randomBytes(32); // 32 bytes for AES-256const iv = crypto.randomBytes(16); // 16 bytes for AESconst cipher = crypto.createCipheriv(algorithm, key, iv);
```

* * *

## Cipher Methods

Method

Description

cipher.update(data\[, inputEncoding\]\[, outputEncoding\])

Updates the cipher with `data`. If `inputEncoding` is provided, `data` is a string using the specified encoding. If `outputEncoding` is specified, the returned value will be a string using the specified encoding. If not, a Buffer is returned.

cipher.final(\[outputEncoding\])

Returns any remaining enciphered contents. If `outputEncoding` is specified, a string is returned; otherwise, a Buffer is returned.

cipher.setAAD(buffer\[, options\])

When using an AEAD algorithm (like GCM or CCM), sets the Additional Authenticated Data (AAD).

cipher.getAuthTag()

When using an AEAD algorithm, this method returns a Buffer containing the authentication tag.

cipher.setAutoPadding(\[autoPadding\])

When `autoPadding` is true (default), padding is applied. Disable when the data has been padded manually.

* * *

* * *

## Basic Encryption Example

The following example demonstrates how to encrypt data using the AES-256-CBC algorithm:

```javascript
const crypto = require('crypto');// Generate encryption key and initialization vector// In a real application, you would securely store and retrieve these valuesconst key = crypto.randomBytes(32); // Key for AES-256 (32 bytes)const iv = crypto.randomBytes(16); // IV for AES (16 bytes)// Create a cipherconst algorithm = 'aes-256-cbc';const cipher = crypto.createCipheriv(algorithm, key, iv);// Data to encryptconst plainText = 'This is a secret message';// Encrypt the datalet encrypted = cipher.update(plainText, 'utf8', 'hex');encrypted += cipher.final('hex');console.log('Original Text:', plainText);console.log('Encrypted Text:', encrypted);console.log('Key (hex):', key.toString('hex'));console.log('IV (hex):', iv.toString('hex'));// The encrypted message, key, and IV would be needed for decryption
```

* * *

## Encrypting with Different Algorithms

Node.js supports numerous encryption algorithms. Here's how to use different ones:

```javascript
const crypto = require('crypto');// The data to encryptconst plainText = 'Hello, this is a test message';// Function to encrypt data with different algorithmsfunction encryptWithAlgorithm(algorithm, keySize, ivSize, plainText) {  // Generate key and IV  const key = crypto.randomBytes(keySize);  const iv = crypto.randomBytes(ivSize);    // Create cipher  const cipher = crypto.createCipheriv(algorithm, key, iv);    // Encrypt data  let encrypted = cipher.update(plainText, 'utf8', 'hex');  encrypted += cipher.final('hex');    return {    algorithm,    encrypted,    key: key.toString('hex'),    iv: iv.toString('hex')  };}// Test different algorithmsconst algorithms = [  { name: 'aes-128-cbc', keySize: 16, ivSize: 16 },  { name: 'aes-192-cbc', keySize: 24, ivSize: 16 },  { name: 'aes-256-cbc', keySize: 32, ivSize: 16 },  { name: 'aes-256-gcm', keySize: 32, ivSize: 16 }];algorithms.forEach(algo => {  try {    const result = encryptWithAlgorithm(algo.name, algo.keySize, algo.ivSize, plainText);    console.log(`Encrypted with ${result.algorithm}: ${result.encrypted}`);  } catch (error) {    console.error(`Error with ${algo.name}: ${error.message}`);  }});
```

* * *

## Encrypting Binary Data

You can encrypt binary data as well as text:

```javascript
const crypto = require('crypto');const fs = require('fs');// Generate key and IVconst key = crypto.randomBytes(32);const iv = crypto.randomBytes(16);// Create read and write streamsconst readStream = fs.createReadStream('input.jpg');const writeStream = fs.createWriteStream('encrypted.jpg.enc');// Create cipher streamconst cipher = crypto.createCipheriv('aes-256-cbc', key, iv);// Encrypt the filereadStream  .pipe(cipher)  .pipe(writeStream);// Save the key and IV for decryptionfs.writeFileSync('encryption_key.txt', key.toString('hex'));fs.writeFileSync('encryption_iv.txt', iv.toString('hex'));writeStream.on('finish', () => {  console.log('File encryption completed');});
```

* * *

## Using AEAD Encryption

Authenticated Encryption with Associated Data (AEAD) provides both confidentiality and data integrity:

```javascript
const crypto = require('crypto');// Data to encryptconst plainText = 'Secret message';const associatedData = 'Additional data to authenticate';// Generate key and IV (nonce)const key = crypto.randomBytes(32);const iv = crypto.randomBytes(12); // 12 bytes (96 bits) is recommended for GCM// Create cipher using AES-GCM (an AEAD algorithm)const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);// Set the Additional Authenticated Data (AAD)cipher.setAAD(Buffer.from(associatedData));// Encrypt the datalet encrypted = cipher.update(plainText, 'utf8', 'hex');encrypted += cipher.final('hex');// Get the authentication tagconst authTag = cipher.getAuthTag();console.log('Encrypted Text:', encrypted);console.log('Auth Tag (hex):', authTag.toString('hex'));console.log('Key (hex):', key.toString('hex'));console.log('IV (hex):', iv.toString('hex'));console.log('Associated Data:', associatedData);// All this information is needed for decryption and verification
```

* * *

## Manual Padding Control

You can control the padding behavior manually:

```javascript
const crypto = require('crypto');// Generate key and IVconst key = crypto.randomBytes(32);const iv = crypto.randomBytes(16);// Data to encryptconst plainText = 'This is a test message';// Function to encrypt with different padding optionsfunction encryptWithPadding(usePadding) {  // Create cipher  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);    // Set padding option  cipher.setAutoPadding(usePadding);    try {    // Encrypt data    let encrypted = cipher.update(plainText, 'utf8', 'hex');    encrypted += cipher.final('hex');    return encrypted;  } catch (error) {    return `Error: ${error.message}`;  }}// With default padding (true)console.log('With padding:', encryptWithPadding(true));// Without padding// This will likely fail unless data length is a multiple of the block sizeconsole.log('Without padding:', encryptWithPadding(false));// Example with manual padding to block size (16 bytes for AES)function manualPadding(text) {  const blockSize = 16;  const padLength = blockSize - (text.length % blockSize);  return text + '\0'.repeat(padLength);}// Create cipher without auto paddingconst cipher = crypto.createCipheriv('aes-256-cbc', key, iv);cipher.setAutoPadding(false);// Manually pad the dataconst paddedText = manualPadding(plainText);console.log('Original length:', plainText.length);console.log('Padded length:', paddedText.length);// Encrypt manually padded datalet encrypted = cipher.update(paddedText, 'utf8', 'hex');encrypted += cipher.final('hex');console.log('With manual padding:', encrypted);
```

* * *

## Complete Encryption/Decryption Example

Here's a complete example showing both encryption and decryption:

```javascript
const crypto = require('crypto');// The message to encryptconst message = 'This is a secret message that needs to be encrypted';// Generate encryption key and IVconst key = crypto.randomBytes(32);const iv = crypto.randomBytes(16);// Encryption functionfunction encrypt(text) {  // Create cipher  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);    // Encrypt data  let encrypted = cipher.update(text, 'utf8', 'hex');  encrypted += cipher.final('hex');    return encrypted;}// Decryption function (using the Decipher class)function decrypt(encryptedText) {  // Create decipher with the same key and IV  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);    // Decrypt data  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');  decrypted += decipher.final('utf8');    return decrypted;}// Encrypt the messageconst encryptedMessage = encrypt(message);console.log('Original Message:', message);console.log('Encrypted Message:', encryptedMessage);// Decrypt the messageconst decryptedMessage = decrypt(encryptedMessage);console.log('Decrypted Message:', decryptedMessage);// Verify the resultconsole.log('Decryption successful:', message === decryptedMessage);
```

* * *

## Encryption with a Password

For many applications, you might want to derive an encryption key from a password:

```javascript
const crypto = require('crypto');// Password and saltconst password = 'mysecretpassword';const salt = crypto.randomBytes(16);// Generate a key from the passwordfunction getKeyFromPassword(password, salt) {  // Use PBKDF2 to derive a key from the password  return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');}// Password-based encryptionfunction encryptWithPassword(text, password) {  // Generate key from password  const key = getKeyFromPassword(password, salt);    // Generate IV  const iv = crypto.randomBytes(16);    // Create cipher  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);    // Encrypt data  let encrypted = cipher.update(text, 'utf8', 'hex');  encrypted += cipher.final('hex');    // Return encrypted data and IV (we'll need both for decryption)  return {    iv: iv.toString('hex'),    salt: salt.toString('hex'),    encryptedData: encrypted  };}// Password-based decryptionfunction decryptWithPassword(encryptedInfo, password) {  // Get the key from the password  const key = getKeyFromPassword(    password,    Buffer.from(encryptedInfo.salt, 'hex')  );    // Get the IV from encryptedInfo  const iv = Buffer.from(encryptedInfo.iv, 'hex');    // Create decipher  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);    // Decrypt data  let decrypted = decipher.update(encryptedInfo.encryptedData, 'hex', 'utf8');  decrypted += decipher.final('utf8');    return decrypted;}// Test encryption with passwordconst message = 'Secret message protected by a password';const encryptedInfo = encryptWithPassword(message, password);console.log('Encrypted:', encryptedInfo);// Test decryption with passwordconst decryptedMessage = decryptWithPassword(encryptedInfo, password);console.log('Decrypted:', decryptedMessage);// Try with wrong passwordtry {  const wrongPassword = 'wrongpassword';  const failedDecryption = decryptWithPassword(encryptedInfo, wrongPassword);  console.log('Decrypted with wrong password:', failedDecryption);} catch (error) {  console.log('Decryption failed with wrong password:', error.message);}
```

* * *

## Supported Encryption Algorithms

Node.js supports many encryption algorithms. You can get a list of all supported algorithms with:

```javascript
const crypto = require('crypto');// Get all supported cipher algorithmsconsole.log(crypto.getCiphers());
```

Common algorithms include:

Algorithm

Key Size (bytes)

IV Size (bytes)

Description

aes-128-cbc

16

16

AES with 128-bit key in CBC mode

aes-192-cbc

24

16

AES with 192-bit key in CBC mode

aes-256-cbc

32

16

AES with 256-bit key in CBC mode

aes-128-gcm

16

12

AES with 128-bit key in GCM mode (AEAD)

aes-256-gcm

32

12

AES with 256-bit key in GCM mode (AEAD)

chacha20-poly1305

32

12

ChaCha20-Poly1305 (AEAD)

* * *

## Security Best Practices

*   **Use `createCipheriv()` instead of the deprecated `createCipher()`**: This ensures you're explicitly providing the IV.
*   **Generate secure random keys and IVs**: Always use `crypto.randomBytes()` to generate these values.
*   **Never reuse IVs with the same key**: This can severely weaken the encryption.
*   **Prefer authenticated encryption (AEAD)**: Algorithms like AES-GCM or ChaCha20-Poly1305 provide both confidentiality and integrity.
*   **Securely store keys**: Never hardcode keys in your application code.
*   **Use key derivation functions**: When deriving keys from passwords, use PBKDF2, Scrypt, or Argon2 with appropriate parameters.
*   **Keep your Node.js version updated**: Cryptographic vulnerabilities are fixed in security updates.

* * *