# Node.js TLS/SSL Module

* * *

## What is TLS/SSL?

Transport Layer Security (TLS) and its predecessor, Secure Socket Layer (SSL), are protocols that provide secure communication over a computer network. They ensure:

*   **Privacy**: Communications are encrypted to prevent eavesdropping
*   **Data integrity**: Message contents cannot be modified without detection
*   **Authentication**: The identities of the communicating parties can be verified

TLS/SSL is commonly used for securing:

*   Web browsing (HTTPS)
*   Email transmissions (SMTP, IMAP, POP3)
*   Instant messaging
*   Voice over IP (VoIP)
*   API communication

* * *

## Using the TLS Module

To use the TLS module in Node.js, you need to require it:

```javascript
const tls = require('tls');
```

* * *

## TLS Server

Here's how to create a basic TLS server:

```javascript
const tls = require('tls');const fs = require('fs');const path = require('path');// Server options with TLS certificatesconst options = {  key: fs.readFileSync(path.join(__dirname, 'server-key.pem')),  cert: fs.readFileSync(path.join(__dirname, 'server-cert.pem')),  // Request client certificate (optional)  requestCert: true,  // Reject connections without authorized certificates (optional)  rejectUnauthorized: false};// Create TLS serverconst server = tls.createServer(options, (socket) => {  console.log('Server connected',    socket.authorized ? 'authorized' : 'unauthorized');    // Set encoding for data  socket.setEncoding('utf8');    // Handle incoming data  socket.on('data', (data) => {    console.log('Received:', data);    // Echo back the data    socket.write(`You said: ${data}`);  });    // Handle socket closure  socket.on('end', () => {    console.log('Socket ended');  });    // Write welcome message  socket.write('Welcome to the TLS server!\n');});// Start TLS serverconst port = 8000;server.listen(port, () => {  console.log(`TLS server running on port ${port}`);});
```

This example requires certificate files (`server-key.pem` and `server-cert.pem`). For development purposes, you can generate self-signed certificates using OpenSSL.

### Generating Self-Signed Certificates for Development

You can use OpenSSL to generate self-signed certificates for development and testing:

```javascript
# Generate CA certificateopenssl genrsa -out ca-key.pem 2048openssl req -new -x509 -key ca-key.pem -out ca-cert.pem -days 365# Generate server certificateopenssl genrsa -out server-key.pem 2048openssl req -new -key server-key.pem -out server-csr.pemopenssl x509 -req -in server-csr.pem -CA ca-cert.pem -CAkey ca-key.pem -CAcreateserial -out server-cert.pem -days 365# Generate client certificate (optional, for mutual authentication)openssl genrsa -out client-key.pem 2048openssl req -new -key client-key.pem -out client-csr.pemopenssl x509 -req -in client-csr.pem -CA ca-cert.pem -CAkey ca-key.pem -CAcreateserial -out client-cert.pem -days 365
```

* * *

* * *

## TLS Client

Creating a client that connects to a TLS server:

```javascript
const tls = require('tls');const fs = require('fs');const path = require('path');// Client optionsconst options = {  // For mutual authentication (optional)  key: fs.readFileSync(path.join(__dirname, 'client-key.pem')),  cert: fs.readFileSync(path.join(__dirname, 'client-cert.pem')),  // Server name for Server Name Indication (SNI)  servername: 'localhost',  // CA certificate to verify the server (optional)  ca: fs.readFileSync(path.join(__dirname, 'ca-cert.pem')),  // Reject unauthorized certificates  rejectUnauthorized: true};// Connect to serverconst client = tls.connect(8000, 'localhost', options, () => {  // Check if authorized  console.log('Client connected',    client.authorized ? 'authorized' : 'unauthorized');      if (!client.authorized) {    console.log('Reason:', client.authorizationError);  }    // Send data to server  client.write('Hello from TLS client!');});// Set encoding for received dataclient.setEncoding('utf8');// Handle received dataclient.on('data', (data) => {  console.log('Received from server:', data);    // Send another message  client.write('How are you?');});// Handle errorsclient.on('error', (error) => {  console.error('Connection error:', error);});// Handle connection endclient.on('end', () => {  console.log('Server ended connection');});// Close connection after 5 secondssetTimeout(() => {  console.log('Closing connection');  client.end();}, 5000);
```

