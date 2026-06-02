# Node.js Express.js

* * *

## What is Express.js?

Express.js (or simply Express) is the most popular Node.js web application framework, designed for building web applications and APIs.

It's often called the de facto standard server framework for Node.js.

**Key Characteristics:**

*   Minimal and flexible
*   Unopinionated (you decide how to structure your app)
*   Lightweight and fast
*   Extensible through middleware
*   Huge ecosystem of plugins and extensions

### Why Choose Express.js?

Express provides a thin layer of fundamental web application features without obscuring Node.js features.

It offers:

*   A robust routing system
*   HTTP helpers (redirection, caching, etc.)
*   Support for middleware to respond to HTTP requests
*   A templating engine for dynamic HTML rendering
*   Error handling middleware

* * *

## Getting Started with Express

Express can be added to any Node.js project. Here's how to get started with a new Express application.

### Prerequisites

Before you begin, make sure you have:

*   Node.js installed (v14.0.0 or later recommended)
*   npm (comes with Node.js) or yarn
*   A code editor (VS Code, WebStorm, etc.)

### Installing Express

To use Express in your Node.js application, you first need to install it:

```javascript
npm install express
```

To install Express and save it in your package.json dependencies:

```javascript
npm install express --save
```

* * *

* * *

## Hello World Example

Let's create a simple "Hello World" application with Express.

This example demonstrates the basic structure of an Express application.

**Key Components:**

*   Importing the Express module
*   Creating an Express application instance
*   Defining routes
*   Starting the server

```javascript
const express = require('express');const app = express();const port = 8080;// Define a route for GET requests to the root URLapp.get('/', (req, res) => {  res.send('Hello World from Express!');});// Start the serverapp.listen(port, () => {  console.log(`Example app listening at http://localhost:${port}`);});
```

Save this code in a file named `app.js` and run it with Node.js:

```javascript
node app.js
```

Then, open your browser and navigate to `http://localhost:8080` to see the "Hello World" message.

* * *

## Basic Routing

Routing refers to how an application responds to client requests to specific endpoints (URIs) using different HTTP methods (GET, POST, PUT, DELETE, etc.).

Express provides simple methods to define routes that correspond to HTTP methods:

*   `app.get()` - Handle GET requests
*   `app.post()` - Handle POST requests
*   `app.put()` - Handle PUT requests
*   `app.delete()` - Handle DELETE requests
*   `app.all()` - Handle all HTTP methods

```javascript
const express = require('express');const app = express();const port = 8080;// Respond to GET request on the root routeapp.get('/', (req, res) => {  res.send('GET request to the homepage');});// Respond to POST request on the root routeapp.post('/', (req, res) => {  res.send('POST request to the homepage');});// Respond to GET request on the /about routeapp.get('/about', (req, res) => {  res.send('About page');});// Catch all other routesapp.all('*', (req, res) => {  res.status(404).send('404 - Page not found');});// Start the serverapp.listen(port, () => {  console.log(`Example app listening at http://localhost:${port}`);});
```

### Route Parameters

Route parameters are named URL segments that capture values at specific positions in the URL.

They are specified in the path with a colon `:` prefix.

**Example:** `/users/:userId/books/:bookId`

In this example, `userId` and `bookId` are route parameters that can be accessed via `req.params`.

```javascript
const express = require('express');const app = express();const port = 8080;// Route with parametersapp.get('/users/:userId/books/:bookId', (req, res) => {  // Access parameters using req.params  res.send(`User ID: ${req.params.userId}, Book ID: ${req.params.bookId}`);});app.listen(port, () => {  console.log(`Example app listening at http://localhost:${port}`);});
```

### Query Parameters

Query parameters are key-value pairs that appear after the `?` in a URL.

They are automatically parsed by Express and available in `req.query`.

**Example URL:** `http://example.com/search?q=express&page=2`

In this URL, `q=express` and `page=2` are query parameters that can be accessed as `req.query.q` and `req.query.page`.

```javascript
const express = require('express');const app = express();const port = 8080;// Route handling query parametersapp.get('/search', (req, res) => {  // Access query parameters using req.query  const { q, category } = req.query;  res.send(`Search query: ${q}, Category: ${category || 'none'}`);});app.listen(port, () => {  console.log(`Example app listening at http://localhost:${port}`);});
```

Access this route with a URL like: `http://localhost:8080/search?q=express&category=framework`

