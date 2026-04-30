# Node.js API Authentication Guide

* * *

## What is API Authentication?

API authentication is the process of verifying the identity of clients accessing your Node.js APIs.

This comprehensive guide covers various authentication methods, security best practices, and implementation patterns to help you secure your Node.js applications effectively.

* * *

## Why API Authentication Matters

In today's interconnected world, API security is not optional-it's a necessity. Proper authentication helps you:

### Security Benefits

*   **Access Control**: Restrict API access to authorized users only
*   **Data Protection**: Safeguard sensitive information from unauthorized access
*   **Identity Verification**: Ensure users are who they claim to be

### Business Benefits

*   **Usage Analytics**: Track API usage by user/application
*   **Monetization**: Implement usage-based billing models
*   **Compliance**: Meet regulatory requirements (GDPR, HIPAA, etc.)

* * *

## Authentication Methods Overview

Different authentication methods serve different use cases. Here's a quick comparison:

Method

Best For

Complexity

Security Level

Session-Based

Traditional web apps

Low

Medium

JWT (Token-Based)

SPAs, Mobile Apps

Medium

High

API Keys

Server-to-Server

Low

Low-Medium

OAuth 2.0

Third-party access

High

Very High

* * *

* * *

## Authentication Methods

There are several approaches to API authentication in Node.js

* * *

## Session-Based Authentication

Session-based authentication uses cookies to maintain user state:

```javascript
const express = require('express');const session = require('express-session');const bodyParser = require('body-parser');const app = express();// Parse request bodiesapp.use(bodyParser.json());app.use(bodyParser.urlencoded({ extended: true }));// Configure sessionsapp.use(session({  secret: 'your-secret-key',  resave: false,  saveUninitialized: false,  cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000 } // 24 hours}));// Sample user databaseconst users = [  { id: 1, username: 'user1', password: 'password1' }];// Login routeapp.post('/login', (req, res) => {  const { username, password } = req.body;   // Find user  const user = users.find(u => u.username === username && u.password === password);   if (!user) {    return res.status(401).json({ message: 'Invalid credentials' });  }   // Store user information in session (excluding password)  req.session.user = {    id: user.id,    username: user.username  };   res.json({ message: 'Login successful', user: req.session.user });});// Protected routeapp.get('/profile', (req, res) => {  // Check if user is logged in  if (!req.session.user) {    return res.status(401).json({ message: 'Unauthorized' });  }   res.json({ message: 'Profile accessed', user: req.session.user });});// Logout routeapp.post('/logout', (req, res) => {  // Destroy session  req.session.destroy((err) => {    if (err) {      return res.status(500).json({ message: 'Logout failed' });    }    res.json({ message: 'Logout successful' });  });});// Start serverapp.listen(8080, () => {  console.log('Server running on port 8080');});
```

* * *

## Token-Based Authentication (JWT)

JSON Web Tokens (JWT) provide a stateless authentication mechanism that's compact and self-contained.

Unlike session-based authentication, **token-based authentication (JWT) doesn't require a server to store session data**.

This makes it ideal for stateless API architecture and microservices.

```javascript
const express = require('express');const jwt = require('jsonwebtoken');const bodyParser = require('body-parser');const app = express();app.use(bodyParser.json());const JWT_SECRET = 'your-jwt-secret-key';// Sample user databaseconst users = [  { id: 1, username: 'user1', password: 'password1', role: 'user' }];// Login route - generate tokenapp.post('/login', (req, res) => {  const { username, password } = req.body;  // Find user  const user = users.find(u => u.username === username && u.password === password);  if (!user) {    return res.status(401).json({ message: 'Invalid credentials' });  }  // Create payload for JWT  const payload = {    id: user.id,    username: user.username,    role: user.role  };  // Sign token  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });  res.json({ message: 'Login successful', token });});// Middleware for JWT verificationconst authenticateJWT = (req, res, next) => {  // Get auth header - The Authorization header is commonly used to send authentication tokens  const authHeader = req.headers.authorization;  if (!authHeader) {    return res.status(401).json({ message: 'Authorization header missing' });  }  // Extract token from "Bearer <token>"  const token = authHeader.split(' ')[1];  if (!token) {    return res.status(401).json({ message: 'Token missing' });  }  try {    // Verify token    const decoded = jwt.verify(token, JWT_SECRET);    // Attach user to request    req.user = decoded;    next();  } catch (error) {    return res.status(403).json({ message: 'Invalid or expired token' });  }};// Protected routeapp.get('/profile', authenticateJWT, (req, res) => {  res.json({ message: 'Profile accessed', user: req.user });});// Role-based routeapp.get('/admin', authenticateJWT, (req, res) => {  // Check if user has admin role  if (req.user.role !== 'admin') {    return res.status(403).json({ message: 'Access denied: admin role required' });  }  res.json({ message: 'Admin panel accessed' });});// Start serverapp.listen(8080, () => {  console.log('Server running on port 8080');});
```

