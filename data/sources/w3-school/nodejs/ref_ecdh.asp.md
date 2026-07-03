# Node.js ECDH Reference

* * *

## ECDH Object

The ECDH (Elliptic Curve Diffie-Hellman) class is part of Node.js's `crypto` module. It implements the Elliptic Curve Diffie-Hellman key exchange protocol, which allows two parties to securely establish a shared secret over an insecure channel using elliptic curve cryptography.

ECDH offers advantages over traditional Diffie-Hellman key exchange, including smaller key sizes, faster computation, and equivalent security strength.

### Import Crypto Module

```javascript
// Import the crypto moduleconst crypto = require('crypto');// Create an ECDH instance with a specific curveconst ecdh = crypto.createECDH('prime256v1'); // Also known as P-256 or secp256r1
```

* * *

## ECDH Methods

Method

Description

ecdh.generateKeys(\[encoding\[, format\]\])

Generates private and public EC Diffie-Hellman key values. If `encoding` is provided, a string is returned; otherwise, a Buffer is returned. The `format` argument specifies point encoding and can be 'compressed', 'uncompressed', or 'hybrid'.

ecdh.computeSecret(otherPublicKey\[, inputEncoding\]\[, outputEncoding\])

Computes the shared secret using the other party's public key. If `inputEncoding` is provided, `otherPublicKey` is expected to be a string; otherwise, a Buffer, TypedArray, or DataView. If `outputEncoding` is provided, a string is returned; otherwise, a Buffer is returned.

ecdh.getPrivateKey(\[encoding\])

Returns the EC Diffie-Hellman private key. If `encoding` is provided, a string is returned; otherwise, a Buffer is returned.

ecdh.getPublicKey(\[encoding\]\[, format\])

Returns the EC Diffie-Hellman public key. If `encoding` is provided, a string is returned; otherwise, a Buffer is returned. The `format` argument specifies point encoding and can be 'compressed', 'uncompressed', or 'hybrid'.

ecdh.setPrivateKey(privateKey\[, encoding\])

Sets the EC Diffie-Hellman private key. If `encoding` is provided, `privateKey` is expected to be a string; otherwise, a Buffer, TypedArray, or DataView.

* * *

* * *

## Supported Curves

Node.js supports various elliptic curves for ECDH. You can get a list of all supported curves with:

```javascript
const crypto = require('crypto');// Get all supported elliptic curvesconsole.log(crypto.getCurves());
```

Common curves for ECDH include:

Curve Name

Alternative Names

Size

Security Level

prime256v1

P-256, secp256r1

256 bits

128 bits

secp384r1

P-384

384 bits

192 bits

secp521r1

P-521

521 bits

256 bits

secp256k1

(Bitcoin curve)

256 bits

128 bits

ed25519

curve25519

255 bits

128 bits

* * *

## Basic Key Exchange Example

The following example demonstrates the basic ECDH key exchange between two parties (Alice and Bob):

```javascript
const crypto = require('crypto');// Alice creates an ECDH instance and generates keysconsole.log('Alice: Creating ECDH instance...');const alice = crypto.createECDH('prime256v1');alice.generateKeys();// Bob creates an ECDH instance and generates keysconsole.log('Bob: Creating ECDH instance...');const bob = crypto.createECDH('prime256v1');bob.generateKeys();// Exchange public keys (over an insecure channel)console.log('Exchanging public keys...');const alicePublicKey = alice.getPublicKey();const bobPublicKey = bob.getPublicKey();// Alice computes the shared secret using Bob's public keyconsole.log('Alice: Computing shared secret...');const aliceSecret = alice.computeSecret(bobPublicKey);// Bob computes the shared secret using Alice's public keyconsole.log('Bob: Computing shared secret...');const bobSecret = bob.computeSecret(alicePublicKey);// Both secrets should be the sameconsole.log('Alice\'s secret:', aliceSecret.toString('hex'));console.log('Bob\'s secret:', bobSecret.toString('hex'));console.log('Do they match?', aliceSecret.equals(bobSecret));// This shared secret can now be used as a key for symmetric encryption
```