* * *

## Server and Client Options

Both `tls.createServer()` and `tls.connect()` accept various options to configure the TLS connection:

### Common Options

*   `key`: Private key in PEM format
*   `cert`: Certificate in PEM format
*   `ca`: Trusted CA certificates
*   `ciphers`: Cipher suite specification string
*   `minVersion`: Minimum TLS version to allow
*   `maxVersion`: Maximum TLS version to allow

### Server-specific Options

*   `requestCert`: Whether to request a certificate from clients
*   `rejectUnauthorized`: Whether to reject clients with invalid certificates
*   `SNICallback`: Function to handle SNI from the client

### Client-specific Options

*   `servername`: Server name for SNI
*   `checkServerIdentity`: Function to verify server hostname
*   `session`: A Buffer instance containing TLS session

```javascript
const tls = require('tls');const fs = require('fs');// Comprehensive server optionsconst serverOptions = {  // Key and certificate  key: fs.readFileSync('server-key.pem'),  cert: fs.readFileSync('server-cert.pem'),    // Certificate Authority  ca: [fs.readFileSync('ca-cert.pem')],    // Protocol version control  minVersion: 'TLSv1.2',  maxVersion: 'TLSv1.3',    // Cipher control  ciphers: 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384',    // Client authentication  requestCert: true,  rejectUnauthorized: true,    // Server Name Indication handling  SNICallback: (servername, cb) => {    // Different certificates for different servernames    if (servername === 'example.com') {      cb(null, tls.createSecureContext({        key: fs.readFileSync('example-key.pem'),        cert: fs.readFileSync('example-cert.pem')      }));    } else {      // Default certificate      cb(null, tls.createSecureContext({        key: fs.readFileSync('default-key.pem'),        cert: fs.readFileSync('default-cert.pem')      }));    }  }};// Example client optionsconst clientOptions = {  key: fs.readFileSync('client-key.pem'),  cert: fs.readFileSync('client-cert.pem'),  ca: [fs.readFileSync('ca-cert.pem')],    servername: 'example.com',  minVersion: 'TLSv1.2',    // Custom identity check function  checkServerIdentity: (hostname, cert) => {    // Custom validation logic    if (hostname !== cert.subject.CN) {      return new Error(`Certificate CN does not match hostname: ${hostname}`);    }    return undefined; // No error  },    // Session reuse  session: savedTlsSession, // Previously saved session};
```

* * *

## Secure HTTP Server (HTTPS)

While the TLS module can be used directly, for HTTPS servers, Node.js provides a higher-level `https` module built on top of TLS:

```javascript
const https = require('https');const fs = require('fs');const path = require('path');// HTTPS server optionsconst options = {  key: fs.readFileSync(path.join(__dirname, 'server-key.pem')),  cert: fs.readFileSync(path.join(__dirname, 'server-cert.pem'))};// Create HTTPS serverhttps.createServer(options, (req, res) => {  res.writeHead(200, { 'Content-Type': 'text/html' });  res.end('<h1>Secure HTTPS Server</h1><p>This connection is encrypted using TLS.</p>');}).listen(443, () => {  console.log('HTTPS server running on port 443');});
```

The HTTPS module provides a more convenient way to create secure HTTP servers, but it uses the TLS module under the hood.

* * *

## TLS with Express

You can also create an HTTPS server with Express:

```javascript
const express = require('express');const https = require('https');const fs = require('fs');const path = require('path');// Create Express appconst app = express();// Define routesapp.get('/', (req, res) => {  res.send('<h1>Secure Express App</h1><p>This connection is encrypted using TLS.</p>');});app.get('/api/data', (req, res) => {  res.json({    message: 'This is sensitive data',    timestamp: new Date()  });});// HTTPS server optionsconst options = {  key: fs.readFileSync(path.join(__dirname, 'server-key.pem')),  cert: fs.readFileSync(path.join(__dirname, 'server-cert.pem'))};// Create HTTPS server with Express appconst port = 443;https.createServer(options, app).listen(port, () => {  console.log(`Secure Express app running on port ${port}`);});
```

