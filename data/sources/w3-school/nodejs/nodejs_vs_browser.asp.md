# Node.js vs Browser

* * *

## Key Differences

Node.js and browsers both run JavaScript, but they have different environments and capabilities.

Node.js is designed for server-side development, while browsers are for client-side applications.

*   **APIs:** Node.js provides APIs for file system, networking, and OS, which browsers do not.  
    Browsers provide DOM, fetch, and UI APIs not available in Node.js.
*   **Global Objects:** Node.js uses `global`; browsers use `window` or `self`.
*   **Modules:** Node.js uses CommonJS (`require`) and ES modules (`import`); browsers use ES modules or plain `<script>` tags.
*   **Security:** Browsers run in a sandbox with limited access; Node.js has full access to the file system and network.
*   **Event Loop:** Both environments use an event loop, but Node.js has additional APIs for timers, process, etc.
*   **Environment Variables:** Node.js can access environment variables (`process.env`); browsers cannot.
*   **Package Management:** Node.js uses npm/yarn; browsers use CDNs or bundlers.

This page explains the key differences, with examples for each environment.

* * *

## Examples

```javascript
// Node.jsglobal.mylet = 42;console.log(global.mylet); // 42
```
```javascript
// Node.jsconst fs = require('fs');fs.readFile('myfile.txt', 'utf8', (err, data) => {  if (err) throw err;  console.log(data);});
```
```javascript
// Node.jsconst https = require('https');https.get('https://example.com', res => {  let data = '';  res.on('data', chunk => data += chunk);  res.on('end', () => console.log(data));});
```
```javascript
// Node.js (CommonJS)const fs = require('fs');
```

* * *

* * *

## Comparison Table

Feature

Node.js

Browser

File System Access

Yes

No

Networking (TCP/UDP)

Yes

No

DOM Access

No

Yes

Global Object

global

window/self

Modules

CommonJS/ESM

ESM/Scripts

Environment Variables

Yes (`process.env`)

No

Security

Full OS access

Sandboxed

Package Management

npm/yarn

CDN/Bundler

* * *

* * *