# Node.js EventEmitter Reference

* * *

## EventEmitter Object

The EventEmitter is a module that facilitates communication between objects in Node.js. It's at the core of Node's asynchronous event-driven architecture.

Many of Node's built-in modules inherit from EventEmitter, including HTTP servers, streams, and more.

### Import EventEmitter

```javascript
// Method 1: Using requireconst EventEmitter = require('events');// Method 2: ES6 destructuringconst { EventEmitter } = require('events');
```

* * *

## Creating an EventEmitter

```javascript
const EventEmitter = require('events');// Create a new EventEmitter instanceconst myEmitter = new EventEmitter();// Create a class that extends EventEmitterclass MyEmitter extends EventEmitter {  constructor() {    super();  }}// Instantiate the extended classconst myExtendedEmitter = new MyEmitter();
```

* * *

## EventEmitter Methods

Method

Description

addListener(event, listener)

Adds a listener to the end of the listeners array for the specified event. Alias for `on()`.

emit(event, \[arg1\], \[arg2\], ...)

Synchronously calls each of the listeners registered for the event, in the order they were registered, passing the supplied arguments to each.

eventNames()

Returns an array listing the events for which the emitter has registered listeners.

getMaxListeners()

Returns the current maximum listener value for the EventEmitter, set by `emitter.setMaxListeners(n)` or defaults to `EventEmitter.defaultMaxListeners`.

listenerCount(event)

Returns the number of listeners listening to the specified event.

listeners(event)

Returns a copy of the array of listeners for the specified event.

off(event, listener)

Alias for `removeListener()`.

on(event, listener)

Adds a listener to the end of the listeners array for the specified event.

once(event, listener)

Adds a one-time listener for the event that will be removed after it is triggered once.

prependListener(event, listener)

Adds a listener to the beginning of the listeners array for the specified event.

prependOnceListener(event, listener)

Adds a one-time listener for the event to the beginning of the listeners array that will be removed after it is triggered once.

removeAllListeners(\[event\])

Removes all listeners, or those of the specified event.

removeListener(event, listener)

Removes the specified listener from the listener array for the specified event.

setMaxListeners(n)

Sets the maximum number of listeners that can be added to an EventEmitter instance.

rawListeners(event)

Returns a copy of the array of listeners for the specified event, including any wrappers (like those created by `once()`).

* * *

* * *

## EventEmitter Properties

Property

Description

EventEmitter.defaultMaxListeners

Sets the default maximum number of listeners for all EventEmitter instances. Default is 10.

emitter.errorMonitor

A static symbol that can be used to install a listener for only monitoring 'error' events.

emitter.captureRejections

When true, promise rejections are captured and emitted as 'error' events.

* * *

## Basic EventEmitter Usage

```javascript
const EventEmitter = require('events');const myEmitter = new EventEmitter();// Register an event listenermyEmitter.on('event', () => {  console.log('An event occurred!');});// Emit the eventmyEmitter.emit('event');
```

* * *

## Passing Arguments to Listeners

```javascript
const EventEmitter = require('events');const myEmitter = new EventEmitter();// Event with multiple argumentsmyEmitter.on('status', (code, message) => {  console.log(`Got status: ${code} ${message}`);});// Emit with argumentsmyEmitter.emit('status', 200, 'OK');
```

* * *

## One-time Event Listeners

```javascript
const EventEmitter = require('events');const myEmitter = new EventEmitter();// Add one-time listenermyEmitter.once('onetime', () => {  console.log('This will be called only once');});// First emit - will trigger the listenermyEmitter.emit('onetime');// Second emit - won't trigger the listenermyEmitter.emit('onetime');
```

* * *

## Error Events

```javascript
const EventEmitter = require('events');const myEmitter = new EventEmitter();// Error event handlermyEmitter.on('error', (err) => {  console.error('Error occurred:', err.message);});// Emit an error eventmyEmitter.emit('error', new Error('Something went wrong'));// If no 'error' listener is added, Node will throw and crash// Always add an error handler!
```

* * *

## Getting Event Names and Listeners

```javascript
const EventEmitter = require('events');const myEmitter = new EventEmitter();// Add some listenersmyEmitter.on('event1', () => console.log('Event 1'));myEmitter.on('event2', () => console.log('Event 2'));myEmitter.on('event2', () => console.log('Event 2 again'));// Get all event namesconsole.log('Event names:', myEmitter.eventNames());// Get listeners for a specific eventconsole.log('Listeners for event2:', myEmitter.listeners('event2'));// Count listenersconsole.log('Listener count for event2:', myEmitter.listenerCount('event2'));
```

* * *

## Removing Listeners

```javascript
const EventEmitter = require('events');const myEmitter = new EventEmitter();// Define listener function (needed for removal)function listener1() {  console.log('Listener 1 executed');}function listener2() {  console.log('Listener 2 executed');}// Add listenersmyEmitter.on('event', listener1);myEmitter.on('event', listener2);console.log('Listeners before removal:', myEmitter.listenerCount('event'));// Remove a specific listenermyEmitter.removeListener('event', listener1);// or using the alias: myEmitter.off('event', listener1);console.log('Listeners after removal:', myEmitter.listenerCount('event'));// Remove all listeners for an eventmyEmitter.removeAllListeners('event');console.log('Listeners after removeAll:', myEmitter.listenerCount('event'));
```

* * *

## Setting Maximum Listeners

