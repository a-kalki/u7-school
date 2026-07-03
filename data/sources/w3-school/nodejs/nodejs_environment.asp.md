# Node.js Environment Variables

* * *

## What are Environment Variables?

Environment variables are dynamic named values that can affect how running processes behave on a computer.

They are part of the environment in which a process runs and are used to configure applications without changing the code.

**Key Benefits:**

*   Store configuration separate from code
*   Keep sensitive information out of version control
*   Configure applications differently across environments
*   Change application behavior without code changes

### Common Use Cases

#### Environment Configuration

*   Database connection strings
*   API keys and secrets
*   External service URLs
*   Feature flags

#### Runtime Behavior

*   Logging verbosity
*   Port numbers
*   Timeouts and limits
*   Environment-specific settings

* * *

## Accessing Environment Variables in Node.js

Node.js provides the `process.env` object to access environment variables.

This object contains all the environment variables available to the current process.

### Basic Usage

```javascript
// Access a single environment variableconst nodeEnv = process.env.NODE_ENV || 'development';console.log(`Running in ${nodeEnv} mode`);// Access multiple variables with destructuringconst { PORT = 3000, HOST = 'localhost' } = process.env;console.log(`Server running at http://${HOST}:${PORT}`);// Check if running in productionif (process.env.NODE_ENV === 'production') {  console.log('Production optimizations enabled');  // Enable production features}
```

### Common Built-in Environment Variables

Variable

Description

Example

`NODE_ENV`

Current environment (development, test, production)

`production`

`PORT`

Port number for the server to listen on

`3000`

`PATH`

System path for executable lookup

`/usr/local/bin:/usr/bin`

`HOME`

User's home directory

`/Users/username`

**Note:** Always provide default values when accessing environment variables to prevent `undefined` values in your application.

* * *

* * *

## Setting Environment Variables

There are several ways to set environment variables for your Node.js application, depending on your development workflow and deployment environment.

### 1\. Command Line (Temporary)

Set variables directly in the command line when starting your application:

```javascript
set PORT=3000set NODE_ENV=developmentset DB_HOST=localhostnode app.js
```

### 2\. Using .env Files with dotenv

For development, use a `.env` file to store environment variables locally:

```javascript
npm install dotenv
```

**Important:** Never commit `.env` files to version control. Add `.env` to your `.gitignore` file.

### 3\. Production Environment Variables

In production, set environment variables using your hosting provider's configuration:

```javascript
heroku config:set NODE_ENV=production DATABASE_URL=your_database_url
```

* * *

## Using dotenv for Local Development

The **dotenv** package lets you load environment variables from a `.env` file:

```javascript
# .env fileAPI_KEY=abcdef12345
```

Load the variables in your app:

```javascript
require('dotenv').config();console.log(process.env.API_KEY);
```

Install dotenv with:

```javascript
npm install dotenv
```

* * *

## Summary

Environment variables help you keep sensitive data and configuration out of your code.

Use `process.env` and tools like dotenv to manage them easily in Node.js.

* * *

* * *