* * *

## OAuth 2.0 Authentication

OAuth 2.0 is the industry-standard protocol for authorization, enabling applications to obtain limited access to user accounts on HTTP services.

It works by delegating user authentication to the service that hosts the user account.

### OAuth 2.0 Flow Overview

1.  User clicks "Login with \[Provider\]" in your app
2.  User is redirected to the provider's login page
3.  User authenticates and authorizes your app
4.  Provider redirects back to your app with an authorization code
5.  Your app exchanges the code for an access token
6.  Your app can now access the user's data (within the authorized scope)

### Implementation with Passport.js

```javascript
npm install passport passport-google-oauth20 express-session
```
```javascript
const express = require('express');const passport = require('passport');const GoogleStrategy = require('passport-google-oauth20').Strategy;const session = require('express-session');const app = express();// Configure sessions for OAuth 2.0app.use(session({  secret: 'your-secret-key',  resave: false,  saveUninitialized: false,  cookie: { secure: process.env.NODE_ENV === 'production' }}));// Initialize Passportapp.use(passport.initialize());app.use(passport.session());// Configure Google OAuth 2.0 strategypassport.use(new GoogleStrategy({    clientID: 'YOUR_GOOGLE_CLIENT_ID',    clientSecret: 'YOUR_GOOGLE_CLIENT_SECRET',    callbackURL: 'http://localhost:8080/auth/google/callback'  },  (accessToken, refreshToken, profile, done) => {    // In a real app, you'd find or create a user in your database    const user = {      id: profile.id,      displayName: profile.displayName,      email: profile.emails[0].value,      provider: 'google'    };       return done(null, user);  }));// Serialize user for sessionpassport.serializeUser((user, done) => {  done(null, user);});// Deserialize user from sessionpassport.deserializeUser((user, done) => {  done(null, user);});// Routes for Google OAuthapp.get('/auth/google',  passport.authenticate('google', { scope: ['profile', 'email'] }));app.get('/auth/google/callback',  passport.authenticate('google', { failureRedirect: '/login' }),  (req, res) => {    // Successful authentication    res.redirect('/profile');  });// Middleware to check authenticationconst isAuthenticated = (req, res, next) => {  if (req.isAuthenticated()) {    return next();  }  res.redirect('/login');};// Protected routeapp.get('/profile', isAuthenticated, (req, res) => {  res.json({ user: req.user });});// Logout routeapp.get('/logout', (req, res) => {  req.logout();  res.redirect('/');});// Start serverapp.listen(8080, () => {  console.log('Server running on port 8080');});
```

* * *

## API Key Authentication

API keys are a simple way to authenticate clients to your API.

They're best suited for server-to-server communication or when you need to identify the calling project without user context.

**Best Practices for API Keys:**

*   Store keys securely (environment variables, secret management services)
*   Rotate keys regularly
*   Use HTTPS to prevent key exposure
*   Implement rate limiting per key

### Implementation Example

