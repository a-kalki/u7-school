# Node.js Logging

* * *

## Why Logging Matters

Effective logging is essential for several reasons:

*   **Debugging:** Understand what's happening inside your application
*   **Troubleshooting:** Diagnose issues in production environments
*   **Monitoring:** Track application health and performance
*   **Auditing:** Record important events for compliance and security
*   **Analytics:** Gather data about application usage and behavior

* * *

## Basic Logging with Console

Node.js provides built-in console methods for basic logging:

```javascript
// Basic loggingconsole.log('Info message');console.error('Error message');console.warn('Warning message');console.debug('Debug message');// Log objectsconst user = { id: 1, name: 'John', roles: ['admin', 'user'] };console.log('User object:', user);// Table output for arrays or objectsconsole.table([  { name: 'John', age: 30, role: 'admin' },  { name: 'Jane', age: 25, role: 'user' },  { name: 'Bob', age: 40, role: 'guest' }]);// Timing operationsconsole.time('operation');// Perform some operations...for (let i = 0; i < 1000000; i++) {  // Do something}console.timeEnd('operation'); // Outputs: operation: 4.269ms// Grouping related logsconsole.group('User Processing');console.log('Loading user data...');console.log('Validating user...');console.log('Updating user profile...');console.groupEnd();// Stack traceconsole.trace('Trace message');
```

### Console Limitations

While the console is convenient, it has significant limitations for production use:

*   No built-in log levels for filtering
*   No log rotation or file management
*   No structured output formats like JSON
*   Limited integration with monitoring systems

**Note:** Console methods are synchronous when outputting to terminals/files and can impact performance if used frequently in production.

* * *

* * *

## Structured Logging

Structured logging formats log messages as data objects (typically JSON) rather than plain text, making them easier to parse, search, and analyze.

### Benefits of Structured Logging

*   Consistent format for machine readability
*   Better searchability and filtering
*   Simplified integration with log aggregation tools
*   Enhanced context with metadata

```javascript
{  "timestamp": "2023-11-28T15:24:39.123Z",  "level": "error",  "message": "Failed to connect to database",  "service": "user-service",  "context": {    "requestId": "req-123-456",    "userId": "user-789",    "databaseHost": "db.example.com"  },  "error": {    "name": "ConnectionError",    "message": "Connection refused",    "stack": "..."  }}
```

* * *

## Popular Node.js Logging Libraries

### Winston

Winston is a versatile logging library with support for multiple transports (outputs):

```javascript
const winston = require('winston');// Create a loggerconst logger = winston.createLogger({  level: 'info',  format: winston.format.json(),  defaultMeta: { service: 'user-service' },  transports: [    // Write logs to a file    new winston.transports.File({ filename: 'error.log', level: 'error' }),    new winston.transports.File({ filename: 'combined.log' }),  ],});// If not in production, also log to the consoleif (process.env.NODE_ENV !== 'production') {  logger.add(new winston.transports.Console({    format: winston.format.simple(),  }));}// Usagelogger.log('info', 'Hello distributed log files!');logger.info('Hello again distributed logs');logger.error('Something went wrong', { additionalInfo: 'error details' });
```

### Custom Winston Formats

```javascript
const winston = require('winston');const { format } = winston;const { combine, timestamp, label, printf } = format;// Custom formatconst myFormat = printf(({ level, message, label, timestamp }) => {  return `${timestamp} [${label}] ${level}: ${message}`;});const logger = winston.createLogger({  format: combine(    label({ label: 'API Service' }),    timestamp(),    myFormat  ),  transports: [    new winston.transports.Console(),    new winston.transports.File({ filename: 'combined.log' })  ]});logger.info('Application started');
```

### Pino

Pino is designed to be a low-overhead logger with optimal performance:

```javascript
const pino = require('pino');// Create a loggerconst logger = pino({  level: 'info',  timestamp: pino.stdTimeFunctions.isoTime,  base: { pid: process.pid, hostname: require('os').hostname() }});// Usagelogger.info('Application started');logger.info({ user: 'john' }, 'User logged in');logger.error({ err: new Error('Connection failed') }, 'Database connection error');
```

