# Web APIs - Introduction

A Web API is a developer's dream.

*   It can extend the functionality of the browser
*   It can greatly simplify complex functions
*   It can provide easy syntax to complex code

## What is Web API?

API stands for **A**pplication **P**rogramming **I**nterface.

A Web API is an application programming interface for the Web.

A Browser API can extend the functionality of a web browser.

A Server API can extend the functionality of a web server.

* * *

## Browser APIs

All browsers have a set of built-in Web APIs to support complex operations, and to help accessing data.

For example, the Geolocation API can return the coordinates of where the browser is located.

```javascript
const myElement = document.getElementById("demo");function getLocation() {  if (navigator.geolocation) {    navigator.geolocation.getCurrentPosition(showPosition);  } else {    myElement.innerHTML = "Geolocation is not supported by this browser.";  }}function showPosition(position) {  myElement.innerHTML = "Latitude: " + position.coords.latitude +  "<br>Longitude: " + position.coords.longitude;}
```

* * *

## Most Important APIs

The most important APIs in HTML/JavaScript development are.

*   **The DOM API** for HTML and XML documents
*   **The Fetch API** for networking
*   **The Web Storage API** for client-side data

These APIs are fundamental to nearly all modern web development.

* * *

## [The DOM API](js_htmldom.asp.html)

The DOM (Document Object Model) is the core API for HTML and XML documents. It provides a structured representation of a webpage, allowing JavaScript to access and manipulate elements, attributes, and content dynamically, creating interactive user interfaces.

* * *

## [The Fetch API](js_api_fetch.asp.html)

The modern standard for making network requests to servers and retrieving resources (like data from a database or a third-party service). It provides a more robust and flexible alternative to older methods like XMLHttpRequest.

* * *

## [Web Storage API](js_api_web_storage.asp.html)

Offers mechanisms (localStorage and sessionStorage) to store key/value pairs of data in the browser more intuitively than cookies, allowing data to persist across sessions or page reloads.

* * *

## [History API](js_api_history.asp.html)

Enables manipulation of the browser's session history, allowing single-page applications (SPAs) to change the URL and provide a seamless navigation experience without full page reloads.

* * *

* * *

## Third Party APIs

Third party APIs are not built into your browser.

To use these APIs, you will have to download the code from the Web.

Examples:

*   YouTube API - Allows you to display videos on a web site.
*   Twitter API - Allows you to display Tweets on a web site.
*   Facebook API - Allows you to display Facebook info on a web site.