```javascript
const express = require('express');const app = express();// In-memory storage for API keys (use a database in production)const apiKeys = new Map([  ['abc123', { name: 'Mobile App', permissions: ['read:data'] }],  ['def456', { name: 'Web Client', permissions: ['read:data', 'write:data'] }]]);// API key authentication middlewareconst authenticateApiKey = (req, res, next) => {  const apiKey = req.headers['x-api-key'] || req.query.apiKey;  if (!apiKey) {    return res.status(401).json({      error: 'API key is required',      docs: 'https://your-api-docs.com/authentication'    });  }  const keyData = apiKeys.get(apiKey);  if (!keyData) {    return res.status(403).json({ error: 'Invalid API key' });  }  // Attach key data to request for use in route handlers  req.apiKey = keyData;  next();};// Protected route using API keyapp.get('/api/data', authenticateApiKey, (req, res) => {  res.json({    message: 'Access granted',    client: req.apiKey.name,    timestamp: new Date().toISOString()  });});// Route to generate a new API key (protected by admin auth in real apps)app.post('/api/keys', (req, res) => {  const { name, permissions } = req.body;  const apiKey = generateApiKey(); // Implement your key generation logic  apiKeys.set(apiKey, { name, permissions });  res.status(201).json({ apiKey });});// Helper function to generate API keysfunction generateApiKey() {  return [...Array(32)]    .map(() => Math.floor(Math.random() * 16).toString(16))    .join('');}// Start serverconst PORT = process.env.PORT || 3000;app.listen(PORT, () => {  console.log(`Server running on port ${PORT}`);});// Export for testingmodule.exports = { app, apiKeys };
```

* * *

## API Key Authentication

API keys are a simple way to authenticate requests to your API:

```javascript
const express = require('express');const app = express();// Sample API keys databaseconst apiKeys = [  { key: 'api-key-1', owner: 'client1', permissions: ['read'] },  { key: 'api-key-2', owner: 'client2', permissions: ['read', 'write'] }];// Middleware for API key authenticationconst authenticateApiKey = (req, res, next) => {  // Get API key from header or query parameter  const apiKey = req.headers['x-api-key'] || req.query.api_key;   if (!apiKey) {    return res.status(401).json({ message: 'API key missing' });  }   // Find API key in database  const keyData = apiKeys.find(k => k.key === apiKey);   if (!keyData) {    return res.status(403).json({ message: 'Invalid API key' });  }   // Attach key data to request  req.apiKeyData = keyData;   next();};// Protected route with API keyapp.get('/data', authenticateApiKey, (req, res) => {  res.json({    message: 'Data accessed',    client: req.apiKeyData.owner,    data: { example: 'API data' }  });});// Route requiring specific permissionapp.post('/data', authenticateApiKey, (req, res) => {  // Check if client has write permission  if (!req.apiKeyData.permissions.includes('write')) {    return res.status(403).json({ message: 'Insufficient permissions' });  }   res.json({ message: 'Data created successfully' });});// Start serverapp.listen(8080, () => {  console.log('Server running on port 8080');});
```

* * *

## Basic Authentication

HTTP Basic authentication uses encoded credentials in the Authorization header:

```javascript
const express = require('express');const app = express();// Sample user databaseconst users = [  { username: 'user1', password: 'password1' }];// Basic authentication middlewareconst basicAuth = (req, res, next) => {  // Get Authorization header  const authHeader = req.headers.authorization;   if (!authHeader || !authHeader.startsWith('Basic ')) {    // If no credentials provided, request authentication    res.setHeader('WWW-Authenticate', 'Basic realm="API Authentication"');    return res.status(401).json({ message: 'Authentication required' });  }   // Extract and decode credentials   const encodedCredentials = authHeader.split(' ')[1];  const decodedCredentials = Buffer.from(encodedCredentials, 'base64').toString('utf-8');  const [username, password] = decodedCredentials.split(':');   // Validate credentials  const user = users.find(u => u.username === username && u.password === password);   if (!user) {    res.setHeader('WWW-Authenticate', 'Basic realm="API Authentication"');    return res.status(401).json({ message: 'Invalid credentials' });  }   // Attach user to request  req.user = { username: user.username };   next();};// Protected routeapp.get('/api/data', basicAuth, (req, res) => {  res.json({    message: 'Data accessed',    user: req.user.username,    data: { example: 'Sensitive data' }  });});// Start serverapp.listen(8080, () => {  console.log('Server running on port 8080');});
```

* * *

## Multi-Factor Authentication (MFA)

Adding an extra layer of security with time-based one-time passwords (TOTP):