* * *

## Certificate Verification

TLS uses certificates to verify the identity of servers and optionally clients. Here's an example showing how to implement custom certificate verification:

```javascript
const tls = require('tls');const fs = require('fs');// Custom verification functionfunction validateCertificate(cert) {  // Basic certificate info  console.log('Certificate subject:', cert.subject);  console.log('Certificate issuer:', cert.issuer);  console.log('Valid from:', cert.valid_from);  console.log('Valid to:', cert.valid_to);    // Check certificate validity period  const now = new Date();  const validFrom = new Date(cert.valid_from);  const validTo = new Date(cert.valid_to);    if (now < validFrom || now > validTo) {    return { valid: false, reason: 'Certificate is not within its validity period' };  }    // Additional checks could include:  // - Certificate revocation status  // - Certificate chain validation  // - Public key strength    return { valid: true };}// Create TLS client with custom validationconst options = {  ca: [fs.readFileSync('ca-cert.pem')],  checkServerIdentity: (hostname, cert) => {    // First check the certificate against our custom rules    const validationResult = validateCertificate(cert);        if (!validationResult.valid) {      return new Error(validationResult.reason);    }        // Then verify the hostname matches the certificate    const certCN = cert.subject.CN;        if (hostname !== certCN &&        !cert.subjectaltname ||        !cert.subjectaltname.includes(hostname)) {      return new Error(`Certificate name mismatch: ${hostname} !== ${certCN}`);    }        // Certificate is valid    return undefined;  }};// Connect to server with custom verificationconst client = tls.connect(8000, 'example.com', options, () => {  if (client.authorized) {    console.log('Connection authorized');    client.write('Secure message');  } else {    console.log('Connection not authorized:', client.authorizationError);  }});// Handle connection eventsclient.on('error', (error) => {  console.error('TLS error:', error);});client.on('end', () => {  console.log('Connection ended');});
```

* * *

## TLS Session Resumption

Session resumption allows clients to reconnect to a server without performing a full TLS handshake, improving performance:

```javascript
const tls = require('tls');const fs = require('fs');const path = require('path');// Server optionsconst serverOptions = {  key: fs.readFileSync(path.join(__dirname, 'server-key.pem')),  cert: fs.readFileSync(path.join(__dirname, 'server-cert.pem')),  // Enable session resumption  sessionTimeout: 300, // Session timeout in seconds  ticketKeys: Buffer.from('0123456789abcdef0123456789abcdef'), // 32 bytes for key encryption};// Create TLS serverconst server = tls.createServer(serverOptions, (socket) => {  console.log('Client connected');    // Check if this is a resumed session  if (socket.isSessionReused()) {    console.log('Session reused!');  } else {    console.log('New session');  }    socket.on('data', (data) => {    console.log('Received:', data.toString());    socket.write('Hello back!');  });    socket.on('end', () => {    console.log('Client disconnected');  });});server.listen(8443, () => {  console.log('TLS server listening on port 8443');    // First client connection  connectClient(() => {    // Second client connection - should use session resumption    connectClient();  });});// Function to create a client with session resumptionlet savedSession = null;function connectClient(callback) {  const clientOptions = {    rejectUnauthorized: false, // For self-signed certificates    session: savedSession // Use saved session if available  };    const client = tls.connect(8443, 'localhost', clientOptions, () => {    console.log('Client connected. Authorized:', client.authorized);    console.log('Using session resumption:', client.isSessionReused());        // Save the session for future connections    savedSession = client.getSession();        // Send data    client.write('Hello server!');        // Close after a short delay    setTimeout(() => {      client.end();      if (callback) setTimeout(callback, 100);    }, 100);  });    client.on('data', (data) => {    console.log('Client received:', data.toString());  });    client.on('error', (err) => {    console.error('Client error:', err);  });}
```

* * *

## Server Name Indication (SNI)

SNI allows a server to present different certificates for different hostnames on the same IP address and port:

```javascript
const tls = require('tls');const fs = require('fs');const path = require('path');// Load different certificates for different domainsconst serverOptions = {  SNICallback: (servername, cb) => {    console.log(`SNI request for: ${servername}`);        // Different certificate contexts based on hostname    if (servername === 'example.com') {      const context = tls.createSecureContext({        key: fs.readFileSync(path.join(__dirname, 'example.com-key.pem')),        cert: fs.readFileSync(path.join(__dirname, 'example.com-cert.pem'))      });      cb(null, context);    }    else if (servername === 'another.com') {      const context = tls.createSecureContext({        key: fs.readFileSync(path.join(__dirname, 'another.com-key.pem')),        cert: fs.readFileSync(path.join(__dirname, 'another.com-cert.pem'))      });      cb(null, context);    }    else {      // Default certificate      const context = tls.createSecureContext({        key: fs.readFileSync(path.join(__dirname, 'default-key.pem')),        cert: fs.readFileSync(path.join(__dirname, 'default-cert.pem'))      });      cb(null, context);    }  },  // Default keys and certificates (used as a fallback)  key: fs.readFileSync(path.join(__dirname, 'default-key.pem')),  cert: fs.readFileSync(path.join(__dirname, 'default-cert.pem'))};// Create serverconst server = tls.createServer(serverOptions, (socket) => {  socket.write(`Hello, you connected to ${socket.servername || 'unknown'}!\n`);  socket.end();});server.listen(8443, () => {  console.log('TLS SNI server running on port 8443');});
```

* * *

## Advanced Certificate Management

Proper certificate management is crucial for secure TLS communications. Here are some advanced techniques:

### 1\. Certificate Chain and Multiple CAs

```javascript
const tls = require('tls');const fs = require('fs');const path = require('path');// Load multiple CA certificatesconst caCerts = [  fs.readFileSync(path.join(__dirname, 'ca1-cert.pem')),  fs.readFileSync(path.join(__dirname, 'ca2-cert.pem')),  fs.readFileSync(path.join(__dirname, 'intermediate-cert.pem'))];// Server with multiple CA certificatesconst serverOptions = {  key: fs.readFileSync(path.join(__dirname, 'server-key.pem')),  cert: fs.readFileSync(path.join(__dirname, 'server-cert.pem')),  ca: caCerts,  // Array of CA certificates  requestCert: true,  rejectUnauthorized: true};const server = tls.createServer(serverOptions, (socket) => {  console.log('Client connected:', socket.authorized ? 'Authorized' : 'Unauthorized');    // Get peer certificate  const cert = socket.getPeerCertificate();  console.log('Client certificate subject:', cert.subject);  console.log('Issuer:', cert.issuer.CN);    socket.write('Welcome to the secure server!\n');  socket.end();});server.listen(8000, () => {  console.log('TLS server running on port 8000');});
```

### 2\. Certificate Revocation with CRL

```javascript
const tls = require('tls');const fs = require('fs');const crypto = require('crypto');// Load CRL (Certificate Revocation List)const crl = fs.readFileSync('revoked-certs.pem');// Parse CRL to check againstconst checkRevocation = (cert) => {  // In a real application, you would parse the CRL and check  // if the certificate's serial number is in the revocation list    // For demonstration, we'll just check against a known revoked serial  const revokedSerials = [    '0123456789ABCDEF', // Example revoked serial    'FEDCBA9876543210'  ];    const certInfo = crypto.certificateVerify(    cert.raw,    'sha256',    Buffer.from(''),    Buffer.from('')  );    return !revokedSerials.includes(certInfo.serialNumber.toString('hex').toUpperCase());};const server = tls.createServer({  key: fs.readFileSync('server-key.pem'),  cert: fs.readFileSync('server-cert.pem'),  requestCert: true,  rejectUnauthorized: true,    // Custom certificate validation  checkServerIdentity: (host, cert) => {    if (!checkRevocation(cert)) {      return new Error('Certificate has been revoked');    }    return undefined; // No error means certificate is valid  }}, (socket) => {  // Handle connection  console.log('Client connected:', socket.authorized ? 'Authorized' : 'Unauthorized');  socket.end('Hello secure world!\n');});server.listen(8000);
```

