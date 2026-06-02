# HTML Server-Sent Events API

* * *

The Server-Sent Events (SSE) API enables pushing messages/updates from a server to the web page via HTTP connection.

* * *

## Server-Sent Events - One Way Messaging

A server-sent event is when a web page automatically gets messages/updates from a server.

Normally, a web page has to request data from the server, but with server-sent events, the updates are pushed automatically.

Examples: Facebook/Twitter updates, stock market updates, news feeds, sport results, etc.

* * *

## Browser Support

The numbers in the table specify the first browser version that fully support the Server-Sent Events API.

API

SSE

6.0

79.0

6.0

5.0

11.5

* * *

## Receive Server-Sent Event Notifications

The `EventSource` object is used to receive server-sent event notifications:

```javascript
<script>const x = document.getElementById("result");// Check browser support for SSEif(typeof(EventSource) !== "undefined") {  var source = new EventSource("demo_sse.php");  source.onmessage = function(event) {    x.innerHTML += event.data + "<br>";  };} else {  x.innerHTML = "Sorry, no support for server-sent events.";}</script>
```

Example explained:

*   Create a new `EventSource` object, and specify the URL of the page sending the updates (in this example "demo\_sse.php")
*   Each time an update is received, the `onmessage` event occurs
*   When an `onmessage` event occurs, put the received data into the element with id="result"

* * *

## Check Browser Support

In the tryit example above there were some extra lines of code to check browser support for server-sent events:

if(typeof(EventSource) !== "undefined") {  
  // Yes! Server-sent events support!  
  // _Some code....._  
} else {  
  // Sorry! No server-sent events support..  
}

* * *

* * *

## Server-Side Code Example

For the example above to work, you need a server capable of sending data updates (like PHP or ASP).

The server-side event stream syntax is simple. Set the "Content-Type" header to "text/event-stream". Now you can start sending event streams.

Code in PHP (demo\_sse.php):

<?php  
header('Content-Type: text/event-stream');  
header('Cache-Control: no-cache');  
  
$time = date('r');  
echo "data: The server time is: {$time}\\n\\n";  
flush();  
?>

Code in ASP (VB) (demo\_sse.asp):

<%  
Response.ContentType = "text/event-stream"  
Response.Expires = -1  
Response.Write("data: The server time is: " & now())  
Response.Flush()  
%>

Code explained:

*   Set the "Content-Type" header to "text/event-stream"
*   Specify that the page should not cache
*   Output the data to send (**Always** start with "data: ")
*   Flush the output data back to the web page

* * *

## The EventSource Object

In the examples above we used the onmessage event to get messages. But other events are also available:

Events

Description

onopen

When a connection to the server is opened

onmessage

When a message is received

onerror

When an error occurs