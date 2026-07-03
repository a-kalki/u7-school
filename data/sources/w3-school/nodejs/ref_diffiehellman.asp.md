# Node.js DiffieHellman Reference

* * *

## DiffieHellman Object

The DiffieHellman class is part of Node.js's `crypto` module. It implements the Diffie-Hellman key exchange protocol, which allows two parties to securely establish a shared secret over an insecure channel.

### Import Crypto Module

```javascript
// Import the crypto moduleconst crypto = require('crypto');// Create a DiffieHellman instanceconst dh = crypto.createDiffieHellman(2048); // 2048-bit prime length
```

* * *

## DiffieHellman Methods

Method

Description

dh.generateKeys(\[encoding\])

Generates private and public Diffie-Hellman key values. If `encoding` is provided, a string is returned; otherwise, a Buffer is returned.

dh.computeSecret(otherPublicKey\[, inputEncoding\]\[, outputEncoding\])

Computes the shared secret using the other party's public key. If `inputEncoding` is provided, `otherPublicKey` is expected to be a string; otherwise, a Buffer, TypedArray, or DataView. If `outputEncoding` is provided, a string is returned; otherwise, a Buffer is returned.

dh.getPrime(\[encoding\])

Returns the Diffie-Hellman prime. If `encoding` is provided, a string is returned; otherwise, a Buffer is returned.

dh.getGenerator(\[encoding\])

Returns the Diffie-Hellman generator. If `encoding` is provided, a string is returned; otherwise, a Buffer is returned.

dh.getPublicKey(\[encoding\])

Returns the Diffie-Hellman public key. If `encoding` is provided, a string is returned; otherwise, a Buffer is returned.

dh.getPrivateKey(\[encoding\])

Returns the Diffie-Hellman private key. If `encoding` is provided, a string is returned; otherwise, a Buffer is returned.

dh.setPublicKey(publicKey\[, encoding\])

Sets the Diffie-Hellman public key. If `encoding` is provided, `publicKey` is expected to be a string; otherwise, a Buffer, TypedArray, or DataView.

dh.setPrivateKey(privateKey\[, encoding\])

Sets the Diffie-Hellman private key. If `encoding` is provided, `privateKey` is expected to be a string; otherwise, a Buffer, TypedArray, or DataView.

dh.verifyError

A bit field of flags indicating any errors that occurred during initialization or validation checks.

* * *

* * *

## Creating DiffieHellman Instances

There are multiple ways to create a DiffieHellman instance:

```javascript
const crypto = require('crypto');// Method 1: Generate a new DH group with specified prime lengthconst dh1 = crypto.createDiffieHellman(2048);console.log('Generated prime length:', dh1.getPrime().length * 8, 'bits');// Method 2: Create a DH group using a predefined primeconst prime = Buffer.from('prime-number-in-hex', 'hex');const dh2 = crypto.createDiffieHellman(prime);// Method 3: Create a DH group using a predefined prime and generatorconst generator = Buffer.from('02', 'hex'); // Often 2, 5, or other small valuesconst dh3 = crypto.createDiffieHellman(prime, generator);// Method 4: Using predefined groups with getDiffieHellman()const predefinedGroupName = 'modp14'; // RFC 3526 2048-bit MODP Groupconst dh4 = crypto.getDiffieHellman(predefinedGroupName);
```

The `getDiffieHellman()` method supports the following predefined groups:

Group Name

Description

Size

modp1

RFC 2409 768-bit MODP Group

768 bits

modp2

RFC 2409 1024-bit MODP Group

1024 bits

modp5

RFC 3526 1536-bit MODP Group

1536 bits

modp14

RFC 3526 2048-bit MODP Group

2048 bits

modp15

RFC 3526 3072-bit MODP Group

3072 bits

modp16

RFC 3526 4096-bit MODP Group

4096 bits

modp17

RFC 3526 6144-bit MODP Group

6144 bits

modp18

RFC 3526 8192-bit MODP Group

8192 bits

* * *

## Basic Key Exchange Example

