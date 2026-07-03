# HTML Web Workers API

* * *

A web worker is an external JavaScript file that runs in the background, without affecting the performance of the page.

* * *

## What is a Web Worker?

When executing scripts in an HTML page, the page becomes unresponsive until the script is finished.

A web worker is an external JavaScript file that runs in the background, independently of other scripts, without affecting the performance of the page. You can continue to do whatever you want: clicking, selecting things, etc., while the web worker runs in the background.

Web workers are useful for heavy code that can't be run on the main thread, without causing long tasks that make the page unresponsive.

* * *

## Browser Support

The numbers in the table specify the first browser version that fully support the Web Workers API.

API

Web Workers

4.0

10.0

3.5

4.0

11.5

* * *

## Web Workers API Example

The example below creates a simple web worker that count numbers in the background:

```javascript

```

**Note:** Normally web workers are not used for such simple scripts, but for more CPU intensive tasks!

* * *

## Check Web Worker API Support

Before using web worker, we can quickly check browser support:

```javascript
<script>const x = document.getElementById("result");if(typeof(Worker) !== "undefined") {  x.innerHTML = "Your browser support Web Workers!";} else {  x.innerHTML = "Sorry, your browser does not support Web Workers.";}</script>
```

* * *

* * *

## Create a .js Web Worker File

Now, let's create a web worker in an external JavaScript file.

Here we create a script that counts. The script is stored in the "demo\_workers.js" file:

var i = 0;  
  
function timedCount() {  
  i = i + 1;  
  postMessage(i);  
  setTimeout("timedCount()",500);  
}  
  
timedCount();

**Note:** The important part of the code above is the `postMessage()` method - which is used to post messages back to the HTML page.

* * *

## Create a Web Worker Object

Once we have created the .js web worker file, we can call it from an HTML page.

The following lines checks if a worker (w) already exists, if not - it creates a new web worker object and points to the .js file: "demo\_workers.js":

if (typeof(w) == "undefined") {  
  w = new Worker("demo\_workers.js");  
}

Then we can SEND and RETRIEVE messages from the web worker.

Data is sent between web workers and the main thread via a system of messages - both sides send their messages using the `postMessage()` method, and respond to messages via the `onmessage` event handler.

Add an `onmessage` event listener to the web worker object.

w.onmessage = function(event){  
  document.getElementById("result").innerHTML = event.data;  
};

When the web worker in the .js posts a message, the code within the event listener is executed. The data from the web worker is stored in `event.data`.

* * *

## Terminate a Web Worker

When a web worker object is created, it will continue to listen for messages until it is terminated.

To terminate a web worker object, and free browser/computer resources, use the `terminate()` method:

w.terminate();

* * *

## Reuse the Web Worker

If you set the web worker variable to undefined, after it has been terminated, you can reuse the worker/code:

w = undefined;

* * *

## Full Web Worker Example

We have already seen the Web Worker code in the .js file.

Below is the full code for the HTML page:

```javascript
<!DOCTYPE html><html><body><p>Count numbers: <output id="result"></output></p><button onclick="startWorker()">Start Worker</button><button onclick="stopWorker()">Stop Worker</button><script>let w;function startWorker() {  const x = document.getElementById("result");  if (typeof(Worker) !== "undefined") {    if (typeof(w) == "undefined") {      w = new Worker("demo_workers.js");    }    w.onmessage = function(event) {      x.innerHTML = event.data;    };  } else {    x.innerHTML = "Sorry! No Web Worker support.";  }}function stopWorker() {  w.terminate();  w = undefined;}</script></body></html>
```

* * *

## Web Workers and the DOM

Since web workers are in external .js files, they do not have access to the following JavaScript objects:

*   The window object
*   The document object
*   The parent object

* * *