### Pino with Express

```javascript
const express = require('express');const pino = require('pino');const pinoHttp = require('pino-http');const app = express();const logger = pino();const httpLogger = pinoHttp({ logger });// Add request logging middlewareapp.use(httpLogger);app.get('/', (req, res) => {  req.log.info('User accessed homepage');  res.send('Hello World!');});app.get('/error', (req, res) => {  req.log.error('Something went wrong');  res.status(500).send('Error!');});app.listen(8080, () => {  logger.info('Server started on port 8080');});
```

### Bunyan

Bunyan is a structured logging library with a CLI for viewing logs:

```javascript
const bunyan = require('bunyan');// Create a loggerconst logger = bunyan.createLogger({  name: 'myapp',  streams: [    {      level: 'info',      stream: process.stdout    },    {      level: 'error',      path: 'error.log'    }  ],  serializers: bunyan.stdSerializers});// Usagelogger.info('Application started');logger.info({ user: 'john' }, 'User logged in');logger.error({ err: new Error('Connection failed') }, 'Database connection error');
```

* * *

## Application Logging Best Practices

### Log Levels

Use appropriate log levels to categorize the importance and urgency of log messages:

*   **error:** Runtime errors, exceptions, and failures that require attention
*   **warn:** Warning conditions that don't stop the application but indicate potential issues
*   **info:** Informational messages about application events and milestones
*   **debug:** Detailed diagnostic information useful during development
*   **trace:** Very detailed debugging information (method entry/exit, variable values)

### What to Log

**DO LOG:**

*   Application startup/shutdown events
*   Authentication and authorization events
*   API requests and responses
*   Database operations and performance metrics
*   Errors and exceptions with context
*   Resource usage and performance metrics
*   Configuration changes

**DON'T LOG:**

*   Passwords, tokens, API keys, or other credentials
*   Personally identifiable information (PII) without proper safeguards
*   Credit card numbers, social security numbers, or other sensitive data
*   Session IDs or cookies
*   Encryption keys

### Contextual Logging

Include relevant context with each log entry to make troubleshooting easier:

```javascript
const winston = require('winston');// Create a base loggerconst logger = winston.createLogger({  level: 'info',  format: winston.format.json(),  transports: [new winston.transports.Console()]});// Create a child logger with request contextfunction createRequestLogger(req) {  return logger.child({    requestId: req.id,    method: req.method,    url: req.url,    ip: req.ip,    userId: req.user ? req.user.id : 'anonymous'  });}// Usage in Express middlewareapp.use((req, res, next) => {  req.id = generateRequestId();  req.logger = createRequestLogger(req);  req.logger.info('Request received');  const start = Date.now();  res.on('finish', () => {    const duration = Date.now() - start;    req.logger.info({      statusCode: res.statusCode,      duration: duration    }, 'Request completed');  });  next();});function generateRequestId() {  return Date.now().toString(36) + Math.random().toString(36).substring(2);}
```

* * *

## Log Management and Analysis

### Log Rotation

Prevent log files from growing too large by implementing log rotation:

```javascript
const winston = require('winston');require('winston-daily-rotate-file');const transport = new winston.transports.DailyRotateFile({  filename: 'application-%DATE%.log',  datePattern: 'YYYY-MM-DD',  zippedArchive: true,  maxSize: '20m',  maxFiles: '14d'});const logger = winston.createLogger({  level: 'info',  format: winston.format.json(),  transports: [    transport,    new winston.transports.Console()// Optional console transport  ]});logger.info('Hello rotated logs');
```

### Centralized Logging

For applications running across multiple servers or containers, centralize your logs for easier analysis:

```javascript
const winston = require('winston');require('winston-elasticsearch');const esTransportOpts = {  level: 'info',  clientOpts: {    node: 'http://localhost:9200'  },  indexPrefix: 'app-logs'};const logger = winston.createLogger({  transports: [    new winston.transports.Elasticsearch(esTransportOpts),    new winston.transports.Console()// Optional console transport  ]});logger.info('This log will go to Elasticsearch');
```

