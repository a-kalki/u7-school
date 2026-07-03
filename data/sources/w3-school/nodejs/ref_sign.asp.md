# Node.js Sign Reference

* * *

## Sign Object

The Sign class is part of Node.js's `crypto` module. It provides a way to generate cryptographic digital signatures. Sign instances are created using the `crypto.createSign()` method.

Digital signatures allow you to verify the authenticity and integrity of a message, ensuring that it was created by a known sender and was not altered in transit.

### Import Crypto Module

```javascript
// Import the crypto moduleconst crypto = require('crypto');// Create a Sign objectconst sign = crypto.createSign('RSA-SHA256');
```

* * *

## Sign Methods

Method

Description

sign.update(data\[, inputEncoding\])

Updates the Sign content with the given `data`. If `inputEncoding` is provided, `data` is a string using the specified encoding; otherwise, `data` is a Buffer, TypedArray, or DataView. This method can be called multiple times with new data.

sign.sign(privateKey\[, outputEncoding\])

Calculates the signature on all the data passed to the Sign using `sign.update()`. `privateKey` is a string or buffer containing the PEM-encoded private key, or a KeyObject of type 'private'. If `outputEncoding` is provided, a string is returned; otherwise, a Buffer is returned.

* * *

## Basic Sign Example

The following example demonstrates how to create a digital signature of a message:

```javascript
const crypto = require('crypto');const fs = require('fs');// Generate a keypair for this examplefunction generateKeyPair() {  return crypto.generateKeyPairSync('rsa', {    modulusLength: 2048,    publicKeyEncoding: {      type: 'spki',      format: 'pem'    },    privateKeyEncoding: {      type: 'pkcs8',      format: 'pem'    }  });}// For this example, generate keys in memory// In a real application, you would load existing keys from storageconst { privateKey, publicKey } = generateKeyPair();// Message to signconst message = 'This is a message to be signed';// Create a Sign objectconst sign = crypto.createSign('SHA256');// Update with the messagesign.update(message);// Sign the message with the private keyconst signature = sign.sign(privateKey, 'hex');console.log('Message:', message);console.log('Signature:', signature);// We'll save these for the verification examplefs.writeFileSync('message.txt', message);fs.writeFileSync('signature.hex', signature);fs.writeFileSync('public_key.pem', publicKey);
```

* * *

* * *

## Signing with Different Algorithms

The Sign class supports various signature algorithms, depending on the crypto provider:

```javascript
const crypto = require('crypto');// Generate key pairs for different algorithmsfunction generateRSAKeyPair() {  return crypto.generateKeyPairSync('rsa', {    modulusLength: 2048,    publicKeyEncoding: {      type: 'spki',      format: 'pem'    },    privateKeyEncoding: {      type: 'pkcs8',      format: 'pem'    }  });}function generateECKeyPair() {  return crypto.generateKeyPairSync('ec', {    namedCurve: 'prime256v1',    publicKeyEncoding: {      type: 'spki',      format: 'pem'    },    privateKeyEncoding: {      type: 'sec1',      format: 'pem'    }  });}// Generate different key pairsconst rsaKeys = generateRSAKeyPair();const ecKeys = generateECKeyPair();// Message to signconst message = 'Message to sign with different algorithms';// Function to sign with a specific algorithmfunction signWithAlgorithm(algorithm, privateKey, message) {  try {    const sign = crypto.createSign(algorithm);    sign.update(message);    return sign.sign(privateKey, 'hex');  } catch (error) {    return `Error: ${error.message}`;  }}// Test various signature algorithmsconsole.log(`Message: "${message}"`);console.log('-----------------------------------------------');// RSA signatures with different hash algorithmsconsole.log('RSA-SHA256:', signWithAlgorithm('SHA256', rsaKeys.privateKey, message));console.log('RSA-SHA384:', signWithAlgorithm('SHA384', rsaKeys.privateKey, message));console.log('RSA-SHA512:', signWithAlgorithm('SHA512', rsaKeys.privateKey, message));console.log('-----------------------------------------------');// ECDSA signaturesconsole.log('ECDSA-SHA256:', signWithAlgorithm('SHA256', ecKeys.privateKey, message));console.log('ECDSA-SHA384:', signWithAlgorithm('SHA384', ecKeys.privateKey, message));
```

The available signature algorithms depend on your Node.js version and the installed OpenSSL version. Common signature algorithms include:

Algorithm

Description

Key Types

RSA-SHA256

RSA signature with SHA-256 hash

RSA

RSA-SHA384

RSA signature with SHA-384 hash