The following example demonstrates the basic Diffie-Hellman key exchange between two parties (Alice and Bob):

```javascript
const crypto = require('crypto');// Alice generates parameters and keysconsole.log('Alice: Creating DiffieHellman instance...');const alice = crypto.createDiffieHellman(2048);const aliceKeys = alice.generateKeys();// Bob also needs parameters from Aliceconsole.log('Alice: Sending parameters to Bob...');const p = alice.getPrime();const g = alice.getGenerator();// Bob creates a DiffieHellman instance with the same parametersconsole.log('Bob: Creating DiffieHellman instance with Alice\'s parameters...');const bob = crypto.createDiffieHellman(p, g);const bobKeys = bob.generateKeys();// Exchange public keys (over an insecure channel)console.log('Exchanging public keys...');const alicePublicKey = alice.getPublicKey();const bobPublicKey = bob.getPublicKey();// Alice computes the shared secret using Bob's public keyconsole.log('Alice: Computing shared secret...');const aliceSecret = alice.computeSecret(bobPublicKey);// Bob computes the shared secret using Alice's public keyconsole.log('Bob: Computing shared secret...');const bobSecret = bob.computeSecret(alicePublicKey);// Both secrets should be the sameconsole.log('Alice\'s secret:', aliceSecret.toString('hex'));console.log('Bob\'s secret:', bobSecret.toString('hex'));console.log('Do they match?', aliceSecret.equals(bobSecret));// This shared secret can now be used as a key for symmetric encryption
```

* * *

## Using Predefined Groups

For standardized applications, using predefined groups can ensure compatibility:

```javascript
const crypto = require('crypto');// Using the RFC 3526 MODP Group 14 (2048 bits)console.log('Alice: Creating DiffieHellman using predefined group...');const alice = crypto.getDiffieHellman('modp14');alice.generateKeys();// Bob also uses the same predefined groupconsole.log('Bob: Creating DiffieHellman using predefined group...');const bob = crypto.getDiffieHellman('modp14');bob.generateKeys();// Exchange public keys (over an insecure channel)console.log('Exchanging public keys...');const alicePublicKey = alice.getPublicKey();const bobPublicKey = bob.getPublicKey();// Compute shared secretsconst aliceSecret = alice.computeSecret(bobPublicKey);const bobSecret = bob.computeSecret(alicePublicKey);// Verify that the shared secrets matchconsole.log('Do the shared secrets match?', aliceSecret.equals(bobSecret));// Output information about the groupconsole.log('Group prime size:', alice.getPrime().length * 8, 'bits');console.log('Generator value:', alice.getGenerator().toString('hex'));
```

* * *

## Diffie-Hellman with Encryption

This example shows a complete scenario of using Diffie-Hellman to establish a shared key for AES encryption:

```javascript
const crypto = require('crypto');// Create DiffieHellman instances for Alice and Bobconst alice = crypto.createDiffieHellman(2048);alice.generateKeys();// Bob uses Alice's parametersconst bob = crypto.createDiffieHellman(alice.getPrime(), alice.getGenerator());bob.generateKeys();// Exchange public keysconst alicePublicKey = alice.getPublicKey();const bobPublicKey = bob.getPublicKey();// Compute shared secretsconst aliceSecret = alice.computeSecret(bobPublicKey);const bobSecret = bob.computeSecret(alicePublicKey);// Use the shared secret as a key for encryption// First, derive a suitable key using a hash functionfunction deriveKey(secret, salt, keyLength) {  return crypto.pbkdf2Sync(secret, salt, 1000, keyLength, 'sha256');}// Alice sends an encrypted message to Bobfunction encrypt(text, secret) {  // Create a salt and derive a key  const salt = crypto.randomBytes(16);  const key = deriveKey(secret, salt, 32); // 32 bytes for AES-256  const iv = crypto.randomBytes(16);    // Encrypt the message  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);  let encrypted = cipher.update(text, 'utf8', 'hex');  encrypted += cipher.final('hex');    // Return everything Bob needs to decrypt  return {    salt: salt.toString('hex'),    iv: iv.toString('hex'),    encrypted  };}// Bob decrypts the message from Alicefunction decrypt(encryptedInfo, secret) {  // Parse values  const salt = Buffer.from(encryptedInfo.salt, 'hex');  const iv = Buffer.from(encryptedInfo.iv, 'hex');  const encrypted = encryptedInfo.encrypted;    // Derive the same key  const key = deriveKey(secret, salt, 32);    // Decrypt the message  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);  let decrypted = decipher.update(encrypted, 'hex', 'utf8');  decrypted += decipher.final('utf8');    return decrypted;}// Alice encrypts a message using the shared secretconst message = 'Hello Bob, this is a secret message from Alice!';console.log('Original message:', message);const encryptedMessage = encrypt(message, aliceSecret);console.log('Encrypted message:', encryptedMessage);// Bob decrypts the message using his shared secretconst decryptedMessage = decrypt(encryptedMessage, bobSecret);console.log('Decrypted message:', decryptedMessage);
```