### 3\. Automatic Certificate Management with Let's Encrypt

```javascript
const tls = require('tls');const https = require('https');const fs = require('fs');const path = require('path');const { execSync } = require('child_process');class TLSCertManager {  constructor(domain, email) {    this.domain = domain;    this.email = email;    this.certDir = path.join(__dirname, 'certs', domain);    this.ensureCertDir();  }    ensureCertDir() {    if (!fs.existsSync(this.certDir)) {      fs.mkdirSync(this.certDir, { recursive: true });    }  }    async getCertificates() {    const keyPath = path.join(this.certDir, 'privkey.pem');    const certPath = path.join(this.certDir, 'cert.pem');    const chainPath = path.join(this.certDir, 'chain.pem');        // Check if certificates exist and are valid    if (this.certsValid(keyPath, certPath, chainPath)) {      return {        key: fs.readFileSync(keyPath),        cert: fs.readFileSync(certPath),        ca: fs.readFileSync(chainPath)      };    }        // Use certbot to obtain new certificates    return await this.obtainCertificates();  }    certsValid(keyPath, certPath, chainPath) {    try {      if (!fs.existsSync(keyPath) || !fs.existsSync(certPath) || !fs.existsSync(chainPath)) {        return false;      }            // Check if certificate is valid for at least 7 more days      const cert = fs.readFileSync(certPath);      const notAfter = cert.toString().match(/Not After : (.*?)\n/)[1];      const expiryDate = new Date(notAfter);      const now = new Date();            return (expiryDate - now) > 7 * 24 * 60 * 60 * 1000; // 7 days in ms    } catch (err) {      console.error('Error checking certificate validity:', err);      return false;    }  }    async obtainCertificates() {    try {      // This is a simplified example - in production, use a proper ACME client      console.log('Obtaining new certificates from Let\'s Encrypt...');            // In a real application, you would use an ACME client like 'greenlock' or 'acme'      // This is just a placeholder to illustrate the concept      execSync(`certbot certonly --standalone -d ${this.domain} --email ${this.email} --agree-tos --non-interactive`);            // Copy certificates to our certs directory      const certs = {        key: fs.readFileSync(`/etc/letsencrypt/live/${this.domain}/privkey.pem`),        cert: fs.readFileSync(`/etc/letsencrypt/live/${this.domain}/cert.pem`),        ca: fs.readFileSync(`/etc/letsencrypt/live/${this.domain}/chain.pem`)      };            // Save certificates for future use      fs.writeFileSync(path.join(this.certDir, 'privkey.pem'), certs.key);      fs.writeFileSync(path.join(this.certDir, 'cert.pem'), certs.cert);      fs.writeFileSync(path.join(this.certDir, 'chain.pem'), certs.ca);            return certs;    } catch (err) {      console.error('Failed to obtain certificates:', err);      throw err;    }  }}// Usage exampleasync function createSecureServer() {  const certManager = new TLSCertManager('example.com', 'admin@example.com');    try {    const certs = await certManager.getCertificates();        const server = https.createServer({      key: certs.key,      cert: certs.cert,      ca: certs.ca,      requestCert: true,      rejectUnauthorized: true    }, (req, res) => {      res.writeHead(200);      res.end('Hello, secure world!\n');    });        server.listen(443, () => {      console.log('HTTPS server running on port 443');    });        // Schedule certificate renewal check (e.g., daily)    setInterval(async () => {      try {        await certManager.getCertificates();      } catch (err) {        console.error('Certificate renewal check failed:', err);      }    }, 24 * 60 * 60 * 1000); // Check daily      } catch (err) {    console.error('Failed to start secure server:', err);    process.exit(1);  }}createSecureServer();
```

**Note:** The Let's Encrypt example is simplified. In production, use a well-maintained ACME client library and follow Let's Encrypt's rate limits and best practices.

* * *

## Security Best Practices

When using TLS in production applications, consider these security best practices:

### 1\. Use Strong TLS Versions

