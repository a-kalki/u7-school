# Node.js Real-World Examples

* * *

## RESTful API with Express

One of the most common Node.js applications is building RESTful APIs. Here's an example of a simple but practical Todo API with Express:

```javascript
const express = require('express');const app = express();// In-memory data store (in a real app, you would use a database)let todos = [  { id: 1, title: 'Learn Node.js', completed: false },  { id: 2, title: 'Build a REST API', completed: false }];// Middlewareapp.use(express.json());// Log all requestsapp.use((req, res, next) => {  console.log(`${req.method} ${req.url}`);  next();});// GET all todosapp.get('/todos', (req, res) => {  res.json(todos);});// GET a single todoapp.get('/todos/:id', (req, res) => {  const todo = todos.find(t => t.id === parseInt(req.params.id));  if (!todo) return res.status(404).json({ error: 'Todo not found' });  res.json(todo);});// POST a new todoapp.post('/todos', (req, res) => {  if (!req.body.title) {    return res.status(400).json({ error: 'Title is required' });  }    const newTodo = {    id: todos.length > 0 ? Math.max(...todos.map(t => t.id)) + 1 : 1,    title: req.body.title,    completed: req.body.completed || false  };    todos.push(newTodo);  res.status(201).json(newTodo);});// PUT (update) a todoapp.put('/todos/:id', (req, res) => {  const todo = todos.find(t => t.id === parseInt(req.params.id));  if (!todo) return res.status(404).json({ error: 'Todo not found' });    if (req.body.title) todo.title = req.body.title;  if (req.body.completed !== undefined) todo.completed = req.body.completed;    res.json(todo);});// DELETE a todoapp.delete('/todos/:id', (req, res) => {  const index = todos.findIndex(t => t.id === parseInt(req.params.id));  if (index === -1) return res.status(404).json({ error: 'Todo not found' });    const deletedTodo = todos[index];  todos.splice(index, 1);    res.json(deletedTodo);});// Error handling middlewareapp.use((err, req, res, next) => {  console.error(err.stack);  res.status(500).json({ error: 'Something went wrong!' });});// Start the serverconst PORT = process.env.PORT || 8080;app.listen(PORT, () => {  console.log(`Server running on port ${PORT}`);});
```

This example demonstrates a complete CRUD (Create, Read, Update, Delete) API with proper error handling and status codes.

* * *

* * *

## Authentication System

Most applications need authentication. Here's an example of JWT-based authentication in Node.js:

```javascript
const express = require('express');const jwt = require('jsonwebtoken');const bcrypt = require('bcrypt');const app = express();app.use(express.json());// In a real app, use a databaseconst users = [];// Secret key for JWTconst JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';// Register a new userapp.post('/register', async (req, res) => {  try {    const { username, password } = req.body;        // Check if user already exists    if (users.find(u => u.username === username)) {      return res.status(400).json({ error: 'Username already exists' });    }        // Hash the password    const hashedPassword = await bcrypt.hash(password, 10);        // Create new user    const user = {      id: users.length + 1,      username,      password: hashedPassword    };        users.push(user);        res.status(201).json({ message: 'User registered successfully' });  } catch (error) {    res.status(500).json({ error: 'Registration failed' });  }});// Loginapp.post('/login', async (req, res) => {  try {    const { username, password } = req.body;        // Find user    const user = users.find(u => u.username === username);    if (!user) {      return res.status(401).json({ error: 'Invalid credentials' });    }        // Check password    const passwordMatch = await bcrypt.compare(password, user.password);    if (!passwordMatch) {      return res.status(401).json({ error: 'Invalid credentials' });    }        // Generate JWT token    const token = jwt.sign(      { userId: user.id, username: user.username },      JWT_SECRET,      { expiresIn: '1h' }    );        res.json({ token });  } catch (error) {    res.status(500).json({ error: 'Authentication failed' });  }});// Middleware to verify JWT tokenfunction authenticateToken(req, res, next) {  const authHeader = req.headers['authorization'];  const token = authHeader && authHeader.split(' ')[1];    if (!token) return res.status(401).json({ error: 'Authentication required' });    jwt.verify(token, JWT_SECRET, (err, user) => {    if (err) return res.status(403).json({ error: 'Invalid or expired token' });    req.user = user;    next();  });}// Protected route exampleapp.get('/profile', authenticateToken, (req, res) => {  res.json({ user: req.user });});app.listen(8080, () => {  console.log('Authentication server running on port 8080');});
```

* * *

## File Upload Service

Node.js makes it easy to handle file uploads, which is common in many web applications:

```javascript
const express = require('express');const multer = require('multer');const path = require('path');const fs = require('fs');const app = express();app.use(express.json());app.use(express.static('public'));// Configure multer storageconst storage = multer.diskStorage({  destination: (req, file, cb) => {    const uploadDir = './uploads';        // Create directory if it doesn't exist    if (!fs.existsSync(uploadDir)) {      fs.mkdirSync(uploadDir);    }        cb(null, uploadDir);  },  filename: (req, file, cb) => {    // Generate unique filename with original extension    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);    const ext = path.extname(file.originalname);    cb(null, file.fieldname + '-' + uniqueSuffix + ext);  }});// File filter functionconst fileFilter = (req, file, cb) => {  // Accept images and PDFs only  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {    cb(null, true);  } else {    cb(new Error('Unsupported file type'), false);  }};const upload = multer({  storage: storage,  fileFilter: fileFilter,  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit});// Serve upload formapp.get('/', (req, res) => {  res.sendFile(path.join(__dirname, 'public', 'index.html'));});// Single file upload endpointapp.post('/upload/single', upload.single('file'), (req, res) => {  if (!req.file) {    return res.status(400).json({ error: 'No file uploaded' });  }    res.json({    message: 'File uploaded successfully',    file: {      filename: req.file.filename,      originalname: req.file.originalname,      mimetype: req.file.mimetype,      size: req.file.size    }  });});// Multiple file upload endpoint (max 5)app.post('/upload/multiple', upload.array('files', 5), (req, res) => {  if (!req.files || req.files.length === 0) {    return res.status(400).json({ error: 'No files uploaded' });  }    res.json({    message: `${req.files.length} files uploaded successfully`,    files: req.files.map(file => ({      filename: file.filename,      originalname: file.originalname,      mimetype: file.mimetype,      size: file.size    }))  });});// Error handling middlewareapp.use((err, req, res, next) => {  if (err instanceof multer.MulterError) {    // Multer-specific errors    return res.status(400).json({ error: err.message });  } else if (err) {    // Other errors    return res.status(500).json({ error: err.message });  }  next();});app.listen(8080, () => {  console.log('File upload server running on port 8080');});
```

* * *

## Microservice Architecture

Node.js is ideal for building microservices. Here's a simple example of a microservice with health checks and proper separation of concerns:

```javascript
// src/index.jsconst express = require('express');const routes = require('./routes');const errorHandler = require('./middleware/errorHandler');const logger = require('./middleware/logger');const config = require('./config');const app = express();// Middlewareapp.use(express.json());app.use(logger);// Health checkapp.get('/health', (req, res) => {  res.status(200).json({ status: 'ok', service: 'product-catalog', timestamp: new Date() });});// Routesapp.use('/api/products', routes.productRoutes);// Error handlingapp.use(errorHandler);// Start serverapp.listen(config.PORT, () => {  console.log(`Product catalog service running on port ${config.PORT}`);});// Handle graceful shutdownprocess.on('SIGTERM', () => {  console.log('SIGTERM received, shutting down gracefully');  // Close database connections, etc.  process.exit(0);});
```

**Best Practice:** In a real microservice architecture, each service would have its own repository, deployment pipeline, and database.

* * *

## Task Scheduler

Node.js can efficiently handle scheduled tasks and background jobs:

```javascript
const cron = require('node-cron');const nodemailer = require('nodemailer');const express = require('express');const app = express();// Configure mail transporter (this is just an example)const transporter = nodemailer.createTransport({  host: 'smtp.example.com',  port: 587,  secure: false,  auth: {    user: 'user@example.com',    pass: 'password'  }});// Schedule a task to run every day at 9:00 AMcron.schedule('0 9 * * *', async () => {  console.log('Running daily report task');    try {    // Generate report data (in a real app, fetch from database)    const reportData = {      date: new Date().toISOString().split('T')[0],      metrics: {        users: 1250,        orders: 350,        revenue: 12500      }    };        // Send email with report    await transporter.sendMail({      from: 'system@example.com',      to: 'admin@example.com',      subject: `Daily Report - ${reportData.date}`,      html: `        <h1>Daily Report</h1>        <p><strong>Date:</strong> ${reportData.date}</p>        <h2>Key Metrics</h2>        <ul>          <li>Users: ${reportData.metrics.users}</li>          <li>Orders: ${reportData.metrics.orders}</li>          <li>Revenue: $${reportData.metrics.revenue}</li>          </ul>        `    });        console.log('Daily report email sent successfully');  } catch (error) {    console.error('Error sending daily report:', error);  }});// Schedule database backup every Sunday at midnightcron.schedule('0 0 * * 0', () => {  console.log('Running weekly database backup');  // In a real app, you would run a database backup command here});// Clean up temporary files every hourcron.schedule('0 * * * *', () => {  console.log('Cleaning up temporary files');  // In a real app, you would delete old temporary files here});// API to add a one-time jobconst scheduledJobs = new Map();app.use(express.json());app.post('/schedule-job', (req, res) => {  const { id, scheduledTime, task } = req.body;    if (!id || !scheduledTime || !task) {    return res.status(400).json({ error: 'Missing required parameters' });  }    const jobTime = new Date(scheduledTime).getTime();  const currentTime = Date.now();    if (jobTime <= currentTime) {    return res.status(400).json({ error: 'Scheduled time must be in the future' });  }    // Schedule the job  const timeout = setTimeout(() => {    console.log(`Executing job: ${id}`);    // In a real app, use a job queue like Bull to handle the tasks    console.log(`Task: ${task}`);        scheduledJobs.delete(id);  }, jobTime - currentTime);    scheduledJobs.set(id, { timeout, scheduledTime, task });    res.status(201).json({    message: 'Job scheduled successfully',    job: { id, scheduledTime, task }  });});// Start serverapp.listen(8080, () => {  console.log('Task scheduler running on port 8080');});
```