* * *

## Working with Custom Parameters

When you need specific parameters for Diffie-Hellman:

```javascript
const crypto = require('crypto');// Custom prime and generator values// These would normally be carefully chosen for securityconst primeHex = `  ffffffffffffffffc90fdaa22168c234c4c6628b80dc1cd129024e088a67cc74  020bbea63b139b22514a08798e3404ddef9519b3cd3a431b302b0a6df25f1437  4fe1356d6d51c245e485b576625e7ec6f44c42e9a637ed6b0bff5cb6f406b7ed  ee386bfb5a899fa5ae9f24117c4b1fe649286651ece45b3dc2007cb8a163bf05  98da48361c55d39a69163fa8fd24cf5f83655d23dca3ad961c62f356208552bb  9ed529077096966d670c354e4abc9804f1746c08ca18217c32905e462e36ce3b  e39e772c180e86039b2783a2ec07a28fb5c55df06f4c52c9de2bcbf695581718  3995497cea956ae515d2261898fa051015728e5a8aacaa68ffffffffffffffff`.replace(/\s+/g, '');const prime = Buffer.from(primeHex, 'hex');const generator = Buffer.from('02', 'hex');// Create DiffieHellman with custom parametersconst dh = crypto.createDiffieHellman(prime, generator);// Generate keysdh.generateKeys();// Verify the parametersconsole.log('Using custom prime of length:', prime.length * 8, 'bits');console.log('Generator:', generator.toString('hex'));// Validationconsole.log('Verify error code:', dh.verifyError);if (dh.verifyError) {  console.error('The parameters did not pass validation!');} else {  console.log('The parameters passed validation.');}// Output public and private keysconsole.log('Public key length:', dh.getPublicKey().length * 8, 'bits');console.log('Private key length:', dh.getPrivateKey().length * 8, 'bits');
```

* * *

## Key Generation with Specific Encoding

You can specify encodings when working with DiffieHellman keys:

```javascript
const crypto = require('crypto');// Create DiffieHellman instanceconst dh = crypto.createDiffieHellman(1024);// Generate keysdh.generateKeys();// Get keys and parameters with different encodingsconsole.log('With Buffer (default):');console.log('  - Prime:', dh.getPrime());console.log('  - Generator:', dh.getGenerator());console.log('  - Public Key:', dh.getPublicKey());console.log('  - Private Key:', dh.getPrivateKey());console.log('\nWith hex encoding:');console.log('  - Prime:', dh.getPrime('hex'));console.log('  - Generator:', dh.getGenerator('hex'));console.log('  - Public Key:', dh.getPublicKey('hex'));console.log('  - Private Key:', dh.getPrivateKey('hex'));console.log('\nWith base64 encoding:');console.log('  - Prime:', dh.getPrime('base64'));console.log('  - Generator:', dh.getGenerator('base64'));console.log('  - Public Key:', dh.getPublicKey('base64'));console.log('  - Private Key:', dh.getPrivateKey('base64'));// Set keys using specific encodingconst newPublicKey = crypto.randomBytes(dh.getPrime().length - 10);dh.setPublicKey(newPublicKey);console.log('\nAfter setting new public key:');console.log('  - Public Key (hex):', dh.getPublicKey('hex'));
```