```javascript
const options = {  // Disable older TLS versions  minVersion: 'TLSv1.2',    // Explicitly disallow TLS 1.0 and 1.1  secureOptions: crypto.constants.SSL_OP_NO_TLSv1 |                 crypto.constants.SSL_OP_NO_TLSv1_1};
```

### 2\. Configure Strong Cipher Suites

```javascript
const options = {  // Prioritize modern, secure cipher suites  ciphers: [    'TLS_AES_256_GCM_SHA384',    'TLS_CHACHA20_POLY1305_SHA256',    'TLS_AES_128_GCM_SHA256',    'ECDHE-RSA-AES256-GCM-SHA384',    'ECDHE-RSA-AES128-GCM-SHA256'  ].join(':')};
```

### 3\. Use Perfect Forward Secrecy

```javascript
// Cipher suites with ECDHE (Elliptic Curve Diffie-Hellman Ephemeral) support PFSconst options = {  ciphers: 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384'};
```

### 4\. Implement OCSP Stapling (Online Certificate Status Protocol)

```javascript
const tls = require('tls');const https = require('https');const fs = require('fs');const path = require('path');// Server with OCSP staplingconst serverOptions = {  key: fs.readFileSync(path.join(__dirname, 'server-key.pem')),  cert: fs.readFileSync(path.join(__dirname, 'server-cert.pem')),  ca: fs.readFileSync(path.join(__dirname, 'ca-cert.pem')),    // Enable OCSP stapling  requestOCSP: true,    // OCSP response cache timeout (in milliseconds)  ocspCache: new tls.OCSPCache({    max: 1000,  // Maximum number of cached responses    maxAge: 60 * 60 * 1000  // Cache for 1 hour  })};// Create HTTPS server with OCSP staplingconst server = https.createServer(serverOptions, (req, res) => {  res.writeHead(200);  res.end('Hello with OCSP stapling!\n');});// Handle OCSP request errorsserver.on('OCSPRequest', (cert, issuer, callback) => {  if (!cert || !issuer) {    return callback(new Error('No certificate or issuer provided'));  }    // Get OCSP URL from certificate  const ocspUrl = tls.getOCSPURL(cert);  if (!ocspUrl) {    return callback(new Error('No OCSP URL in certificate'));  }    console.log('OCSP request for:', cert.subject.CN);    // In a real application, you would make an OCSP request here  // and return the response via the callback    // For demonstration, we'll just return a dummy response  const ocspResponse = Buffer.from('OCSP response would go here');  callback(null, ocspResponse);});server.listen(443, () => {  console.log('HTTPS server with OCSP stapling running on port 443');});// Client that verifies OCSP staplingconst clientOptions = {  host: 'example.com',  port: 443,  rejectUnauthorized: true,  requestOCSP: true  // Request OCSP stapling from server};const req = https.request(clientOptions, (res) => {  console.log('Response status code:', res.statusCode);    // Get the OCSP response from the server  const ocspResponse = res.socket.getOCSPResponse();  if (ocspResponse) {    console.log('Received OCSP response');    // Verify the OCSP response here  } else {    console.log('No OCSP response received');  }    res.on('data', (chunk) => {    console.log('Received data:', chunk.toString());  });});req.on('error', (err) => {  console.error('Request error:', err);});req.end();
```

### 5\. ALPN and SNI Support

Application-Layer Protocol Negotiation (ALPN) and Server Name Indication (SNI) are important TLS extensions that enable protocol negotiation and virtual hosting:

```javascript
const tls = require('tls');const http2 = require('http2');const https = require('https');const fs = require('fs');const path = require('path');// Server with ALPN and SNI supportconst serverOptions = {  // ALPN protocols in order of preference  ALPNProtocols: ['h2', 'http/1.1'],    // SNI callback for multiple domains  SNICallback: (servername, cb) => {    console.log('SNI request for:', servername);        try {      let context;            // Create different contexts for different domains      if (servername === 'example.com') {        context = tls.createSecureContext({          key: fs.readFileSync(path.join(__dirname, 'example.com-key.pem')),          cert: fs.readFileSync(path.join(__dirname, 'example.com-cert.pem')),          // Enable OCSP stapling for this domain          requestOCSP: true,          // Custom cipher suites for this domain          ciphers: [            'TLS_AES_256_GCM_SHA384',            'TLS_CHACHA20_POLY1305_SHA256',            'TLS_AES_128_GCM_SHA256'          ].join(':')        });      } else {        // Default context for other domains        context = tls.createSecureContext({          key: fs.readFileSync(path.join(__dirname, 'default-key.pem')),          cert: fs.readFileSync(path.join(__dirname, 'default-cert.pem')),          // Less strict ciphers for legacy clients          ciphers: [            'TLS_AES_256_GCM_SHA384',            'TLS_CHACHA20_POLY1305_SHA256',            'TLS_AES_128_GCM_SHA256',            'ECDHE-RSA-AES256-GCM-SHA384',            'ECDHE-RSA-AES128-GCM-SHA256'          ].join(':')        });      }            // Set ALPN protocols for this context      context.setALPNProtocols(['h2', 'http/1.1']);            // Return the created context      if (cb) {        cb(null, context);      } else {        return context;      }    } catch (err) {      console.error('SNI callback error:', err);      if (cb) {        cb(err);      } else {        throw err;      }    }  },    // Default key and cert (used if SNI is not supported by client)  key: fs.readFileSync(path.join(__dirname, 'default-key.pem')),  cert: fs.readFileSync(path.join(__dirname, 'default-cert.pem'))};// Create HTTP/2 server with ALPN and SNIconst http2Server = http2.createSecureServer(serverOptions, (req, res) => {  const protocol = req.socket.alpnProtocol;  res.writeHead(200);  res.end(`Hello from ${req.socket.servername} using ${protocol}\n`);});http2Server.on('error', (err) => {  console.error('HTTP/2 server error:', err);});http2Server.on('stream', (stream, headers) => {  const protocol = stream.session.alpnProtocol;  const hostname = stream.session.servername || 'unknown';    stream.respond({    'content-type': 'text/plain; charset=utf-8',    ':status': 200  });    stream.end(`HTTP/2 stream from ${hostname} using ${protocol}\n`);});// Create HTTPS server with ALPN and SNIconst httpsServer = https.createServer(serverOptions, (req, res) => {  const protocol = req.socket.alpnProtocol;  res.writeHead(200, { 'Content-Type': 'text/plain' });  res.end(`Hello from ${req.socket.servername} using ${protocol || 'HTTP/1.1'}\n`);});// Handle upgrade to HTTP/2httpsServer.on('upgrade', (req, socket, head) => {  const protocol = req.socket.alpnProtocol;  if (protocol === 'h2') {    http2Server.emit('connection', socket);  } else {    socket.destroy();  }});// Start serversconst PORT = 443;httpsServer.listen(PORT, () => {  console.log(`HTTPS server running on port ${PORT}`);});// Client examplefunction makeRequest(hostname, port = 443) {  const options = {    hostname,    port,    path: '/',    method: 'GET',    // Enable ALPN    ALPNProtocols: ['h2', 'http/1.1'],    // Set SNI    servername: hostname,    // Verify certificate    rejectUnauthorized: false, // For testing with self-signed certs    // Custom check for server identity    checkServerIdentity: (host, cert) => {      // Implement custom certificate validation      return undefined; // No error means success    }  };  const req = https.request(options, (res) => {    console.log(`Status: ${res.statusCode}`);    console.log('ALPN Protocol:', res.socket.alpnProtocol);    console.log('Negotiated Protocol:', res.socket.getProtocol());        let data = '';    res.on('data', (chunk) => {      data += chunk;    });        res.on('end', () => {      console.log('Response:', data.trim());    });  });  req.on('error', (err) => {    console.error('Request error:', err);  });  req.end();}// Example usage// makeRequest('example.com');// makeRequest('another-domain.com');
```

### 6\. Use HTTP Strict Transport Security (HSTS)

```javascript
// In an Express applicationapp.use((req, res, next) => {  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');  next();});
```

* * *

* * *