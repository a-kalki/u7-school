# Node.js Microservices

* * *

## Introduction to Microservices

Microservices is an architectural style that structures an application as a collection of small, loosely coupled services. Each service is:

*   Focused on a single business capability
*   Independently deployable
*   Independently scalable
*   Potentially written in different programming languages
*   Potentially using different data storage technologies

Microservices architecture enables faster development cycles, better scalability, and improved resilience compared to traditional monolithic applications.

* * *

## Monoliths vs Microservices

Aspect

Monolithic Architecture

Microservices Architecture

Structure

Single, unified codebase

Multiple small services

Deployment

Entire application deployed at once

Services deployed independently

Scaling

Entire application must scale together

Individual services can scale independently

Development

Single technology stack

Potentially different technologies per service

Team Structure

Often a single team

Multiple teams, each owning specific services

Complexity

Simpler architecture, complex codebase

Complex architecture, simpler individual codebases

* * *

* * *

## Key Principles

*   **Single Responsibility** - Each microservice should focus on doing one thing well - implementing a single business capability.
*   **Decentralization** - Decentralize everything: governance, data management, and architecture decisions.
*   **Autonomous Services** - Services should be able to change and deploy independently without affecting others.
*   **Domain-Driven Design** - Design services around business domains rather than technical functions.
*   **Resilience** - Services should be designed to handle failure of other services.
*   **Observability** - Implement comprehensive monitoring, logging, and tracing across services.

**Best Practice:** Start with a clear domain model and identify bounded contexts before splitting an application into microservices.

* * *

## Node.js for Microservices

Node.js is particularly well-suited for microservices architecture for several reasons:

*   **Lightweight and Fast** - Node.js has a small footprint and starts quickly, making it ideal for microservices that need to scale rapidly.
*   **Asynchronous and Event-Driven** - Node.js's non-blocking I/O model makes it efficient for handling many concurrent connections between services.
*   **JSON Support** - First-class JSON support makes data exchange between microservices straightforward.
*   **NPM Ecosystem** - The vast package ecosystem provides libraries for service discovery, API gateways, monitoring, and more.

```javascript
// user-service.jsconst express = require('express');const app = express();app.use(express.json());// In-memory user database for demonstrationconst users = [  { id: 1, name: 'John Doe', email: 'john@example.com' },  { id: 2, name: 'Jane Smith', email: 'jane@example.com' }];// Get all usersapp.get('/users', (req, res) => {  res.json(users);});// Get user by IDapp.get('/users/:id', (req, res) => {  const user = users.find(u => u.id === parseInt(req.params.id));  if (!user) return res.status(404).json({ message: 'User not found' });  res.json(user);});// Create a new userapp.post('/users', (req, res) => {  const newUser = {    id: users.length + 1,    name: req.body.name,    email: req.body.email  };  users.push(newUser);  res.status(201).json(newUser);});const PORT = process.env.PORT || 8080;app.listen(PORT, () => {  console.log(`User service running on port ${PORT}`);});
```

* * *

## Service Communication

Microservices need ways to communicate with each other.

There are two fundamental approaches:

### Synchronous Communication

Services directly call each other's APIs, creating a real-time request-response flow:

*   **REST**: Simple, widely used, stateless communication
*   **GraphQL**: Flexible queries with a single endpoint
*   **gRPC**: High-performance RPC framework using Protocol Buffers

