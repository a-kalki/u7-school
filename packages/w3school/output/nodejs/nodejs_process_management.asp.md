# Node.js Process Management

* * *

## What is Process Management?

Process management in Node.js is about controlling your application's lifecycle.

It includes:

*   Starting and stopping applications
*   Restarting after crashes
*   Monitoring performance
*   Handling system signals
*   Managing environment variables

* * *

## Accessing Process Information

The `process` object gives you details about and control over the current Node.js process.

Here are some useful properties:

```javascript
// Process identificationconsole.log('Process ID (PID):', process.pid);// Platform informationconsole.log('Platform:', process.platform);console.log('Node.js version:', process.version);// Memory usage (in bytes)console.log('Memory usage:', process.memoryUsage());// Command line argumentsconsole.log('Arguments:', process.argv);
```

* * *

## Exiting a Process

You can control when your Node.js program stops using these methods:

```javascript
// Exit with success (status code 0)process.exit();// Or explicitlyprocess.exit(0);
```
```javascript
// Exit with error (status code 1)process.exit(1);
```
```javascript
// Run cleanup before exitingprocess.on('beforeExit', (code) => {  console.log('About to exit with code:', code);});
```

* * *

* * *

## Handling Process Events

Node.js processes can respond to system signals and events.

Here are the most common ones:

```javascript
// Handle Ctrl+Cprocess.on('SIGINT', () => {console.log('\nGot SIGINT. Press Control-D to exit.');// Perform cleanup if neededprocess.exit(0);
```
```javascript
process.on('SIGTERM', () => {  console.log('Received SIGTERM. Cleaning up...');  // Perform cleanup if needed  process.exit(0);});
```
```javascript
process.on('SIGTERM', () => {  console.log('Received SIGTERM. Cleaning up...');  server.close(() => {    console.log('Server closed');    process.exit(0);  });});
```
```javascript
process.on('uncaughtException', (err) => {  console.error('Uncaught Exception:', err);  // Perform cleanup if needed  process.exit(1); // Exit with error});
```

* * *

## Process Managers

For production environments, use a process manager to keep your application running smoothly.

**PM2** is the most popular choice:

### 1\. Install PM2 Globally

```javascript
npm install -g pm2
```

### 2\. Basic PM2 Commands

```javascript
# Start an applicationpm2 start app.js# List all running applicationspm2 list# Monitor resourcespm2 monit# View application logspm2 logs# Stop an applicationpm2 stop app_name# Restart an applicationpm2 restart app_name# Delete an application from PM2pm2 delete app_name
```

### 3\. PM2 Configuration

Create an ecosystem file for advanced configuration:

```javascript
// ecosystem.config.jsmodule.exports = {  apps: [{    name: 'my-app',    script: 'app.js',    instances: 'max',    autorestart: true,    watch: false,    max_memory_restart: '1G',    env: {      NODE_ENV: 'development',    },    env_production: {      NODE_ENV: 'production',    }  }]};
```

PM2 provides many other features like load balancing, monitoring, and log management.

* * *

## Environment Variables

Environment variables are key-value pairs that configure your application's behavior in different environments.

```javascript
// Get a specific environment variableconst apiKey = process.env.API_KEY;// Set a default value if not definedconst port = process.env.PORT || 3000;// Check if running in productionconst isProduction = process.env.NODE_ENV === 'production';// List all environment variablesconsole.log('Environment variables:', process.env);
```
```javascript
# Install dotenv packagenpm install dotenv
```

**Best Practices for Environment Variables:**

*   Never commit sensitive data to version control
*   Use `.env` for local development
*   Set environment variables in production through your hosting platform
*   Document all required environment variables in your README

* * *

## Child Processes

Node.js can run system commands and other scripts using the `child_process` module.

```javascript
const { exec } = require('child_process');exec('ls -la', (error, stdout, stderr) => {  if (error) {    console.error(`Error: ${error.message}`);    return;  }  if (stderr) {    console.error(`stderr: ${stderr}`);    return;  }  console.log(`Output: ${stdout}`);});
```
```javascript
const { spawn } = require('child_process');// Better for large data outputconst child = spawn('find', ['/', '-type', 'f']);child.stdout.on('data', (data) => {  console.log(`Found file: ${data}`);});child.stderr.on('data', (data) => {  console.error(`Error: ${data}`);});child.on('close', (code) => {  console.log(`Child process exited with code ${code}`);});
```

* * *

## Process Monitoring and Performance

```javascript
// Get memory usage in MBfunction getMemoryUsage() {  const used = process.memoryUsage();  return {    rss: `${Math.round(used.rss / 1024 / 1024 * 100) / 100} MB`,    heapTotal: `${Math.round(used.heapTotal / 1024 / 1024 * 100) / 100} MB`,    heapUsed: `${Math.round(used.heapUsed / 1024 / 1024 * 100) / 100} MB`,    external: `${Math.round(used.external / 1024 / 1024 * 100) / 100} MB`  };}// Monitor memory usage every 5 secondssetInterval(() => {  console.log('Memory usage:', getMemoryUsage());}, 5000);
```
```javascript
const startUsage = process.cpuUsage();// Do some CPU-intensive workfor (let i = 0; i < 1000000000; i++) {}const endUsage = process.cpuUsage(startUsage);console.log('CPU usage (user):', endUsage.user / 1000, 'ms');console.log('CPU usage (system):', endUsage.system / 1000, 'ms');
```

* * *

## Key Takeaways

*   **Process Object**: Access system and process information
*   **Process Control**: Start, stop, and manage application lifecycle
*   **Environment Variables**: Configure app behavior across different environments
*   **Child Processes**: Run system commands and other scripts
*   **Error Handling**: Handle uncaught exceptions and rejections
*   **Signals**: Respond to system signals like SIGINT and SIGTERM
*   **PM2**: Essential for production process management
*   **Performance Monitoring**: Track memory and CPU usage

Effective process management is crucial for building reliable and maintainable Node.js applications, especially in production environments.

* * *

* * *