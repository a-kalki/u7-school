# Node.js Decipher Reference

* * *

## Decipher Object

The Decipher class is part of Node.js's `crypto` module. It provides a way to decrypt data that was encrypted using the Cipher class. Decipher instances are created using the `crypto.createDecipheriv()` method.

**Note:** The `crypto.createDecipher()` method is deprecated since Node.js v10.0.0 due to security concerns. Always use `crypto.createDecipheriv()` instead, which requires an explicit initialization vector (IV).

### Import Crypto Module

```javascript
// Import the crypto moduleconst crypto = require('crypto');// Create a decipher with createDecipherivconst algorithm = 'aes-256-cbc';const key = Buffer.from('your-encryption-key-in-hex', 'hex'); // 32 bytes for AES-256const iv = Buffer.from('your-iv-in-hex', 'hex'); // 16 bytes for AESconst decipher = crypto.createDecipheriv(algorithm, key, iv);
```

* * *

## Decipher Methods

Method

Description

decipher.update(data\[, inputEncoding\]\[, outputEncoding\])

Updates the decipher with `data`. If `inputEncoding` is provided, `data` is a string using the specified encoding. If `outputEncoding` is specified, the returned value will be a string using the specified encoding. If not, a Buffer is returned.

decipher.final(\[outputEncoding\])

Returns any remaining deciphered contents. If `outputEncoding` is specified, a string is returned; otherwise, a Buffer is returned.

decipher.setAAD(buffer\[, options\])

When using an AEAD algorithm (like GCM or CCM), sets the Additional Authenticated Data (AAD).

decipher.setAuthTag(buffer)

When using an AEAD algorithm, sets the authentication tag that will be used to verify the data's integrity.

decipher.setAutoPadding(\[autoPadding\])

When `autoPadding` is true (default), padding is automatically removed from the result. Disable when the data was not padded or was manually unpadded.

* * *

* * *

## Basic Decryption Example

The following example demonstrates how to decrypt data that was encrypted with AES-256-CBC:

```javascript
const crypto = require('crypto');// Encryption key and initialization vector// In a real application, these would be securely stored and retrievedconst key = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex');const iv = Buffer.from('1234567890abcdef1234567890abcdef', 'hex');// Encrypted text (from a previous encryption)const encryptedText = '7a9c2c7157819144ede3cb9532263cb97c94a7b45d95163bb79aa1af55d4101d';// Create a decipherconst algorithm = 'aes-256-cbc';const decipher = crypto.createDecipheriv(algorithm, key, iv);// Decrypt the datalet decrypted = decipher.update(encryptedText, 'hex', 'utf8');decrypted += decipher.final('utf8');console.log('Encrypted Text:', encryptedText);console.log('Decrypted Text:', decrypted);
```

* * *

## Complete Encryption/Decryption Example

Here's a complete example showing both encryption and decryption:

```javascript
const crypto = require('crypto');// The message to encryptconst message = 'This is a secret message that needs to be encrypted';// Generate encryption key and IVconst key = crypto.randomBytes(32);const iv = crypto.randomBytes(16);// Encryption function using Cipherfunction encrypt(text) {  // Create cipher  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);    // Encrypt data  let encrypted = cipher.update(text, 'utf8', 'hex');  encrypted += cipher.final('hex');    return encrypted;}// Decryption function using Decipherfunction decrypt(encryptedText) {  // Create decipher with the same key and IV  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);    // Decrypt data  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');  decrypted += decipher.final('utf8');    return decrypted;}// Encrypt the messageconst encryptedMessage = encrypt(message);console.log('Original Message:', message);console.log('Encrypted Message:', encryptedMessage);// Decrypt the messageconst decryptedMessage = decrypt(encryptedMessage);console.log('Decrypted Message:', decryptedMessage);// Verify the resultconsole.log('Decryption successful:', message === decryptedMessage);
```

* * *

## Decrypting Binary Data

You can decrypt binary data such as encrypted files:

```javascript
const crypto = require('crypto');const fs = require('fs');// Read the encryption key and IV (saved during encryption)const key = Buffer.from(fs.readFileSync('encryption_key.txt', 'utf8'), 'hex');const iv = Buffer.from(fs.readFileSync('encryption_iv.txt', 'utf8'), 'hex');// Create read and write streamsconst readStream = fs.createReadStream('encrypted.jpg.enc');const writeStream = fs.createWriteStream('decrypted.jpg');// Create decipher streamconst decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);// Decrypt the filereadStream  .pipe(decipher)  .pipe(writeStream);writeStream.on('finish', () => {  console.log('File decryption completed');});
```

* * *

## Using AEAD Decryption

Authenticated Encryption with Associated Data (AEAD) provides both confidentiality and data integrity. Here's how to decrypt data that was encrypted with an AEAD algorithm:

