# Node.js Events

* * *

## Core Concepts of Events in Node.js

Every action on a computer is an event, like when a connection is made or a file is opened.

Objects in Node.js can fire events, like the readStream object fires events when opening and closing a file:

```javascript
let fs = require('fs');let rs = fs.createReadStream('./demofile.txt');rs.on('open', function () {  console.log('The file is open');});
```

* * *

## Getting Started with Events in Node.js

Node.js uses an event-driven architecture where objects called "emitters" emit named events that cause function objects ("listeners") to be called.

```javascript
// Import the events moduleconst EventEmitter = require('events');// Create an event emitter instanceconst myEmitter = new EventEmitter();// Register an event listenermyEmitter.on('greet', () => {  console.log('Hello there!');});// Emit the eventmyEmitter.emit('greet'); // Outputs: Hello there!
```

* * *

## EventEmitter Class

The `EventEmitter` class is fundamental to Node.js's event-driven architecture.

It provides the ability to create and handle custom events.

### Creating an Event Emitter

To use the EventEmitter, you need to create an instance of it:

```javascript
let events = require('events');let eventEmitter = new events.EventEmitter();
```

* * *

* * *

## The EventEmitter Object

You can assign event handlers to your own events with the EventEmitter object.

In the example below we have created a function that will be executed when a "scream" event is fired.

To fire an event, use the `emit()` method.

```javascript
let events = require('events');let eventEmitter = new events.EventEmitter();//Create an event handler:let myEventHandler = function () {  console.log('I hear a scream!');}//Assign the event handler to an event:eventEmitter.on('scream', myEventHandler);//Fire the 'scream' event:eventEmitter.emit('scream');
```

* * *

## Common EventEmitter Patterns

### 1\. Passing Arguments to Event Handlers

```javascript
const EventEmitter = require('events');const emitter = new EventEmitter();// Emit event with argumentsemitter.on('userJoined', (username, userId) => {  console.log(`${username} (${userId}) has joined the chat`);});emitter.emit('userJoined', 'JohnDoe', 42);// Outputs: JohnDoe (42) has joined the chat
```

### 2\. Handling Events Only Once

```javascript
const EventEmitter = require('events');const emitter = new EventEmitter();// This listener will be called only onceemitter.once('connection', () => {  console.log('First connection established');});emitter.emit('connection'); // This will trigger the listeneremitter.emit('connection'); // This won't trigger the listener again
```

### 3\. Error Handling

```javascript
const EventEmitter = require('events');const emitter = new EventEmitter();// Always handle 'error' eventsemitter.on('error', (err) => {  console.error('An error occurred:', err.message);});// This will trigger the error handleremitter.emit('error', new Error('Something went wrong'));
```

* * *

## Best Practices

```javascript
// Good practice: Always listen for 'error' eventsmyEmitter.on('error', (err) => {  console.error('Error in event emitter:', err);});
```
```javascript
// Instead of anonymous functionsfunction handleData(data) {  console.log('Received data:', data);}myEmitter.on('data', handleData);
```
```javascript
// Add a listenerconst listener = () => console.log('Event occurred');myEmitter.on('event', listener);// Later, remove the listener when no longer neededmyEmitter.off('event', listener);
```

* * *

* * *