* * *

## Error Handling

Error handling is important when working with cryptographic operations:

```javascript
const crypto = require('crypto');// Function to safely create DiffieHellmanfunction createDHSafely(options) {  try {    let dh;        if (typeof options === 'number') {      // Create with prime length      dh = crypto.createDiffieHellman(options);    } else if (options.group) {      // Create with predefined group      dh = crypto.getDiffieHellman(options.group);    } else if (options.prime) {      // Create with custom prime and optional generator      const prime = Buffer.from(options.prime, options.encoding || 'hex');      const generator = options.generator ?        Buffer.from(options.generator, options.encoding || 'hex') :        undefined;            dh = generator ?        crypto.createDiffieHellman(prime, generator) :        crypto.createDiffieHellman(prime);    } else {      throw new Error('Invalid options for DiffieHellman creation');    }        // Check for errors    if (dh.verifyError) {      const errors = [];      // Check specific error flags      if (dh.verifyError & crypto.constants.DH_CHECK_P_NOT_SAFE_PRIME)        errors.push('DH_CHECK_P_NOT_SAFE_PRIME');      if (dh.verifyError & crypto.constants.DH_CHECK_P_NOT_PRIME)        errors.push('DH_CHECK_P_NOT_PRIME');      if (dh.verifyError & crypto.constants.DH_UNABLE_TO_CHECK_GENERATOR)        errors.push('DH_UNABLE_TO_CHECK_GENERATOR');      if (dh.verifyError & crypto.constants.DH_NOT_SUITABLE_GENERATOR)        errors.push('DH_NOT_SUITABLE_GENERATOR');            throw new Error(`DiffieHellman parameter validation failed: ${errors.join(', ')}`);    }        return dh;  } catch (error) {    console.error('Error creating DiffieHellman instance:', error.message);    throw error;  }}// Test with valid optionstry {  const dh1 = createDHSafely(2048);  console.log('Successfully created DH with 2048-bit prime');    const dh2 = createDHSafely({ group: 'modp14' });  console.log('Successfully created DH with predefined group modp14');} catch (error) {  console.error('Error in valid tests:', error.message);}// Test with invalid optionstry {  // Invalid prime value  const invalidPrime = '12345'; // Too short, not a prime  const dh3 = createDHSafely({    prime: invalidPrime,    encoding: 'hex'  });} catch (error) {  console.error('Expected error with invalid prime:', error.message);}try {  // Invalid group name  const dh4 = createDHSafely({ group: 'nonexistent-group' });} catch (error) {  console.error('Expected error with invalid group:', error.message);}
```

* * *

## Security Considerations

When using Diffie-Hellman key exchange, consider these security best practices:

1.  **Use appropriate key sizes**: For modern applications, use at least 2048-bit primes.
2.  **Use validated groups**: Whenever possible, use standardized groups like those defined in RFCs.
3.  **Protect private keys**: Never expose private keys in logs, debugging output, or client-side code.
4.  **Add authentication**: Pure Diffie-Hellman is vulnerable to man-in-the-middle attacks. Consider using authenticated key exchange protocols like ECDHE with digital signatures.
5.  **Check parameter validation**: Always check `dh.verifyError` to ensure the parameters are valid.
6.  **Use ephemeral keys**: Generate new keys for each session to provide forward secrecy.
7.  **Derive encryption keys properly**: Don't use the shared secret directly as an encryption key. Use a key derivation function (KDF) like HKDF or PBKDF2.

* * *

## Comparing with ECDH

Diffie-Hellman (DH) and Elliptic Curve Diffie-Hellman (ECDH) are both key exchange protocols, but ECDH offers advantages:

Feature

DiffieHellman

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

More common in new protocols

For most modern applications, ECDH is preferred due to its better performance and smaller key sizes.

* * *