* * *

## ECDH with Different Encoding Formats

ECDH supports different public key encoding formats:

```javascript
const crypto = require('crypto');// Create an ECDH instanceconst ecdh = crypto.createECDH('prime256v1');ecdh.generateKeys();// Get public key in different formatsconst uncompressedKey = ecdh.getPublicKey('hex', 'uncompressed');const compressedKey = ecdh.getPublicKey('hex', 'compressed');const hybridKey = ecdh.getPublicKey('hex', 'hybrid');console.log('Uncompressed public key:', uncompressedKey);console.log('Compressed public key:', compressedKey);console.log('Hybrid public key:', hybridKey);// Get key length in each formatconsole.log('\nKey lengths:');console.log('Uncompressed:', Buffer.from(uncompressedKey, 'hex').length, 'bytes');console.log('Compressed:', Buffer.from(compressedKey, 'hex').length, 'bytes');console.log('Hybrid:', Buffer.from(hybridKey, 'hex').length, 'bytes');// Use a public key in different formatsconst otherEcdh = crypto.createECDH('prime256v1');otherEcdh.generateKeys();// Another party can use any format to compute the same secretconst secret1 = otherEcdh.computeSecret(  Buffer.from(uncompressedKey, 'hex'));const secret2 = otherEcdh.computeSecret(  Buffer.from(compressedKey, 'hex'));console.log('\nSame secret computed from different formats?',  secret1.equals(secret2));
```

* * *

## ECDH with Encryption

This example shows a complete scenario of using ECDH to establish a shared key for AES encryption:

```javascript
const crypto = require('crypto');// Create ECDH instances for Alice and Bobconst alice = crypto.createECDH('prime256v1');alice.generateKeys();const bob = crypto.createECDH('prime256v1');bob.generateKeys();// Exchange public keysconst alicePublicKey = alice.getPublicKey();const bobPublicKey = bob.getPublicKey();// Compute shared secretsconst aliceSecret = alice.computeSecret(bobPublicKey);const bobSecret = bob.computeSecret(alicePublicKey);// Use the shared secret as a key for encryption// First, derive a suitable key using a hash functionfunction deriveKey(secret, salt, keyLength) {  return crypto.pbkdf2Sync(secret, salt, 1000, keyLength, 'sha256');}// Alice sends an encrypted message to Bobfunction encrypt(text, secret) {  // Create a salt and derive a key  const salt = crypto.randomBytes(16);  const key = deriveKey(secret, salt, 32); // 32 bytes for AES-256  const iv = crypto.randomBytes(16);    // Encrypt the message  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);  let encrypted = cipher.update(text, 'utf8', 'hex');  encrypted += cipher.final('hex');    // Return everything Bob needs to decrypt  return {    salt: salt.toString('hex'),    iv: iv.toString('hex'),    encrypted  };}// Bob decrypts the message from Alicefunction decrypt(encryptedInfo, secret) {  // Parse values  const salt = Buffer.from(encryptedInfo.salt, 'hex');  const iv = Buffer.from(encryptedInfo.iv, 'hex');  const encrypted = encryptedInfo.encrypted;    // Derive the same key  const key = deriveKey(secret, salt, 32);    // Decrypt the message  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);  let decrypted = decipher.update(encrypted, 'hex', 'utf8');  decrypted += decipher.final('utf8');    return decrypted;}// Alice encrypts a message using the shared secretconst message = 'Hello Bob, this is a secret message from Alice using ECDH!';console.log('Original message:', message);const encryptedMessage = encrypt(message, aliceSecret);console.log('Encrypted message:', encryptedMessage);// Bob decrypts the message using his shared secretconst decryptedMessage = decrypt(encryptedMessage, bobSecret);console.log('Decrypted message:', decryptedMessage);// Verify the resultconsole.log('Decryption successful:', message === decryptedMessage);
```

* * *

## Setting Private Key Manually

You can manually set a private key instead of generating one:

```javascript
const crypto = require('crypto');// Create an ECDH instanceconst ecdh = crypto.createECDH('prime256v1');// Generate a random private key (32 bytes for prime256v1)const privateKey = crypto.randomBytes(32);console.log('Private key (hex):', privateKey.toString('hex'));// Set the private keyecdh.setPrivateKey(privateKey);// Derive the public key from the private keyconst publicKey = ecdh.getPublicKey('hex', 'uncompressed');console.log('Public key (hex):', publicKey);// You can also set the private key from a hex stringconst ecdh2 = crypto.createECDH('prime256v1');ecdh2.setPrivateKey(privateKey.toString('hex'), 'hex');// Check if both instances generate the same public keyconst publicKey2 = ecdh2.getPublicKey('hex', 'uncompressed');console.log('Same public keys:', publicKey === publicKey2);// This is useful for deterministic key generation or when loading keys from storage
```

* * *

## ECDH with Different Curves

This example shows how to use different elliptic curves with ECDH:

```javascript
const crypto = require('crypto');// Function to perform ECDH key exchange with a specific curvefunction testCurve(curveName) {  console.log(`\nTesting curve: ${curveName}`);    try {    // Create ECDH instances    const alice = crypto.createECDH(curveName);    alice.generateKeys();        const bob = crypto.createECDH(curveName);    bob.generateKeys();        // Exchange public keys    const alicePublicKey = alice.getPublicKey();    const bobPublicKey = bob.getPublicKey();        // Compute shared secrets    const aliceSecret = alice.computeSecret(bobPublicKey);    const bobSecret = bob.computeSecret(alicePublicKey);        // Check if secrets match    const match = aliceSecret.equals(bobSecret);        // Output results    console.log(`Public key size: ${alicePublicKey.length} bytes`);    console.log(`Shared secret size: ${aliceSecret.length} bytes`);    console.log(`Secrets match: ${match}`);        return match;  } catch (error) {    console.error(`Error with curve ${curveName}: ${error.message}`);    return false;  }}// Test different curvesconst curves = [  'prime256v1',  // P-256 / secp256r1  'secp384r1',   // P-384  'secp521r1',   // P-521  'secp256k1',   // Bitcoin curve  'curve25519'   // Ed25519 curve (if supported)];curves.forEach(curve => {  testCurve(curve);});// Note: Not all curves may be supported in your Node.js version
```

* * *

## Performance Comparison

This example compares the performance of ECDH with traditional Diffie-Hellman:

```javascript
const crypto = require('crypto');const { performance } = require('perf_hooks');// Function to measure DH key generation timefunction measureDH(bits) {  const startTime = performance.now();    const dh = crypto.createDiffieHellman(bits);  dh.generateKeys();    const endTime = performance.now();  return endTime - startTime;}// Function to measure ECDH key generation timefunction measureECDH(curve) {  const startTime = performance.now();    const ecdh = crypto.createECDH(curve);  ecdh.generateKeys();    const endTime = performance.now();  return endTime - startTime;}// Function to measure secret computation timefunction measureSecretComputation(type, params) {  let alice, bob;    // Create instances and generate keys  if (type === 'DH') {    alice = crypto.createDiffieHellman(params);    alice.generateKeys();        bob = crypto.createDiffieHellman(alice.getPrime(), alice.getGenerator());    bob.generateKeys();  } else {    alice = crypto.createECDH(params);    alice.generateKeys();        bob = crypto.createECDH(params);    bob.generateKeys();  }    // Exchange public keys  const alicePublicKey = alice.getPublicKey();  const bobPublicKey = bob.getPublicKey();    // Measure time for computing secrets  const startTime = performance.now();    alice.computeSecret(bobPublicKey);  bob.computeSecret(alicePublicKey);    const endTime = performance.now();  return endTime - startTime;}// Run performance testsconsole.log('Key Generation Performance:');console.log(`DH (1024 bits): ${measureDH(1024).toFixed(2)} ms`);console.log(`DH (2048 bits): ${measureDH(2048).toFixed(2)} ms`);console.log(`ECDH (P-256): ${measureECDH('prime256v1').toFixed(2)} ms`);console.log(`ECDH (P-384): ${measureECDH('secp384r1').toFixed(2)} ms`);console.log(`ECDH (P-521): ${measureECDH('secp521r1').toFixed(2)} ms`);console.log('\nSecret Computation Performance:');console.log(`DH (1024 bits): ${measureSecretComputation('DH', 1024).toFixed(2)} ms`);console.log(`DH (2048 bits): ${measureSecretComputation('DH', 2048).toFixed(2)} ms`);console.log(`ECDH (P-256): ${measureSecretComputation('ECDH', 'prime256v1').toFixed(2)} ms`);console.log(`ECDH (P-384): ${measureSecretComputation('ECDH', 'secp384r1').toFixed(2)} ms`);console.log(`ECDH (P-521): ${measureSecretComputation('ECDH', 'secp521r1').toFixed(2)} ms`);
```