* * *

## Real-time Analytics Dashboard

Track and visualize application metrics in real-time with WebSockets and Chart.js:

```javascript
const express = require('express');const http = require('http');const socketIo = require('socket.io');const { v4: uuidv4 } = require('uuid');const app = express();const server = http.createServer(app);const io = socketIo(server, {  cors: {    origin: '*', // In production, replace with your frontend domain    methods: ['GET', 'POST']  }});// In-memory store for analytics data (use a database in production)const analyticsData = {  pageViews: {},  activeUsers: new Set(),  events: []};// Track page viewsapp.use((req, res, next) => {  const page = req.path;  analyticsData.pageViews[page] = (analyticsData.pageViews[page] || 0) + 1;    // Emit update to all connected clients  io.emit('analytics:update', {    type: 'pageView',    data: { page, count: analyticsData.pageViews[page] }  });    next();});// Track custom eventsapp.post('/track', express.json(), (req, res) => {  const { event, data } = req.body;  const eventId = uuidv4();  const timestamp = new Date().toISOString();    const eventData = { id: eventId, event, data, timestamp };  analyticsData.events.push(eventData);    // Keep only the last 1000 events  if (analyticsData.events.length > 1000) {    analyticsData.events.shift();  }    // Emit event to all connected clients  io.emit('analytics:event', eventData);    res.status(201).json({ success: true, eventId });});// WebSocket connection handlingio.on('connection', (socket) => {  const userId = socket.handshake.query.userId || 'anonymous';  analyticsData.activeUsers.add(userId);    // Send initial data to the newly connected client  socket.emit('analytics:init', {    pageViews: analyticsData.pageViews,    activeUsers: analyticsData.activeUsers.size,    recentEvents: analyticsData.events.slice(-50)  });    // Update all clients about the new active user count  io.emit('analytics:update', {    type: 'activeUsers',    data: analyticsData.activeUsers.size  });    // Handle disconnection  socket.on('disconnect', () => {    analyticsData.activeUsers.delete(userId);    io.emit('analytics:update', {      type: 'activeUsers',      data: analyticsData.activeUsers.size    });  });    // Handle custom events from the client  socket.on('analytics:event', (data) => {    const eventId = uuidv4();    const timestamp = new Date().toISOString();    const eventData = { id: eventId, ...data, timestamp, userId };        analyticsData.events.push(eventData);    if (analyticsData.events.length > 1000) {      analyticsData.events.shift();    }        io.emit('analytics:event', eventData);  });});// API to get analytics dataapp.get('/api/analytics', (req, res) => {  res.json({    pageViews: analyticsData.pageViews,    activeUsers: analyticsData.activeUsers.size,    totalEvents: analyticsData.events.length,    recentEvents: analyticsData.events.slice(-50)  });});// Serve the dashboardapp.use(express.static('public'));const PORT = process.env.PORT || 3000;server.listen(PORT, () => {  console.log(`Analytics server running on port ${PORT}`);  console.log(`Dashboard available at http://localhost:${PORT}/dashboard.html`);});
```

**Note:** For production use, consider persisting analytics data to a database and implementing proper authentication.

* * *

## Best Practices for Real-World Node.js Applications

When building production Node.js applications, follow these best practices:

### Application Structure

*   Use a clear project structure (MVC or similar)
*   Separate business logic from routes
*   Keep configuration in environment variables
*   Use dependency injection where appropriate

### Error Handling

*   Implement global error handling middleware
*   Log errors with proper context
*   Return appropriate HTTP status codes
*   Handle uncaught exceptions and unhandled promises

### Security

*   Always validate and sanitize user input
*   Use HTTPS and secure cookies
*   Implement rate limiting for APIs
*   Keep dependencies updated
*   Use security headers (Helmet.js)

### Performance & Scalability

*   Use compression for HTTP responses
*   Implement proper caching strategies
*   Consider using a cluster or PM2 for multi-core utilization
*   Monitor memory usage and implement garbage collection
*   Use async/await for better readability

**Pro Tip:** For production applications, always include comprehensive monitoring, logging, and alerting to quickly identify and resolve issues.

* * *

* * *