```javascript
const express = require('express');const bodyParser = require('body-parser');const speakeasy = require('speakeasy');const QRCode = require('qrcode');const jwt = require('jsonwebtoken');const app = express();app.use(bodyParser.json());// In-memory database (use a real database in production)const users = [];const JWT_SECRET = 'your-jwt-secret-key';// Step 1: Register a user and set up MFAapp.post('/register', (req, res) => {  const { username, password } = req.body;   // Check if user already exists  if (users.find(u => u.username === username)) {    return res.status(400).json({ message: 'Username already exists' });  }   // Generate secret for TOTP  const secret = speakeasy.generateSecret({    name: `MyApp:${username}`  });   // Create user  const newUser = {    id: users.length + 1,    username,    password, // In production, hash passwords!    mfaSecret: secret.base32,    mfaEnabled: false  };   users.push(newUser);   // Generate QR code for TOTP setup  QRCode.toDataURL(secret.otpauth_url, (err, dataUrl) => {    if (err) {      return res.status(500).json({ message: 'Error generating QR code' });    }       res.json({      message: 'User registered. Please set up MFA.',      user: {        id: newUser.id,        username: newUser.username      },      mfaSecret: secret.base32,      qrCode: dataUrl    });  });});// Step 2: Verify and enable MFAapp.post('/verify-mfa', (req, res) => {  const { username, token } = req.body;   // Find user  const user = users.find(u => u.username === username);   if (!user) {    return res.status(404).json({ message: 'User not found' });  }   // Verify token against user's secret  const verified = speakeasy.totp.verify({    secret: user.mfaSecret,    encoding: 'base32',    token  });   if (!verified) {    return res.status(400).json({ message: 'Invalid MFA token' });  }   // Enable MFA for user  user.mfaEnabled = true;   res.json({ message: 'MFA enabled successfully' });});// Step 3: Login with MFAapp.post('/login', (req, res) => {  const { username, password } = req.body;   // Find user  const user = users.find(u => u.username === username && u.password === password);   if (!user) {    return res.status(401).json({ message: 'Invalid credentials' });  }   // Check if MFA is enabled  if (user.mfaEnabled) {    return res.json({      message: 'Password verified. MFA token required.',      requireMFA: true,      userId: user.id    });  }   // If MFA not enabled, generate token directly  const token = jwt.sign(    { id: user.id, username: user.username },    JWT_SECRET,    { expiresIn: '1h' }  );   res.json({ message: 'Login successful', token });});// Step 4: Verify MFA token and complete loginapp.post('/verify-login', (req, res) => {  const { userId, mfaToken } = req.body;   // Find user  const user = users.find(u => u.id === userId);   if (!user) {    return res.status(404).json({ message: 'User not found' });  }   // Verify MFA token  const verified = speakeasy.totp.verify({    secret: user.mfaSecret,    encoding: 'base32',    token: mfaToken  });   if (!verified) {    return res.status(401).json({ message: 'Invalid MFA token' });  }   // Generate JWT token  const token = jwt.sign(    { id: user.id, username: user.username },    JWT_SECRET,    { expiresIn: '1h' }  );   res.json({ message: 'Login successful', token });});// Start serverapp.listen(8080, () => {  console.log('Server running on port 8080');});
```

* * *

## Security Best Practices

**Important:** Security is not optional when implementing authentication. Follow these best practices to protect your application and users.

### Password Security

*   **Never store plain text passwords** - Always use strong hashing algorithms like bcrypt or Argon2
*   **Enforce strong passwords** - Require minimum length, special characters, and numbers
*   **Implement password rotation** - Prompt users to change passwords periodically

### Token Security

*   **Use short-lived access tokens** - 15-60 minutes is typical
*   **Implement refresh tokens** - For obtaining new access tokens without re-authentication
*   **Store tokens securely** - Use HTTP-only, secure, same-site cookies for web apps

### General Security

*   **Always use HTTPS** - Encrypt all traffic
*   **Implement rate limiting** - Prevent brute force attacks
*   **Use security headers** - Like CSP, X-Content-Type-Options, X-Frame-Options
*   **Log and monitor** - Keep audit logs of authentication attempts

### OAuth 2.0 Security

*   **Use PKCE** - For public clients (mobile/native apps)
*   **Validate redirect URIs** - Prevent open redirect vulnerabilities
*   **Store client secrets securely** - Never in version control

### Example: Secure Password Hashing with bcrypt