RSA

RSA-SHA512

RSA signature with SHA-512 hash

RSA

RSA-PSS-SHA256

RSA-PSS signature with SHA-256 hash

RSA

ECDSA-SHA256

ECDSA signature with SHA-256 hash

EC

ECDSA-SHA384

ECDSA signature with SHA-384 hash

EC

Ed25519

EdDSA signature using Curve25519

Ed25519

Ed448

EdDSA signature using Curve448

Ed448

* * *

## Signing with Multiple Updates

You can update a Sign object with multiple pieces of data before calculating the signature:

```javascript
const crypto = require('crypto');// Generate a keypair for this exampleconst { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {  modulusLength: 2048,  publicKeyEncoding: {    type: 'spki',    format: 'pem'  },  privateKeyEncoding: {    type: 'pkcs8',    format: 'pem'  }});// Create a Sign objectconst sign = crypto.createSign('SHA256');// Update with multiple pieces of datasign.update('First part of the message. ');sign.update('Second part of the message. ');sign.update('Third part of the message.');// Create the signatureconst signature = sign.sign(privateKey, 'hex');console.log('Combined message: First part of the message. Second part of the message. Third part of the message.');console.log('Signature:', signature);// You can achieve the same result with a single updateconst singleSign = crypto.createSign('SHA256');singleSign.update('First part of the message. Second part of the message. Third part of the message.');const singleSignature = singleSign.sign(privateKey, 'hex');console.log('Single update signature matches multiple updates?', singleSignature === signature);
```

* * *

## Signing Files

You can create a digital signature for a file's contents:

```javascript
const crypto = require('crypto');const fs = require('fs');// Function to sign a filefunction signFile(filePath, privateKey, algorithm = 'SHA256') {  return new Promise((resolve, reject) => {    // Create Sign object    const sign = crypto.createSign(algorithm);        // Create read stream    const readStream = fs.createReadStream(filePath);        // Handle stream events    readStream.on('data', (data) => {      sign.update(data);    });        readStream.on('end', () => {      // Create signature      const signature = sign.sign(privateKey, 'hex');      resolve(signature);    });        readStream.on('error', (error) => {      reject(error);    });  });}// Generate a keypair for this exampleconst { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {  modulusLength: 2048,  publicKeyEncoding: {    type: 'spki',    format: 'pem'  },  privateKeyEncoding: {    type: 'pkcs8',    format: 'pem'  }});// Save the public key for verificationfs.writeFileSync('public_key_file.pem', publicKey);// Example usage (adjust file path as needed)const filePath = 'example_to_sign.txt';// Create a test file if it doesn't existif (!fs.existsSync(filePath)) {  fs.writeFileSync(filePath, 'This is a test file for digital signature.\n'.repeat(100));  console.log(`Created test file: ${filePath}`);}// Sign the filesignFile(filePath, privateKey)  .then(signature => {    console.log(`File: ${filePath}`);    console.log(`Signature: ${signature}`);        // Save the signature for later verification    fs.writeFileSync(`${filePath}.sig`, signature);    console.log(`Signature saved to: ${filePath}.sig`);  })  .catch(error => {    console.error('Error signing file:', error.message);  });
```

* * *

## Using Different Types of Keys

The Sign class can work with different formats of private keys:

```javascript
const crypto = require('crypto');// Message to signconst message = 'Message to sign with different key formats';// Function to sign with different key formatsfunction signWithKey(privateKey, keyFormat) {  try {    const sign = crypto.createSign('SHA256');    sign.update(message);    return {      format: keyFormat,      signature: sign.sign(privateKey, 'hex')    };  } catch (error) {    return {      format: keyFormat,      error: error.message    };  }}// Generate a new RSA key pairconst { privateKey: pemPrivateKey, publicKey } = crypto.generateKeyPairSync('rsa', {  modulusLength: 2048,  publicKeyEncoding: {    type: 'spki',    format: 'pem'  },  privateKeyEncoding: {    type: 'pkcs8',    format: 'pem'  }});console.log(`Message: "${message}"`);// 1. Sign with PEM-encoded private key (string)console.log('\n1. PEM-encoded private key (string):');console.log(signWithKey(pemPrivateKey, 'PEM string'));// 2. Sign with PEM-encoded private key (buffer)console.log('\n2. PEM-encoded private key (buffer):');console.log(signWithKey(Buffer.from(pemPrivateKey), 'PEM buffer'));// 3. Sign with KeyObjectconsole.log('\n3. KeyObject:');const keyObject = crypto.createPrivateKey(pemPrivateKey);console.log(signWithKey(keyObject, 'KeyObject'));// 4. Sign with PassThrough crypto engine (if available)try {  // Note: This might not be available in all Node.js versions/configurations  console.log('\n4. Private key with engine:');  const engineKey = {    key: pemPrivateKey,    padding: crypto.constants.RSA_PKCS1_PADDING  };  console.log(signWithKey(engineKey, 'Key with options'));} catch (error) {  console.log('\n4. Private key with engine:');  console.log({ format: 'Key with options', error: error.message });}// 5. Sign with JSON Web Key (JWK)// Note: This requires conversion, as Node.js doesn't directly support JWK for signconsole.log('\n5. JWK (requires conversion):');try {  // This is a simplified example - actual JWK handling would be more complex  const pemToJwk = require('pem-jwk').pem2jwk; // You would need to install this package  const jwk = pemToJwk(pemPrivateKey);  console.log({ format: 'JWK', note: 'JWK needs to be converted to PEM or KeyObject first' });} catch (error) {  console.log({ format: 'JWK', note: 'Example requires pem-jwk package' });}
```