### Popular Log Management Systems

*   **ELK Stack** (Elasticsearch, Logstash, Kibana): Comprehensive logging stack
*   **Graylog**: Centralized log management with a focus on security
*   **Fluentd/Fluent Bit**: Log collection and forwarding
*   **Loki**: Lightweight log aggregation system
*   **Commercial options**: Datadog, New Relic, Splunk, LogDNA, Loggly

* * *

## Logging in Production

### Performance Considerations

*   **Use asynchronous logging** to avoid blocking the event loop
*   **Buffer logs** for better performance
*   **Adjust log levels** to reduce volume in production
*   **Sample high-volume logs** rather than logging every occurrence

### Security Considerations

*   **Sanitize sensitive data** before logging
*   **Protect log files** with appropriate permissions
*   **Use encryption** when transmitting logs
*   **Implement retention policies** for log data
*   **Verify compliance** with relevant regulations (GDPR, HIPAA, etc.)

```javascript
const winston = require('winston');// Custom format to sanitize sensitive dataconst sanitizeFormat = winston.format((info) => {  if (info.user && info.user.password) {    info.user.password = '[REDACTED]';  }  if (info.user && info.user.creditCard) {    info.user.creditCard = '[REDACTED]';  }  if (info.headers && info.headers.authorization) {    info.headers.authorization = '[REDACTED]';  }  return info;});const logger = winston.createLogger({  format: winston.format.combine(    sanitizeFormat(),    winston.format.json()  ),  transports: [    new winston.transports.Console()  ]});// This sensitive data will be sanitized in the logslogger.info({  message: 'User registered',  user: {    name: 'John',    email: 'john@example.com',    password: 'secret123',    creditCard: '4111-1111-1111-1111'  },  headers: {    authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'  }});
```

* * *

## Debugging with Logs

### Debug Module

The `debug` module provides a lightweight way to add conditional debug logging:

```javascript
const debug = require('debug');// Create named debuggersconst dbDebug = debug('app:db');const apiDebug = debug('app:api');const authDebug = debug('app:auth');// UsagedbDebug('Connected to database');apiDebug('API request received at /users');authDebug('User authenticated: %o', { id: 123, roles: ['admin'] });// Enable with environment variable:// DEBUG=app:* node app.js// or// DEBUG=app:db,app:auth node app.js
```

### Correlation IDs

Track requests across multiple services using correlation IDs:

```javascript
const express = require('express');const { v4: uuidv4 } = require('uuid');const winston = require('winston');const app = express();// Create a loggerconst logger = winston.createLogger({  transports: [new winston.transports.Console()],  format: winston.format.combine(    winston.format.timestamp(),    winston.format.json()  )});// Correlation ID middlewareapp.use((req, res, next) => {  // Extract correlation ID from the request header or generate a new one  const correlationId = req.headers['x-correlation-id'] || uuidv4();  // Add it to the response headers  res.setHeader('x-correlation-id', correlationId);  // Add it to the request object  req.correlationId = correlationId;  // Create a request-specific logger  req.logger = logger.child({ correlationId });  req.logger.info({    message: 'Request received',    method: req.method,    url: req.url  });  next();});// Routesapp.get('/', (req, res) => {  req.logger.info('Processing home request');  res.send('Hello World');});app.get('/error', (req, res) => {  req.logger.error('Error occurred in request');  res.status(500).send('Error');});app.listen(8080, () => {  logger.info('Server started on port 8080');});
```

* * *

## Summary

*   Effective logging is crucial for debugging, monitoring, and troubleshooting Node.js applications
*   Use structured logging with JSON format for better searchability and analysis
*   Choose appropriate logging libraries like Winston, Pino, or Bunyan based on your needs
*   Apply best practices: use proper log levels, include context, and protect sensitive data
*   Implement log rotation and centralized logging for production environments
*   Consider performance and security implications when designing your logging strategy
*   Use correlation IDs to track requests through distributed systems

* * *

* * *