```javascript
const EventEmitter = require('events');// Set the default max listeners for all EventEmitter instancesEventEmitter.defaultMaxListeners = 15;const myEmitter = new EventEmitter();// Set max listeners for a specific instancemyEmitter.setMaxListeners(20);console.log('Default max listeners:', EventEmitter.defaultMaxListeners);console.log('myEmitter max listeners:', myEmitter.getMaxListeners());// Adding more than maxListeners will trigger a warning// The warning helps identify potential memory leaks
```

* * *

## Order of Listeners

```javascript
const EventEmitter = require('events');const myEmitter = new EventEmitter();// Default behavior: listeners execute in order they were addedmyEmitter.on('event', () => console.log('First listener'));myEmitter.on('event', () => console.log('Second listener'));// Prepend a listener (it will execute first)myEmitter.prependListener('event', () => console.log('Prepended listener'));// One-time prepended listenermyEmitter.prependOnceListener('event', () => console.log('Prepended once listener'));// Emit the eventmyEmitter.emit('event');// Output will be:// Prepended once listener// Prepended listener// First listener// Second listener
```

* * *

## Extending EventEmitter

A common pattern in Node.js is to create a class that extends EventEmitter, adding custom functionality:

```javascript
const EventEmitter = require('events');// Custom class that extends EventEmitterclass MyApp extends EventEmitter {  constructor() {    super();    this.name = 'MyApp';  }  process(data) {    // Do some processing    console.log(`Processing data: ${data}`);        // Emit events based on processing results    if (data.length > 10) {      this.emit('large-data', data);    } else {      this.emit('small-data', data);    }        // Emit completion event    this.emit('processed', data);  }}// Create an instanceconst app = new MyApp();// Register event listenersapp.on('large-data', (data) => {  console.log(`Large data detected: ${data.length} bytes`);});app.on('small-data', (data) => {  console.log(`Small data detected: ${data.length} bytes`);});app.on('processed', (data) => {  console.log('Processing completed');});// Use the appapp.process('Hello');app.process('Hello, this is a longer string of data');
```

* * *

## Asynchronous vs. Synchronous

EventEmitter calls all listeners synchronously in the order they were registered. Important for maintaining the expected execution order:

```javascript
const EventEmitter = require('events');const myEmitter = new EventEmitter();// Register listenermyEmitter.on('event', () => {  console.log('Listener executed');});// Emit eventconsole.log('Before emit');myEmitter.emit('event');console.log('After emit');// Output:// Before emit// Listener executed// After emit
```

To run listeners asynchronously, you can use setImmediate() or process.nextTick():

```javascript
const EventEmitter = require('events');const myEmitter = new EventEmitter();// Register async listener using setImmediatemyEmitter.on('async-event', () => {  setImmediate(() => {    console.log('Async listener executed');  });});console.log('Before emit');myEmitter.emit('async-event');console.log('After emit');// Output:// Before emit// After emit// Async listener executed
```

* * *

## Promise Integration

EventEmitter in modern Node.js versions can handle Promises and capture rejections:

```javascript
const EventEmitter = require('events');// Enable capture rejections (Node.js 12.16.0+)const myEmitter = new EventEmitter({ captureRejections: true });// OR set it globally// EventEmitter.captureRejections = true;// Event handler that returns a PromisemyEmitter.on('async-operation', async () => {  // This rejected promise will be captured and converted to an 'error' event  throw new Error('Async operation failed');});// Error handlermyEmitter.on('error', (err) => {  console.error('Caught error:', err.message);});// Trigger the eventmyEmitter.emit('async-operation');
```

* * *

## Real-World Example: HTTP Server

EventEmitter powers many Node.js core modules. Here's how an HTTP server uses events:

```javascript
const http = require('http');// HTTP Server is an EventEmitterconst server = http.createServer();// Listen for 'request' eventsserver.on('request', (request, response) => {  console.log(`Received ${request.method} request for ${request.url}`);  response.writeHead(200, { 'Content-Type': 'text/plain' });  response.end('Hello World\n');});// Listen for 'connection' eventsserver.on('connection', (socket) => {  console.log('New client connection from', socket.remoteAddress);});// Listen for 'close' eventserver.on('close', () => {  console.log('Server closed');});// Listen on port 8080server.listen(8080, () => {  console.log('Server listening on port 8080');});// Later, we can close the server// server.close();
```

* * *

## Common Patterns and Best Practices

### 1\. Always Listen for 'error' Events

If an EventEmitter emits an 'error' event and there are no listeners, Node.js will throw the error and crash the process. Always add error handlers:

```javascript
const EventEmitter = require('events');const myEmitter = new EventEmitter();// Always add error handlersmyEmitter.on('error', (err) => {  console.error('Error occurred:', err);  // Handle the error appropriately});
```

### 2\. Cleanup Listeners to Prevent Memory Leaks

```javascript
const EventEmitter = require('events');const myEmitter = new EventEmitter();function setupHandler() {  const handler = () => console.log('Event handled');    // Add the handler  myEmitter.on('some-event', handler);    // Return a cleanup function  return function cleanup() {    myEmitter.removeListener('some-event', handler);  };}// Set up a handlerconst cleanup = setupHandler();// Later, when no longer neededcleanup();
```

### 3\. Use Named Functions for Removable Listeners

```javascript
// BAD - Cannot remove this listener lateremitter.on('event', () => console.log('Anonymous function'));// GOOD - Can be removed by referencefunction namedHandler() {  console.log('Named function');}emitter.on('event', namedHandler);// Lateremitter.removeListener('event', namedHandler);
```

* * *