* * *

## Complete Sign and Verify Example

This example demonstrates the full process of creating and verifying a digital signature:

```javascript
const crypto = require('crypto');// Generate a keypairconst { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {  modulusLength: 2048,  publicKeyEncoding: {    type: 'spki',    format: 'pem'  },  privateKeyEncoding: {    type: 'pkcs8',    format: 'pem'  }});// Original messageconst message = 'This is the original message to sign and verify';console.log(`Original message: "${message}"`);// Sign the messagefunction signMessage(message, privateKey) {  const sign = crypto.createSign('SHA256');  sign.update(message);  return sign.sign(privateKey, 'hex');}const signature = signMessage(message, privateKey);console.log(`Signature: ${signature}`);// Verify the message (using the Verify class)function verifySignature(message, signature, publicKey) {  const verify = crypto.createVerify('SHA256');  verify.update(message);  return verify.verify(publicKey, signature, 'hex');}// Verify the original messageconst isValidOriginal = verifySignature(message, signature, publicKey);console.log(`Original message verification: ${isValidOriginal}`);// Try to verify a tampered messageconst tamperedMessage = message + ' with some tampering';const isValidTampered = verifySignature(tamperedMessage, signature, publicKey);console.log(`Tampered message verification: ${isValidTampered}`);// Try to use a different public keyconst { publicKey: differentPublicKey } = crypto.generateKeyPairSync('rsa', {  modulusLength: 2048,  publicKeyEncoding: {    type: 'spki',    format: 'pem'  },  privateKeyEncoding: {    type: 'pkcs8',    format: 'pem'  }});const isValidDifferentKey = verifySignature(message, signature, differentPublicKey);console.log(`Verification with different public key: ${isValidDifferentKey}`);
```

* * *

## DSA and ECDSA Signatures

This example demonstrates using DSA and ECDSA for digital signatures:

```javascript
const crypto = require('crypto');// Message to signconst message = 'Message for DSA and ECDSA signatures';// Generate ECDSA key pairfunction generateECKeyPair(curveName = 'prime256v1') {  return crypto.generateKeyPairSync('ec', {    namedCurve: curveName,    publicKeyEncoding: {      type: 'spki',      format: 'pem'    },    privateKeyEncoding: {      type: 'sec1', // or 'pkcs8'      format: 'pem'    }  });}// Function to sign and verify with a specific algorithm and key pairfunction testSignatureAlgorithm(algorithm, keyType, keyPair, message) {  try {    // Sign the message    const sign = crypto.createSign(algorithm);    sign.update(message);    const signature = sign.sign(keyPair.privateKey, 'hex');        // Verify the signature    const verify = crypto.createVerify(algorithm);    verify.update(message);    const isValid = verify.verify(keyPair.publicKey, signature, 'hex');        return {      algorithm: `${keyType}-${algorithm}`,      signatureLength: signature.length / 2, // Convert hex to bytes      isValid    };  } catch (error) {    return {      algorithm: `${keyType}-${algorithm}`,      error: error.message    };  }}// Test ECDSA with different curvesconst curves = ['prime256v1', 'secp384r1', 'secp521r1'];console.log(`Message: "${message}"`);console.log('\nECDSA Signatures:');curves.forEach(curve => {  const ecKeyPair = generateECKeyPair(curve);    // Test with different hash algorithms  const hashAlgos = ['SHA256', 'SHA384', 'SHA512'];    hashAlgos.forEach(hashAlgo => {    const result = testSignatureAlgorithm(hashAlgo, `ECDSA-${curve}`, ecKeyPair, message);    console.log(result);  });});// Test EdDSA if availabletry {  console.log('\nEdDSA Signatures:');    // Ed25519  const ed25519KeyPair = crypto.generateKeyPairSync('ed25519', {    publicKeyEncoding: {      type: 'spki',      format: 'pem'    },    privateKeyEncoding: {      type: 'pkcs8',      format: 'pem'    }  });    // Sign with Ed25519  const sign = crypto.createSign('SHA512'); // Hash algorithm is ignored for Ed25519  sign.update(message);  const signature = sign.sign(ed25519KeyPair.privateKey, 'hex');    // Verify with Ed25519  const verify = crypto.createVerify('SHA512');  verify.update(message);  const isValid = verify.verify(ed25519KeyPair.publicKey, signature, 'hex');    console.log({    algorithm: 'Ed25519',    signatureLength: signature.length / 2,    isValid  });} catch (error) {  console.log({    algorithm: 'Ed25519',    error: error.message  });}
```