```javascript
// order-service.js calling the user-serviceconst axios = require('axios');async function getUserDetails(userId) {  try {    const response = await axios.get(`http://user-service:3001/users/${userId}`);    return response.data;  } catch (error) {    console.error(`Error fetching user ${userId}:`, error.message);    throw new Error('User service unavailable');  }}// Route handler in order serviceapp.post('/orders', async (req, res) => {  const { userId, products } = req.body;    try {    // Get user data from user service    const user = await getUserDetails(userId);        // Check product availability from product service    const productStatus = await checkProductAvailability(products);        if (!productStatus.allAvailable) {      return res.status(400).json({ error: 'Some products are unavailable' });    }        // Create the order    const order = await createOrder(userId, products, user.shippingAddress);        res.status(201).json(order);  } catch (error) {    console.error('Order creation failed:', error);    res.status(500).json({ error: 'Failed to create order' });  }});
```

**Note:** Synchronous communication creates direct dependencies between services.

If the called service is down or slow, it affects the calling service, potentially causing cascading failures.

### Asynchronous Communication

Services communicate through message brokers or event buses without waiting for immediate responses:

*   **Message Queues**: RabbitMQ, ActiveMQ for point-to-point messaging
*   **Pub/Sub**: Kafka, Redis Pub/Sub for publishing messages to multiple subscribers
*   **Event Streaming**: Kafka, AWS Kinesis for handling data streams

```javascript
// order-service.js publishing an eventconst axios = require('axios');async function publishEvent(eventType, data) {  try {    await axios.post('http://event-bus:3100/events', {      type: eventType,      data: data,      source: 'order-service',      timestamp: new Date().toISOString()    });    console.log(`Published event: ${eventType}`);  } catch (error) {    console.error(`Failed to publish event ${eventType}:`, error.message);    // Store failed events for retry    storeFailedEvent(eventType, data, error);  }}// Create an order and publish eventapp.post('/orders', async (req, res) => {  try {    const order = await createOrder(req.body);        // Publish event for other services    await publishEvent('order.created', order);        res.status(201).json(order);  } catch (error) {    res.status(500).json({ error: 'Order creation failed' });  }});
```

### Handling Service Failures

In microservices, you need strategies for handling communication failures:

Pattern

Description

When to Use

Circuit Breaker

Temporarily stops requests to failing services, preventing cascading failures

When services need protection from failing dependencies

Retry With Backoff

Automatically retries failed requests with increasing delays

For transient failures that might resolve quickly

Timeout Pattern

Sets maximum time to wait for responses

To prevent blocking threads on slow services

Bulkhead Pattern

Isolates failures to prevent them from consuming all resources

To contain failures within components

Fallback Pattern

Provides alternative response when a service fails

To maintain basic functionality during failures

```javascript
const CircuitBreaker = require('opossum');// Configure the circuit breakerconst options = {  failureThreshold: 50,        // Open after 50% of requests fail  resetTimeout: 10000,         // Try again after 10 seconds  timeout: 8080,               // Time before request is considered failed  errorThresholdPercentage: 50 // Error percentage to open circuit};// Create a circuit breaker for the user serviceconst getUserDetailsBreaker = new CircuitBreaker(getUserDetails, options);// Add listeners for circuit state changesgetUserDetailsBreaker.on('open', () => {  console.log('Circuit OPEN - User service appears to be down');});getUserDetailsBreaker.on('halfOpen', () => {  console.log('Circuit HALF-OPEN - Testing user service');});getUserDetailsBreaker.on('close', () => {  console.log('Circuit CLOSED - User service restored');});// Use the circuit breaker in the route handlerapp.get('/orders/:orderId', async (req, res) => {  const orderId = req.params.orderId;  const order = await getOrderById(orderId);    try {    // Call the user service through the circuit breaker    const user = await getUserDetailsBreaker.fire(order.userId);    res.json({ order, user });  } catch (error) {    // If the circuit is open or the call fails, return fallback data    console.error('Could not fetch user details:', error.message);    res.json({      order,      user: { id: order.userId, name: 'User details unavailable' }    });  }});  try {    const response = await axios.get(`http://user-service:8080/users/${userId}`);    return response.data;  } catch (error) {    console.error('Error fetching user details:', error.message);    throw new Error('User service unavailable');  }}// Process an orderapp.post('/orders', async (req, res) => {  try {    const { userId, products } = req.body;        // Get user details from the user service    const user = await getUserDetails(userId);        // Create the order    const order = {      id: generateOrderId(),      userId: userId,      userEmail: user.email,      products: products,      total: calculateTotal(products),      createdAt: new Date()    };        // Save order (simplified)    saveOrder(order);        res.status(201).json(order);  } catch (error) {    res.status(500).json({ error: error.message });  }});
```

### Asynchronous Communication

Services communicate through message brokers or event buses:

*   **Message Queues**: RabbitMQ, ActiveMQ
*   **Streaming Platforms**: Apache Kafka, AWS Kinesis
*   **Event Buses**: Redis Pub/Sub, NATS

```javascript
// order-service.js publishing an eventconst amqp = require('amqplib');async function publishOrderCreated(order) {  try {    const connection = await amqp.connect('amqp://localhost');    const channel = await connection.createChannel();        const exchange = 'order_events';    await channel.assertExchange(exchange, 'topic', { durable: true });        const routingKey = 'order.created';    const message = JSON.stringify(order);        channel.publish(exchange, routingKey, Buffer.from(message));    console.log(`Published order created event for order ${order.id}`);        setTimeout(() => connection.close(), 500);  } catch (error) {    console.error('Error publishing event:', error);  }}// notification-service.js consuming the eventasync function setupOrderCreatedConsumer() {  const connection = await amqp.connect('amqp://localhost');  const channel = await connection.createChannel();    const exchange = 'order_events';  await channel.assertExchange(exchange, 'topic', { durable: true });    const queue = 'notification_service_orders';  await channel.assertQueue(queue, { durable: true });  await channel.bindQueue(queue, exchange, 'order.created');    channel.consume(queue, (msg) => {    if (msg) {      const order = JSON.parse(msg.content.toString());      console.log(`Sending order confirmation email for order ${order.id}`);      sendOrderConfirmationEmail(order);      channel.ack(msg);    }  });}
```

**Best Practice:** For operations that don't need immediate responses, use asynchronous messaging to improve resilience and reduce coupling between services.

* * *

## API Gateway Pattern

An API Gateway acts as a single entry point for all client requests to a microservices architecture.

### Responsibilities of an API Gateway

*   **Request Routing**: Directs client requests to appropriate services
*   **API Composition**: Aggregates responses from multiple services
*   **Protocol Translation**: Converts between protocols (e.g., HTTP to gRPC)
*   **Authentication & Authorization**: Handles security concerns
*   **Rate Limiting**: Prevents abuse of the API
*   **Monitoring & Logging**: Provides visibility into API usage

```javascript
const express = require('express');const { createProxyMiddleware } = require('http-proxy-middleware');const rateLimit = require('express-rate-limit');const helmet = require('helmet');const app = express();const PORT = 8080;// Add security headersapp.use(helmet());// Apply rate limitingconst apiLimiter = rateLimit({  windowMs: 15 * 60 * 1000, // 15 minutes  max: 100,                // limit each IP to 100 requests per windowMs  message: 'Too many requests from this IP, please try again later'});app.use('/api/', apiLimiter);// Authentication middlewarefunction authenticate(req, res, next) {  const token = req.headers.authorization;  if (!token) {    return res.status(401).json({ error: 'Unauthorized' });  }  // Verify token logic would go here  next();}// Service registry (hardcoded for simplicity)const serviceRegistry = {  userService: 'http://localhost:3001',  productService: 'http://localhost:3002',  orderService: 'http://localhost:3003'};// Define proxy middleware for each serviceconst userServiceProxy = createProxyMiddleware({  target: serviceRegistry.userService,  changeOrigin: true,  pathRewrite: { '^/api/users': '/users' }});const productServiceProxy = createProxyMiddleware({  target: serviceRegistry.productService,  changeOrigin: true,  pathRewrite: { '^/api/products': '/products' }});const orderServiceProxy = createProxyMiddleware({  target: serviceRegistry.orderService,  changeOrigin: true,  pathRewrite: { '^/api/orders': '/orders' }});// Route requests to appropriate servicesapp.use('/api/users', authenticate, userServiceProxy);app.use('/api/products', productServiceProxy);app.use('/api/orders', authenticate, orderServiceProxy);app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));
```

**Best Practice:** Use a dedicated API Gateway like **Kong**, **Netflix Zuul**, or cloud solutions like **AWS API Gateway** in production environments instead of building your own.

* * *

## Service Discovery

Service discovery enables microservices to find and communicate with each other dynamically without hardcoded endpoints.

### Service Discovery Methods

Method

Description

Client-Side Discovery

Clients query a service registry to find service locations and load balance requests themselves

Server-Side Discovery

Clients call a router/load balancer which handles discovering service instances

DNS-Based Discovery

Services are discovered via DNS SRV records or similar technologies

```javascript
const axios = require('axios');// Simple service registry clientclass ServiceRegistry {  constructor(registryUrl) {    this.registryUrl = registryUrl;    this.servicesCache = {};    this.cacheTimeout = 60000; // 1 minute  }  async getService(name) {    // Check cache first    const cachedService = this.servicesCache[name];    if (cachedService && cachedService.expiresAt > Date.now()) {      return this._selectInstance(cachedService.instances);    }    // Fetch from registry if not in cache or expired    try {      const response = await axios.get(`${this.registryUrl}/services/${name}`);      const instances = response.data.instances;      if (!instances || instances.length === 0) {        throw new Error(`No instances found for service: ${name}`);      }      // Update cache      this.servicesCache[name] = {        instances,        expiresAt: Date.now() + this.cacheTimeout      };      return this._selectInstance(instances);    } catch (error) {      console.error(`Error fetching service ${name}:`, error.message);      throw new Error(`Service discovery failed for ${name}`);    }  }  // Simple round-robin load balancing  _selectInstance(instances) {    if (!instances._lastIndex) {      instances._lastIndex = 0;    } else {      instances._lastIndex = (instances._lastIndex + 1) % instances.length;    }    return instances[instances._lastIndex];  }}// Usage exampleconst serviceRegistry = new ServiceRegistry('http://registry:8500/v1');async function callUserService(userId) {  try {    const serviceInstance = await serviceRegistry.getService('user-service');    const response = await axios.get(`${serviceInstance.url}/users/${userId}`);    return response.data;  } catch (error) {    console.error('Error calling user service:', error.message);    throw error;  }}
```

### Popular Service Discovery Tools

*   **Consul**: Service discovery and configuration
*   **etcd**: Distributed key-value store
*   **ZooKeeper**: Centralized service for configuration and synchronization
*   **Eureka**: REST-based service discovery for the AWS cloud
*   **Kubernetes Service Discovery**: Built-in service discovery for Kubernetes

* * *

## Data Management Strategies

Managing data in a microservices architecture requires different approaches than monolithic applications.

### Database Per Service

Each microservice has its own dedicated database, ensuring loose coupling and independent scaling.

**Note:** The Database Per Service pattern allows each service to choose the most appropriate database technology for its needs (SQL, NoSQL, Graph DB, etc.).

### Distributed Transactions

Maintaining data consistency across services without ACID transactions requires special patterns:

#### Saga Pattern

A sequence of local transactions where each transaction updates data within a single service. Each local transaction publishes an event that triggers the next transaction.

```javascript
// In order-service.jsasync function createOrder(orderData) {  try {    // Start the saga - create order    const order = await orderRepository.create(orderData);    // Publish event to trigger the next step in the saga    await eventBus.publish('order.created', { orderId: order.id, ...orderData });    return order;  } catch (error) {    console.error('Failed to create order:', error);    throw error;  }}// In payment-service.jsasync function processPayment(event) {  const { orderId, userId, amount } = event.data;  try {    // Process payment    const payment = await paymentProcessor.charge(userId, amount, `Order ${orderId}`);    // Publish success event    await eventBus.publish('payment.succeeded', {      orderId,      paymentId: payment.id    });  } catch (error) {    // Publish failure event to trigger compensation    await eventBus.publish('payment.failed', {      orderId,      reason: error.message    });  }}// Compensating transaction in order-service.jsasync function handlePaymentFailure(event) {  const { orderId, reason } = event.data;  // Update order status to 'payment-failed'  await orderRepository.updateStatus(orderId, 'payment-failed', reason);  // Notify customer about payment failure  const order = await orderRepository.findById(orderId);  await notificationService.notifyCustomer(order.userId, `Payment failed for order ${orderId}: ${reason}`);}
```

#### Event Sourcing and CQRS

Event Sourcing stores all changes to application state as a sequence of events. Command Query Responsibility Segregation (CQRS) separates read and write operations.

```javascript
// Event storeclass EventStore {  constructor() {    this.events = [];  }  append(aggregateId, eventType, eventData) {    const event = {      id: this.events.length + 1,      timestamp: new Date().toISOString(),      aggregateId,      type: eventType,      data: eventData    };    this.events.push(event);    this.publishEvent(event);    return event;  }  getEventsForAggregate(aggregateId) {    return this.events.filter(event => event.aggregateId === aggregateId);  }  publishEvent(event) {    // Publish to subscribers/event bus    console.log(`Event published: ${event.type}`);  }}// Order aggregateclass Order {  constructor(eventStore) {    this.eventStore = eventStore;  }  createOrder(orderId, userId, items) {    this.eventStore.append(orderId, 'OrderCreated', {      userId,      items,      status: 'created'    });  }  addItem(orderId, item) {    this.eventStore.append(orderId, 'ItemAdded', { item });  }  removeItem(orderId, itemId) {    this.eventStore.append(orderId, 'ItemRemoved', { itemId });  }  submitOrder(orderId) {    this.eventStore.append(orderId, 'OrderSubmitted', {      status: 'submitted',      submittedAt: new Date().toISOString()    });  }  // Rebuild the current state from events  getOrder(orderId) {    const events = this.eventStore.getEventsForAggregate(orderId);    if (events.length === 0) return null;    let order = { id: orderId, items: [] };    for (const event of events) {      switch (event.type) {        case 'OrderCreated':          order = { ...order, ...event.data };          break;        case 'ItemAdded':          order.items.push(event.data.item);          break;        case 'ItemRemoved':          order.items = order.items.filter(item => item.id !== event.data.itemId);          break;        case 'OrderSubmitted':          order.status = event.data.status;          order.submittedAt = event.data.submittedAt;          break;      }    }    return order;  }}
```

* * *

## Microservice Patterns

Several design patterns help solve common challenges in microservices architectures:

### API Gateway

A single entry point for all client requests that routes to the appropriate services.

```javascript
// Basic API Gateway with Expressconst express = require('express');const { createProxyMiddleware } = require('http-proxy-middleware');const app = express();// Authentication middlewareapp.use('/api', (req, res, next) => {  const authHeader = req.headers.authorization;  if (!authHeader) {    return res.status(401).json({ message: 'Authentication required' });  }  // Validate token (simplified)  next();});// Route to servicesapp.use('/api/users', createProxyMiddleware({  target: 'http://user-service:8080',  pathRewrite: { '^/api/users': '/users' }}));app.use('/api/orders', createProxyMiddleware({  target: 'http://order-service:3001',  pathRewrite: { '^/api/orders': '/orders' }}));app.listen(8000, () => {  console.log('API Gateway running on port 8000');});
```

### Circuit Breaker

Prevents cascading failures by failing fast when a service is unresponsive.

### Service Discovery

Allows services to find and communicate with each other without hardcoded locations.

### Saga Pattern

Manages distributed transactions across multiple services.

### CQRS (Command Query Responsibility Segregation)

Separates read and write operations for better performance and scalability.

### Bulkhead Pattern

Isolates failures to prevent them from cascading throughout the system.

**Advanced Tip:** Consider using a service mesh like Istio or Linkerd to handle service-to-service communication, including traffic management, security, and observability.

* * *

## Deployment Strategies

Microservices benefit from modern deployment approaches:

### Containerization

Docker containers provide consistent environments for each microservice.

```javascript
FROM node:16-alpineWORKDIR /appCOPY package*.json ./RUN npm ci --only=productionCOPY . .EXPOSE 8080CMD ["node", "user-service.js"]
```

### Orchestration

Tools like Kubernetes automate deployment, scaling, and management of containerized services.

```javascript
apiVersion: apps/v1kind: Deploymentmetadata:  name: user-servicespec:  replicas: 3  selector:    matchLabels:      app: user-service  template:    metadata:      labels:        app: user-service    spec:      containers:      - name: user-service        image: my-registry/user-service:latest        ports:        - containerPort: 8080        env:        - name: DB_HOST          value: mongodb-service        resources:          limits:            cpu: "0.5"            memory: "512Mi"          requests:            cpu: "0.2"            memory: "256Mi"
```

### Continuous Deployment

CI/CD pipelines automate testing and deployment of individual services.

### Infrastructure as Code

Tools like Terraform or AWS CloudFormation define infrastructure in a declarative way.

**Best Practice:** Use blue-green or canary deployment strategies to minimize downtime and risk when updating microservices.

* * *

## Advanced Microservice Patterns

### 1\. Circuit Breaker Pattern

Prevent cascading failures when services are down:

```javascript
// circuit-breaker.jsclass CircuitBreaker {  constructor(request, options = {}) {    this.request = request;    this.state = 'CLOSED';    this.failureCount = 0;    this.successCount = 0;    this.nextAttempt = Date.now();    // Configurable thresholds    this.failureThreshold = options.failureThreshold || 5;    this.successThreshold = options.successThreshold || 2;    this.timeout = options.timeout || 10000; // 10 seconds  }  async fire() {    if (this.state === 'OPEN') {      if (this.nextAttempt <= Date.now()) {        this.state = 'HALF';      } else {        throw new Error('Circuit is OPEN');      }    }    try {      const response = await this.request();      return this.success(response);    } catch (err) {      return this.fail(err);    }  }  success(response) {    if (this.state === 'HALF') {      this.successCount++;      if (this.successCount > this.successThreshold) {        this.close();      }    }    this.failureCount = 0;    return response;  }  fail(err) {    this.failureCount++;    if (this.failureCount >= this.failureThreshold) {      this.open();    }    return err;  }  open() {    this.state = 'OPEN';    this.nextAttempt = Date.now() + this.timeout;  }  close() {    this.state = 'CLOSED';    this.failureCount = 0;    this.successCount = 0;    this.nextAttempt = 0;  }}module.exports = CircuitBreaker;
```

### 2\. Saga Pattern

Manage distributed transactions across microservices:

```javascript
// order-saga.jsclass OrderSaga {  constructor(orderId) {    this.orderId = orderId;    this.steps = [];    this.compensations = [];  }  addStep(execute, compensate) {    this.steps.push(execute);    this.compensations.unshift(compensate);    return this;  }  async execute() {    const executedSteps = [];    try {      for (const [index, step] of this.steps.entries()) {        await step();        executedSteps.push(index);      }      return { success: true };    } catch (error) {      console.error('Saga execution failed, compensating...', error);      await this.compensate(executedSteps);      return { success: false, error };    }  }  async compensate(executedSteps) {    for (const stepIndex of executedSteps) {      try {        await this.compensations[stepIndex]();      } catch (compError) {        console.error('Compensation failed:', compError);      }    }  }}// Example usageconst orderSaga = new OrderSaga('order-123')  .addStep(    () => orderService.createOrder({ id: 'order-123', items: ['item1', 'item2'] }),    () => orderService.cancelOrder('order-123')  )  .addStep(    () => paymentService.processPayment('order-123', 100.00),    () => paymentService.refundPayment('order-123')  );orderSaga.execute();
```

* * *

## Microservices Security

### 1\. Service-to-Service Authentication

```javascript
// auth-middleware.jsconst jwt = require('jsonwebtoken');const authenticateService = (req, res, next) => {  const authHeader = req.headers.authorization;  if (!authHeader) {    return res.status(401).json({ message: 'No token provided' });  }  const token = authHeader.split(' ')[1];  try {    const decoded = jwt.verify(token, process.env.JWT_SECRET);    if (decoded.iss !== 'auth-service') {      return res.status(403).json({ message: 'Invalid token issuer' });    }    // Attach service info to request    req.service = {      id: decoded.sub,      name: decoded.serviceName,      permissions: decoded.permissions || []    };    next();  } catch (error) {    return res.status(401).json({ message: 'Invalid or expired token' });  }};module.exports = authenticateService;
```

### 2\. Rate Limiting

```javascript
// rate-limiter.jsconst rateLimit = require('express-rate-limit');const RedisStore = require('rate-limit-redis');const { createClient } = require('redis');// Create Redis clientconst redisClient = createClient({  url: process.env.REDIS_URL});// Initialize rate limiterconst apiLimiter = rateLimit({  windowMs: 15 * 60 * 1000, // 15 minutes  max: 100, // Limit each IP to 100 requests per window  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers  store: new RedisStore({    sendCommand: (...args) => redisClient.sendCommand(args)  }),  handler: (req, res) => {    res.status(429).json({      message: 'Too many requests, please try again later.'    });  }});module.exports = apiLimiter;
```

* * *

## Monitoring and Observability

### 1\. Distributed Tracing with OpenTelemetry

```javascript
// tracing.jsconst { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');const { Resource } = require('@opentelemetry/resources');const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');const { BatchSpanProcessor } = require('@opentelemetry/sdk-trace-base');const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');const { registerInstrumentations } = require('@opentelemetry/instrumentation');const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');// Configure the tracer providerconst provider = new NodeTracerProvider({  resource: new Resource({    [SemanticResourceAttributes.SERVICE_NAME]: 'user-service',    'service.version': '1.0.0',  }),});// Configure Jaeger exporterconst exporter = new JaegerExporter({  endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',});// Add the exporter to the providerprovider.addSpanProcessor(new BatchSpanProcessor(exporter));// Initialize the OpenTelemetry APIs to use the NodeTracerProviderprovider.register();// Register instrumentationsregisterInstrumentations({  instrumentations: [    new HttpInstrumentation(),    new ExpressInstrumentation(),  ],  tracerProvider: provider,});console.log('Tracing initialized');
```

### 2\. Structured Logging

```javascript
// logger.jsconst winston = require('winston');const { combine, timestamp, json } = winston.format;const logger = winston.createLogger({  level: process.env.LOG_LEVEL || 'info',  format: combine(    timestamp(),    json()  ),  defaultMeta: {    service: 'user-service',    environment: process.env.NODE_ENV || 'development',  },  transports: [    new winston.transports.Console(),    // Add other transports like file, ELK, etc.  ],});// Add request ID to logslogger.child = function(opts) {  return new Proxy(logger, {    get(target, property, receiver) {      if (property === 'write') {        return (...args) => {          const originalMeta = args[args.length - 1] || {};          args[args.length - 1] = { ...opts, ...originalMeta };          return logger[property](...args);        };      }      return Reflect.get(target, property, receiver);    },  });};module.exports = logger;
```

* * *

* * *