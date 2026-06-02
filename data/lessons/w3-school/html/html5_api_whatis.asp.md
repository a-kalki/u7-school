# HTML - What is a Web API?

* * *

A Web API is a developer's dream.

*   It can extend the functionality of the browser
*   It can greatly simplify complex functions
*   It can provide easy syntax to complex code

* * *

## What is Web API?

API stands for **A**pplication **P**rogramming **I**nterface. An API is some kind of interface that includes a set of functions and subroutines that allow programmers to access specific features or data of an application, operating system or other services.

A Web API is an application programming interface for the Web.

* * *

## HTML APIs

All browsers have a set of built-in Web APIs to support complex operations, and to help accessing data.

Here are some of the main HTML5 APIs:

1\. **[Geolocation API](html5_geolocation.asp.html)** - This API is used to access the current location of a user (with latitude and longitude).

2\. **[Drag and Drop API](html5_draganddrop.asp.html)** - This API enables you to use drag-and-drop features in browsers.

3\. **[Web Storage API](html5_webstorage.asp.html)** - This API has mechanisms to let browsers store key/value pairs (in a more intuitive way than cookies).

4\. **[Web Workers API](html5_webworkers.asp.html)** - This API allows a JavaScript to run in the background, without affecting the performance of the page. Users can continue to do whatever they want: clicking, selecting things, etc., while the web worker runs in the background.

5\. **[Server-Sent Events API](html5_serversentevents.asp.html)** - This API allows a web page to automatically get updates from a server.

6\. **[Canvas API](html5_canvas.asp.html)** - This API lets you draw graphics, on the fly, via JavaScript.

* * *

* * *

## Notes on Using HTML APIs

When implementing an HTML API, you should always:

**Check Browser Capability** - Always check that the target browsers support the API. Always add script or message to be run if a browser does not support it.

**Add Robust Error Handling** - Add robust error handling to take care of scenarios where an API may not function as expected, to ensure a seamless user experience.

**Request User Permission** - When using an API that accesses sensitive data, like the Geolocation API (which will access the user's geographical position), always prompt  the user for consent before proceeding.

* * *

## Third Party APIs

Third party APIs are not built into your browser.

To use these APIs, you will have to download the code from the Web.

Examples:

*   YouTube API - Allows you to display videos on a web site.
*   Twitter API - Allows you to display Tweets on a web site.
*   Facebook API - Allows you to display Facebook info on a web site.