* * *

## Signing with OpenSSL Options

Advanced signing with specific OpenSSL options:

```javascript
const crypto = require('crypto');// Generate RSA key pairconst { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {  modulusLength: 2048,  publicKeyEncoding: {    type: 'spki',    format: 'pem'  },  privateKeyEncoding: {    type: 'pkcs8',    format: 'pem'  }});// Message to signconst message = 'Message to sign with different options';// Function to sign with specific optionsfunction signWithOptions(algorithm, message, privateKey, options = {}) {  try {    // Create private key with options    const keyWithOptions = {      key: privateKey,      ...options    };        // Sign the message    const sign = crypto.createSign(algorithm);    sign.update(message);    return sign.sign(keyWithOptions, 'hex');  } catch (error) {    return `Error: ${error.message}`;  }}console.log(`Message: "${message}"`);console.log('\nRSA Signatures with Different Options:');// 1. Standard PKCS#1 v1.5 padding (default)console.log('\n1. Standard PKCS#1 v1.5 padding:');const sig1 = signWithOptions('SHA256', message, privateKey);console.log(sig1);// 2. PSS paddingconsole.log('\n2. PSS padding:');const sig2 = signWithOptions('SHA256', message, privateKey, {  padding: crypto.constants.RSA_PKCS1_PSS_PADDING,  saltLength: 32});console.log(sig2);// 3. Different salt lengths with PSS paddingconsole.log('\n3. PSS padding with different salt lengths:');[20, 32, 48].forEach(saltLength => {  try {    const sigSalt = signWithOptions('SHA256', message, privateKey, {      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,      saltLength    });    console.log(`Salt length ${saltLength}: ${sigSalt.substring(0, 64)}...`);  } catch (error) {    console.log(`Salt length ${saltLength}: Error - ${error.message}`);  }});// 4. Try to use no padding (will likely fail for signatures)console.log('\n4. No padding (expect error):');const sig4 = signWithOptions('SHA256', message, privateKey, {  padding: crypto.constants.RSA_NO_PADDING});console.log(sig4);
```

* * *

## Security Best Practices

When using digital signatures, consider these security best practices:

1.  **Use strong keys**: For RSA, use at least 2048 bits. For ECDSA, use curves like prime256v1 (P-256) or stronger.
2.  **Use modern signature algorithms**: Prefer RSA-PSS over PKCS#1 v1.5, and consider ECDSA or EdDSA for better performance.
3.  **Protect private keys**: Store private keys securely, possibly using a hardware security module (HSM) or key management service.
4.  **Use strong hash algorithms**: Always use SHA-256 or stronger for the underlying hash function.
5.  **Validate data before signing**: Ensure you're signing the intended data to avoid signing malicious content.
6.  **Consider key rotation**: Regularly update your signing keys, especially for long-term applications.
7.  **Use KeyObject**: When possible, use the KeyObject API for better security and to prevent sensitive key material from being directly accessible.

* * *

## Common Use Cases for Digital Signatures

*   **Code Signing**: Signing software packages, executables, or scripts to verify their authenticity and integrity.
*   **Document Signing**: Creating legally binding electronic signatures for PDFs and other documents.
*   **JWT Signing**: Signing JSON Web Tokens (JWTs) for secure authentication and authorization.
*   **API Authentication**: Verifying the identity of API clients and ensuring request integrity.
*   **Certificate Signing**: Creating and validating certificate chains in a PKI system.
*   **Secure Communication**: Authenticating messages in secure communication protocols.

* * *