* * *

## Middleware in Express

Middleware functions are the backbone of Express applications.

They have access to:

*   The request object (`req`)
*   The response object (`res`)
*   The next middleware function in the stack (`next`)

Middleware can:

*   Execute any code
*   Modify request and response objects
*   End the request-response cycle
*   Call the next middleware in the stack

### Built-in Middleware

Express includes several useful middleware functions:

*   `express.json()` - Parse JSON request bodies
*   `express.urlencoded()` - Parse URL-encoded request bodies
*   `express.static()` - Serve static files
*   `express.Router()` - Create modular route handlers

```javascript
const express = require('express');const app = express();const port = 8080;// Middleware to parse JSON request bodiesapp.use(express.json());// Middleware to parse URL-encoded request bodiesapp.use(express.urlencoded({ extended: true }));// Middleware to serve static files from a directoryapp.use(express.static('public'));// POST route that uses JSON middlewareapp.post('/api/users', (req, res) => {  // req.body contains the parsed JSON data  console.log(req.body);  res.status(201).json({ message: 'User created', user: req.body });});app.listen(port, () => {  console.log(`Example app listening at http://localhost:${port}`);});
```

* * *

## Error Handling in Express

Error handling in Express is done through special middleware functions that have four arguments:

`(err, req, res, next)`.

**Key Points:**

*   Error-handling middleware must have four arguments
*   It should be defined after other `app.use()` and route calls
*   You can have multiple error-handling middleware functions
*   Use `next(err)` to pass errors to the next error handler

Express comes with a default error handler to catch errors that occur during request processing:

```javascript
const express = require('express');const app = express();const port = 8080;// Route that may throw an errorapp.get('/error', (req, res) => {  // Simulating an error  throw new Error('Something went wrong!');});// Route that uses next(error) for asynchronous codeapp.get('/async-error', (req, res, next) => {  // Simulating an asynchronous operation that fails  setTimeout(() => {    try {      // Something that might fail      const result = nonExistentFunction(); // This will throw an error      res.send(result);    }    catch (error) {      next(error); // Pass errors to Express    }    }, 100);});// Custom error handling middleware// Must have four parameters to be recognized as an error handlerapp.use((err, req, res, next) => {  console.error(err.stack);  res.status(500).send('Something broke!');});app.listen(port, () => {  console.log(`Example app listening at http://localhost:${port}`);});
```

* * *

## Serving Static Files

Express can serve static files like images, CSS, and JavaScript using the built-in `express.static` middleware.

**Best Practices:**

*   Place static files in a dedicated directory (commonly `public` or `static`)
*   Mount the static middleware before your routes
*   Consider using a CDN in production for better performance
*   Set appropriate cache headers for static assets

To serve static files such as images, CSS files, and JavaScript files, use the `express.static` built-in middleware function:

```javascript
const express = require('express');const path = require('path');const app = express();const port = 8080;// Serve static files from the 'public' directoryapp.use(express.static('public'));// You can also specify a virtual path prefixapp.use('/static', express.static('public'));// Using absolute path (recommended)app.use('/assets', express.static(path.join(__dirname, 'public')));app.get('/', (req, res) => {  res.send(`    <h1>Static Files Example</h1>    <img src="/images/logo.png" alt="Logo">    <link rel="stylesheet" href="/css/style.css">    <script src="/js/script.js"></script>  `);});app.listen(port, () => {  console.log(`Example app listening at http://localhost:${port}`);});
```

This assumes you have a directory named `public` in the same directory as your script with subdirectories for images, CSS, and JavaScript files.

* * *

## Routing in Separate Files

For better organization, you can define routes in separate files using Express Router:

### routes/users.js

```javascript
const express = require('express');const router = express.Router();// Middleware specific to this routerrouter.use((req, res, next) => {  console.log('Users Router Time:', Date.now());  next();});// Define routesrouter.get('/', (req, res) => {  res.send('Users home page');});router.get('/:id', (req, res) => {  res.send(`User profile for ID: ${req.params.id}`);});module.exports = router;
```

### routes/products.js

```javascript
const express = require('express');const router = express.Router();// Define routesrouter.get('/', (req, res) => {  res.send('Products list');});router.get('/:id', (req, res) => {  res.send(`Product details for ID: ${req.params.id}`);});module.exports = router;
```

### app.js (main file)

```javascript
const express = require('express');const usersRouter = require('./routes/users');const productsRouter = require('./routes/products');const app = express();const port = 8080;// Use the routersapp.use('/users', usersRouter);app.use('/products', productsRouter);app.get('/', (req, res) => {  res.send('Main application home page');});app.listen(port, () => {  console.log(`Example app listening at http://localhost:${port}`);});
```

* * *

## Template Engines

Express can be configured with template engines to generate dynamic HTML:

```javascript
const express = require('express');const app = express();const port = 8080;// Set the view engine to EJSapp.set('view engine', 'ejs');// Set the directory where templates are locatedapp.set('views', './views');// Route that renders a templateapp.get('/', (req, res) => {  const data = {    title: 'Express Template Example',    message: 'Hello from EJS!',    items: ['Item 1', 'Item 2', 'Item 3']  };  // Renders the views/index.ejs template  res.render('index', data);});app.listen(port, () => {  console.log(`Example app listening at http://localhost:${port}`);});
```

To use this example, you'll need to install the EJS template engine:

```javascript
npm install ejs
```

And create a file at `views/index.ejs`:

```javascript
<!DOCTYPE html><html><head>  <title><%= title %></title></head><body>  <h1><%= title %></h1>  <p><%= message %></p>  <h2>Items:</h2>  <ul>    <% items.forEach(function(item) { %>      <li><%= item %></li>    < % }); %>  </ul></body></html>
```

* * *

## Building a RESTful API

Express is commonly used to build RESTful APIs. That is covered in our [Node.js Express REST API](nodejs_rest_api.asp.html) chapter.

* * *

## Express Application Generator

The Express Application Generator is a tool that helps you quickly create an Express application skeleton.

**Key Features:**

*   Creates a well-structured application
*   Sets up a development environment
*   Configures common middleware
*   Includes error handling
*   Supports various template engines

**Installation:** `npm install -g express-generator`

**Usage:** `express --view=pug myapp`

Express provides an application generator tool to quickly create an application skeleton:

```javascript
# Install the generator globallynpm install -g express-generator# Create a new Express applicationexpress --view=ejs myapp# Navigate to the app directorycd myapp# Install dependenciesnpm install# Start the appnpm start
```

This creates an application with the following directory structure:

```javascript
myapp/├── app.js├── bin/│  └── www├── package.json├── public/│  ├── images/│  ├── javascripts/│  └── stylesheets/│    └── style.css├── routes/│  ├── index.js│  └── users.js└── views/  ├── error.ejs  └── index.ejs
```

* * *

## Express.js Best Practices

Follow these best practices to build robust, maintainable Express applications:

*   **Project Structure:** Organize your code by feature or component
*   **Environment Variables:** Use `dotenv` for configuration
*   **Error Handling:** Centralize error handling
*   **Logging:** Use a logging library like `morgan` or `winston`
*   **Security:** Implement security best practices (helmet, rate limiting, etc.)
*   **Validation:** Validate input using libraries like `express-validator`
*   **Testing:** Write tests using `jest`, `mocha`, or similar

### Production Best Practices

When deploying to production, consider these additional practices:

*   Set `NODE_ENV` to "production"
*   Use a process manager like PM2 or Forever
*   Enable compression with `compression` middleware
*   Use a reverse proxy like Nginx
*   Implement proper logging and monitoring
*   Set up proper error tracking

### Security Best Practices

*   Use Helmet to secure your Express apps by setting various HTTP headers
*   Use environment variables for configuration
*   Implement proper error handling
*   Use HTTPS in production
*   Validate user input to prevent injection attacks
*   Set appropriate CORS policies

```javascript
const express = require('express');const helmet = require('helmet');const cors = require('cors');const app = express();// Security middlewareapp.use(helmet());// CORS configurationapp.use(cors({  origin: 'https://example.com',  methods: ['GET', 'POST'],  allowedHeaders: ['Content-Type', 'Authorization']}));// Other middleware and routes// ...
```

### Performance Best Practices

*   Use compression middleware to compress responses
*   Implement proper caching strategies
*   Consider using a reverse proxy (like Nginx) in front of your Express app
*   Use clustering to take advantage of multi-core systems
*   Optimize database queries

* * *

* * *