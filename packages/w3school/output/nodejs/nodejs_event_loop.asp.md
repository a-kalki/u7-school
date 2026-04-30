# Node.js Event Loop

* * *

## What is the Event Loop?

The **event loop** is what makes Node.js non-blocking and efficient.

It handles asynchronous operations by delegating tasks to the system and processing their results through callbacks, allowing Node.js to manage thousands of concurrent connections with a single thread.

* * *

## How the Event Loop Works

Node.js follows these steps to handle operations:

1.  Execute the main script (synchronous code)
2.  Process any microtasks (Promises, process.nextTick)
3.  Execute timers (setTimeout, setInterval)
4.  Run I/O callbacks (file system, network operations)
5.  Process setImmediate callbacks
6.  Handle close events (like socket.on('close'))

```javascript
console.log('First');setTimeout(() => console.log('Third'), 0);Promise.resolve().then(() => console.log('Second'));console.log('Fourth');
```

This demonstrates the execution order:

1.  Sync code runs first ('First', 'Fourth')
2.  Microtasks (Promises) run before the next phase ('Second')
3.  Timers execute last ('Third')

* * *

* * *

## Event Loop Phases

The event loop processes different types of callbacks in this order:

1.  **Timers**: `setTimeout`, `setInterval`
2.  **I/O Callbacks**: Completed I/O operations
3.  **Poll**: Retrieve new I/O events
4.  **Check**: `setImmediate` callbacks
5.  **Close**: Cleanup callbacks (like `socket.on('close')`)

**Note:** Between each phase, Node.js runs microtasks (Promises) and `process.nextTick` callbacks.

```javascript
console.log('1. Start');// Next tick queueprocess.nextTick(() => console.log('2. Next tick'));// Microtask queue (Promise)Promise.resolve().then(() => console.log('3. Promise'));// Timer phasesetTimeout(() => console.log('4. Timeout'), 0);// Check phasesetImmediate(() => console.log('5. Immediate'));console.log('6. End');
```

The output will be:

1\. Start
6. End
2. Next tick
3. Promise
4. Timeout
5. Immediate

This shows the priority order: sync code > nextTick > Promises > Timers > Check phase.

* * *

## Why is the Event Loop Important?

The event loop enables Node.js to handle thousands of concurrent connections with a single thread, making it perfect for:

*   Real-time applications
*   APIs and microservices
*   Data streaming
*   Chat applications

* * *

## Summary

*   Node.js uses an event loop to handle async operations
*   Different types of callbacks have different priorities
*   Microtasks (Promises) run before the next event loop phase
*   This non-blocking model enables high concurrency

* * *

* * *