* * *

## ECDH Key Pair Generation for TLS

This example shows how to generate ECDH key pairs for use with TLS:

```javascript
const crypto = require('crypto');const fs = require('fs');// Function to generate and save ECDH keys for TLSfunction generateEcdhKeysForTLS(curveName, keyFilePrefix) {  // Create ECDH instance  const ecdh = crypto.createECDH(curveName);    // Generate keys  ecdh.generateKeys();    // Get keys in PEM format  const privateKey = ecdh.getPrivateKey('hex');  const publicKey = ecdh.getPublicKey('hex', 'uncompressed');    // Save keys to files  fs.writeFileSync(`${keyFilePrefix}_private.hex`, privateKey);  fs.writeFileSync(`${keyFilePrefix}_public.hex`, publicKey);    console.log(`Generated ECDH key pair using ${curveName}`);  console.log(`Private key saved to ${keyFilePrefix}_private.hex`);  console.log(`Public key saved to ${keyFilePrefix}_public.hex`);    return {    curve: curveName,    privateKey,    publicKey  };}// Generate keys for different curvesgenerateEcdhKeysForTLS('prime256v1', 'ecdh_p256');generateEcdhKeysForTLS('secp384r1', 'ecdh_p384');console.log("\nThese keys can be used for ECDHE (Ephemeral ECDH) in TLS connections.");console.log("In a real application, you would use these with the TLS module or a library like Node.js's tls module.");
```

* * *

## Security Considerations

When using ECDH key exchange, consider these security best practices:

1.  **Choose appropriate curves**: For most applications, P-256 (prime256v1) provides a good balance of security and performance. For higher security requirements, consider P-384 or P-521.
2.  **Avoid weak or deprecated curves**: Some curves are known to have weaknesses. Always use standard curves recommended by security authorities.
3.  **Use ephemeral keys**: Generate new ECDH key pairs for each session to provide forward secrecy.
4.  **Add authentication**: Pure ECDH (like DH) is vulnerable to man-in-the-middle attacks. Consider using authenticated key exchange protocols like ECDHE with digital signatures.
5.  **Protect private keys**: Never expose private keys in logs, debugging output, or client-side code.
6.  **Derive encryption keys properly**: Don't use the shared secret directly as an encryption key. Use a key derivation function (KDF) like HKDF or PBKDF2.
7.  **Validate public keys**: Validate that received public keys are valid points on the elliptic curve to prevent invalid-curve attacks.

* * *

## Comparing DH and ECDH

This table compares traditional Diffie-Hellman with Elliptic Curve Diffie-Hellman:

Feature

Diffie-Hellman

ECDH

Key Size

Typically 2048-4096 bits

Typically 256-384 bits

Performance

Slower, requires more computation

Faster, more efficient

Security Level

2048-bit DH ≈ 112-bit security

256-bit ECDH ≈ 128-bit security

Memory Usage

Higher

Lower

Modern Usage

Less common in new designs

More common in new protocols (TLS 1.3, etc.)

Implementation

Simpler mathematics

More complex elliptic curve operations

For most modern applications, ECDH is preferred due to its better performance and smaller key sizes while providing equivalent or better security.

* * *