```javascript
const crypto = require('crypto');// Encryption values (would be stored and retrieved securely in a real application)const key = Buffer.from('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex');const iv = Buffer.from('123456789012123456789012', 'hex'); // 12 bytes for GCMconst encryptedData = 'af56c283ae95963c1e1877adb558d860';const authTag = Buffer.from('1234567890abcdef1234567890abcdef', 'hex');const associatedData = 'Additional data that was authenticated';// Create decipher using AES-GCMconst decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);// Set the Additional Authenticated Data (AAD)decipher.setAAD(Buffer.from(associatedData));// Set the authentication tagdecipher.setAuthTag(authTag);try {  // Decrypt the data  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');  decrypted += decipher.final('utf8');    console.log('Decrypted Text:', decrypted);  console.log('Authentication verified successfully');} catch (error) {  console.error('Authentication failed:', error.message);  // If authentication fails, the decryption will throw an error}
```

* * *

## AEAD Complete Example

Here's a complete example of AEAD encryption and decryption:

```javascript
const crypto = require('crypto');// Data to encryptconst plainText = 'Secret message';const associatedData = 'Additional data to authenticate';// Generate key and IV (nonce)const key = crypto.randomBytes(32);const iv = crypto.randomBytes(12); // 12 bytes (96 bits) is recommended for GCM// === ENCRYPTION ===// Create cipher using AES-GCMconst cipher = crypto.createCipheriv('aes-256-gcm', key, iv);// Set the Additional Authenticated Data (AAD)cipher.setAAD(Buffer.from(associatedData));// Encrypt the datalet encrypted = cipher.update(plainText, 'utf8', 'hex');encrypted += cipher.final('hex');// Get the authentication tagconst authTag = cipher.getAuthTag();console.log('Encrypted Text:', encrypted);console.log('Auth Tag (hex):', authTag.toString('hex'));console.log('Associated Data:', associatedData);// === DECRYPTION ===// Create decipherconst decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);// Set the same AADdecipher.setAAD(Buffer.from(associatedData));// Set the authentication tagdecipher.setAuthTag(authTag);try {  // Decrypt  let decrypted = decipher.update(encrypted, 'hex', 'utf8');  decrypted += decipher.final('utf8');    console.log('Decrypted Text:', decrypted);  console.log('Decryption successful:', plainText === decrypted);} catch (error) {  console.error('Decryption failed:', error.message);}// === DECRYPTION WITH WRONG AUTH TAG (will fail) ===try {  const wrongDecipher = crypto.createDecipheriv('aes-256-gcm', key, iv);  wrongDecipher.setAAD(Buffer.from(associatedData));    // Set a wrong authentication tag  const wrongAuthTag = crypto.randomBytes(16);  wrongDecipher.setAuthTag(wrongAuthTag);    // Try to decrypt  let wrongDecrypted = wrongDecipher.update(encrypted, 'hex', 'utf8');  wrongDecrypted += wrongDecipher.final('utf8'); // This will throw    console.log('Should not reach here');} catch (error) {  console.error('Decryption with wrong auth tag failed (expected):', error.message);}
```

* * *

## Manual Padding Control

You can control the padding behavior for decryption manually:

```javascript
const crypto = require('crypto');// Generate key and IVconst key = crypto.randomBytes(32);const iv = crypto.randomBytes(16);// Data to encryptconst plainText = 'This is a test message';// First encrypt with disabled auto paddingconst cipher = crypto.createCipheriv('aes-256-cbc', key, iv);cipher.setAutoPadding(false);// Manually pad to block size (16 bytes for AES)function padToBlockSize(text, blockSize = 16) {  const padLength = blockSize - (text.length % blockSize);  return text + '\0'.repeat(padLength);}// Encrypt manually padded dataconst paddedText = padToBlockSize(plainText);let encrypted = cipher.update(paddedText, 'utf8', 'hex');encrypted += cipher.final('hex');// Now decrypt with auto padding disabledfunction decryptWithPadding(encryptedText, usePadding) {  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);  decipher.setAutoPadding(usePadding);    try {    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');    decrypted += decipher.final('utf8');    return decrypted;  } catch (error) {    return `Error: ${error.message}`;  }}// With auto padding (default)console.log('With auto padding:', decryptWithPadding(encrypted, true));// Without auto padding (will include padding bytes)const manualDecrypted = decryptWithPadding(encrypted, false);console.log('Without auto padding:', manualDecrypted);// Manually remove padding (trim null bytes)function removeNullPadding(paddedText) {  return paddedText.replace(/\0+$/, '');}console.log('With manual padding removal:', removeNullPadding(manualDecrypted));
```

* * *

## Password-Based Decryption

Decrypt data that was encrypted using a password-derived key:

```javascript
const crypto = require('crypto');// Password and salt (from the encryption process)const password = 'mysecretpassword';const salt = Buffer.from('0123456789abcdef0123456789abcdef', 'hex');// Encrypted data and IV from the encryption processconst encryptedData = '7a9c2c7157819144ede3cb9532263cb97c94a7b45d95163bb79aa1af55d4101d';const iv = Buffer.from('0123456789abcdef0123456789abcdef', 'hex');// Generate a key from the passwordfunction getKeyFromPassword(password, salt) {  // Use PBKDF2 to derive a key from the password  return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');}// Decrypt datafunction decryptWithPassword(encryptedText, password, salt, iv) {  // Generate key from password  const key = getKeyFromPassword(password, salt);    // Create decipher  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);    // Decrypt data  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');  decrypted += decipher.final('utf8');    return decrypted;}try {  // Decrypt the data  const decryptedText = decryptWithPassword(encryptedData, password, salt, iv);  console.log('Decrypted:', decryptedText);} catch (error) {  console.error('Decryption failed:', error.message);}// Try with wrong passwordtry {  const wrongPassword = 'wrongpassword';  const decryptedWithWrongPass = decryptWithPassword(encryptedData, wrongPassword, salt, iv);  console.log('Decrypted with wrong password:', decryptedWithWrongPass);} catch (error) {  console.log('Decryption with wrong password failed (expected):', error.message);}
```

* * *

## Complete Password-Based Example

Here's a complete example of password-based encryption and decryption:

```javascript
const crypto = require('crypto');// Password and messageconst password = 'mysecretpassword';const message = 'This is a secret message protected by a password';// Password-based encryptionfunction encryptWithPassword(text, password) {  // Generate a random salt  const salt = crypto.randomBytes(16);    // Derive a key from the password  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');    // Generate random IV  const iv = crypto.randomBytes(16);    // Create cipher  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);    // Encrypt data  let encrypted = cipher.update(text, 'utf8', 'hex');  encrypted += cipher.final('hex');    // Return all values needed for decryption  return {    salt: salt.toString('hex'),    iv: iv.toString('hex'),    encrypted: encrypted  };}// Password-based decryptionfunction decryptWithPassword(encryptedInfo, password) {  // Parse the values  const salt = Buffer.from(encryptedInfo.salt, 'hex');  const iv = Buffer.from(encryptedInfo.iv, 'hex');  const encrypted = encryptedInfo.encrypted;    // Derive the same key  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');    // Create decipher  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);    // Decrypt data  let decrypted = decipher.update(encrypted, 'hex', 'utf8');  decrypted += decipher.final('utf8');    return decrypted;}// Encrypt the messageconst encryptedInfo = encryptWithPassword(message, password);console.log('Encrypted information:', encryptedInfo);// Decrypt the messageconst decryptedMessage = decryptWithPassword(encryptedInfo, password);console.log('Decrypted message:', decryptedMessage);console.log('Decryption successful:', message === decryptedMessage);// Try with wrong passwordtry {  const wrongPassword = 'wrongpassword';  const decryptedWithWrong = decryptWithPassword(encryptedInfo, wrongPassword);  console.log('Decrypted with wrong password:', decryptedWithWrong);} catch (error) {  console.log('Decryption with wrong password failed (expected):', error.message);}
```

* * *

## Handling Errors

Decryption can fail for various reasons. It's important to handle these errors properly:

```javascript
const crypto = require('crypto');// Generate key and IVconst key = crypto.randomBytes(32);const iv = crypto.randomBytes(16);// Create sample encrypted dataconst cipher = crypto.createCipheriv('aes-256-cbc', key, iv);const validEncrypted = cipher.update('valid data', 'utf8', 'hex') + cipher.final('hex');// Function to attempt decryption and handle errorsfunction tryDecrypt(encryptedText, decryptKey, decryptIv) {  try {    const decipher = crypto.createDecipheriv('aes-256-cbc', decryptKey, decryptIv);    const decrypted = decipher.update(encryptedText, 'hex', 'utf8') + decipher.final('utf8');    return { success: true, data: decrypted };  } catch (error) {    return { success: false, error: error.message };  }}// Case 1: Correct key and IVconst result1 = tryDecrypt(validEncrypted, key, iv);console.log('Case 1 (correct key and IV):', result1);// Case 2: Wrong keyconst wrongKey = crypto.randomBytes(32);const result2 = tryDecrypt(validEncrypted, wrongKey, iv);console.log('Case 2 (wrong key):', result2);// Case 3: Wrong IVconst wrongIv = crypto.randomBytes(16);const result3 = tryDecrypt(validEncrypted, key, wrongIv);console.log('Case 3 (wrong IV):', result3);// Case 4: Invalid encrypted dataconst result4 = tryDecrypt('invalidhexdata', key, iv);console.log('Case 4 (invalid data):', result4);// Case 5: Corrupted encrypted dataconst corruptedData = validEncrypted.substring(0, validEncrypted.length - 2);const result5 = tryDecrypt(corruptedData, key, iv);console.log('Case 5 (corrupted data):', result5);
```

* * *

## Security Best Practices

*   **Use `createDecipheriv()` instead of the deprecated `createDecipher()`**: This ensures you're explicitly providing the IV.
*   **Secure key and IV storage**: Store encryption keys securely, consider using a key management service.
*   **Verify decryption**: When possible, include a way to verify that decryption was successful (e.g., using authenticated encryption).
*   **Protect against chosen-ciphertext attacks**: Use authenticated encryption (AEAD) to prevent tampering with encrypted data.
*   **Handle errors securely**: Avoid leaking information about the decryption process in error messages.
*   **Use constant-time comparison**: When verifying authentication tags or other sensitive values, use constant-time comparisons to prevent timing attacks.

* * *