```javascript
const bcrypt = require('bcrypt');const saltRounds = 10;// Hashing a passwordasync function hashPassword(plainPassword) {  return await bcrypt.hash(plainPassword, saltRounds);}// Verifying a passwordasync function verifyPassword(plainPassword, hashedPassword) {  return await bcrypt.compare(plainPassword, hashedPassword);}
```

When implementing API authentication, follow these security best practices:

*   **HTTPS Only**: Always use HTTPS to encrypt data in transit
*   **Password Hashing**: Store only hashed passwords using bcrypt or Argon2
*   **Token Management**: Keep tokens short-lived and implement refresh tokens
*   **Rate Limiting**: Protect against brute force attacks
*   **Input Validation**: Validate all user inputs to prevent injection attacks
*   **CORS Configuration**: Restrict cross-origin requests appropriately
*   **Secure Headers**: Implement security headers like HSTS and CSP
*   **Audit Logging**: Log authentication events for security monitoring

### Example: Password Hashing with Bcrypt

```javascript
const bcrypt = require('bcrypt');const express = require('express');const bodyParser = require('body-parser');const app = express();app.use(bodyParser.json());// In-memory user databaseconst users = [];// Register route with password hashingapp.post('/register', async (req, res) => {  try {    const { username, password } = req.body;       // Check if username already exists    if (users.find(u => u.username === username)) {      return res.status(400).json({ message: 'Username already taken' });    }       // Hash password    const saltRounds = 10;    const hashedPassword = await bcrypt.hash(password, saltRounds);       // Create new user    const newUser = {      id: users.length + 1,      username,      password: hashedPassword    };       users.push(newUser);       res.status(201).json({      message: 'User registered successfully',      userId: newUser.id    });  } catch (error) {    res.status(500).json({ message: 'Error registering user' });  }});// Login route with password comparisonapp.post('/login', async (req, res) => {  try {    const { username, password } = req.body;       // Find user    const user = users.find(u => u.username === username);       if (!user) {      return res.status(401).json({ message: 'Invalid credentials' });    }       // Compare password with stored hash    const passwordMatch = await bcrypt.compare(password, user.password);       if (!passwordMatch) {      return res.status(401).json({ message: 'Invalid credentials' });    }       // In a real app, generate and return a token    res.json({      message: 'Login successful',      userId: user.id    });  } catch (error) {    res.status(500).json({ message: 'Error logging in' });  }});// Start serverapp.listen(8080, () => {  console.log('Server running on port 8080');});
```

* * *

## Combining Authentication Methods

In real-world applications, you often need to combine multiple authentication methods:

```javascript
// JWT authentication with API rate limiting and refresh tokensconst express = require('express');const jwt = require('jsonwebtoken');const rateLimit = require('express-rate-limit');const bodyParser = require('body-parser');const app = express();app.use(bodyParser.json());// Configure rate limitingconst loginLimiter = rateLimit({  windowMs: 15 * 60 * 1000, // 15 minutes  max: 5, // 5 attempts per window  message: 'Too many login attempts, please try again later'});// JWT configurationconst JWT_SECRET = 'your-jwt-secret-key';const JWT_REFRESH_SECRET = 'your-refresh-token-secret';// Token storage (use a database in production)const tokenBlacklist = new Set();const refreshTokens = new Set();// Login route with rate limitingapp.post('/login', loginLimiter, (req, res) => {  const { username, password } = req.body;   // Authentication logic (simplified)  if (username !== 'user1' || password !== 'password1') {    return res.status(401).json({ message: 'Invalid credentials' });  }   // Generate tokens  const accessToken = jwt.sign(    { id: 1, username },    JWT_SECRET,    { expiresIn: '15m' } // Short-lived access token  );   const refreshToken = jwt.sign(    { id: 1, username },    JWT_REFRESH_SECRET,    { expiresIn: '7d' } // Longer-lived refresh token  );   // Store refresh token  refreshTokens.add(refreshToken);   res.json({    message: 'Login successful',    accessToken,    refreshToken  });});// Refresh token routeapp.post('/refresh-token', (req, res) => {  const { refreshToken } = req.body;   if (!refreshToken) {    return res.status(401).json({ message: 'Refresh token required' });  }   // Check if token exists and is not blacklisted  if (!refreshTokens.has(refreshToken)) {    return res.status(403).json({ message: 'Invalid refresh token' });  }   try {    // Verify refresh token    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);       // Generate new access token    const accessToken = jwt.sign(      { id: decoded.id, username: decoded.username },      JWT_SECRET,      { expiresIn: '15m' }    );       res.json({      message: 'Token refreshed',      accessToken    });  } catch (error) {    // Remove invalid refresh token    refreshTokens.delete(refreshToken);       return res.status(403).json({ message: 'Invalid or expired refresh token' });  }});// JWT verification middlewareconst authenticateJWT = (req, res, next) => {  const authHeader = req.headers.authorization;   if (!authHeader || !authHeader.startsWith('Bearer ')) {    return res.status(401).json({ message: 'Authorization header required' });  }   const token = authHeader.split(' ')[1];   // Check if token is blacklisted  if (tokenBlacklist.has(token)) {    return res.status(403).json({ message: 'Token revoked' });  }   try {    // Verify token    const decoded = jwt.verify(token, JWT_SECRET);    req.user = decoded;    next();  } catch (error) {    return res.status(403).json({ message: 'Invalid or expired token' });  }};// Logout routeapp.post('/logout', authenticateJWT, (req, res) => {  const authHeader = req.headers.authorization;  const token = authHeader.split(' ')[1];  const { refreshToken } = req.body;   // Blacklist the current access token  tokenBlacklist.add(token);   // Remove refresh token if provided  if (refreshToken) {    refreshTokens.delete(refreshToken);  }   res.json({ message: 'Logout successful' });});// Protected routeapp.get('/protected', authenticateJWT, (req, res) => {  res.json({    message: 'Protected resource accessed',    user: req.user  });});// Start serverapp.listen(8080, () => {  console.log('Server running on port 8080');  if (!authHeader || !authHeader.startsWith('Bearer ')) {    return res.status(401).json({ message: 'Authorization header required' });  }  const token = authHeader.split(' ')[1];  // Check if token is blacklisted  if (tokenBlacklist.has(token)) {    return res.status(403).json({ message: 'Token revoked' });  }  try {    // Verify token    const decoded = jwt.verify(token, JWT_SECRET);    req.user = decoded;    next();  } catch (error) {    return res.status(403).json({ message: 'Invalid or expired token' });  }});// Logout routeapp.post('/logout', authenticateJWT, (req, res) => {  const authHeader = req.headers.authorization;  const token = authHeader.split(' ')[1];  const { refreshToken } = req.body;  // Blacklist the current access token  tokenBlacklist.add(token);  // Remove refresh token if provided  if (refreshToken) {    refreshTokens.delete(refreshToken);  }  res.json({ message: 'Logout successful' });});// Protected routeapp.get('/protected', authenticateJWT, (req, res) => {  res.json({    message: 'Protected resource accessed',    user: req.user  });});// Start serverapp.listen(8080, () => {  console.log('Server running on port 8080');});
```

* * *

## HTTP Headers for Authentication

When implementing API authentication, the HTTP headers used are crucial:

*   **Authorization header**: This is the standard HTTP header used for sending authentication tokens in most API authentication strategies including JWT, OAuth, and Basic Auth
*   Common format: `Authorization: Bearer <token>` for JWT and OAuth 2.0
*   Format for Basic Auth: `Authorization: Basic <base64-encoded-credentials>`

* * *

## Authentication Strategies for Different API Types

API Type

Recommended Authentication

Considerations

Public API

API Keys

Simple to implement, good for tracking usage

Service-to-Service API

JWT (stateless) or Mutual TLS

Minimal overhead, high security

Mobile/Web App API

OAuth 2.0 + JWT

Good user experience, handles third-party auth

Single-Page Application API

JWT with refresh tokens

Works well with front-end frameworks

IoT Device API

Client certificates or API keys

Handles limited device capabilities

* * *

## Conclusion

You've now explored the essential authentication methods for Node.js APIs. Here's a quick recap of what we've covered:

### Authentication Methods

*   **Session-based** - Traditional approach using server-side sessions
*   **JWT Tokens** - Stateless tokens for distributed systems
*   **OAuth 2.0** - Industry standard for third-party authentication
*   **API Keys** - Simple authentication for server-to-server communication

### Security Essentials

*   Always use HTTPS
*   Hash passwords with bcrypt/Argon2
*   Use short-lived tokens
*   Implement rate limiting

* * *

* * *