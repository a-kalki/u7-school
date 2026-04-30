# AJAX Introduction

AJAX is a developer's dream, because you can:

*   Read data from a web server - after the page has loaded
*   Update a web page without reloading the page
*   Send data to a web server - in the background

```javascript

```

* * *

## AJAX Example Explained

```javascript
<!DOCTYPE html><html><body><div id="demo">  <h2>Let AJAX change this text</h2>  <button type="button" onclick="loadDoc()">Change Content</button></div></body></html>
```

The HTML page contains a <div> section and a <button>.

The <div> section is used to display information from a server.

The <button> calls a function (if it is clicked).

The function requests data from a web server and displays it:

```javascript
function loadDoc() {  const xhttp = new XMLHttpRequest();  xhttp.onload = function() {    document.getElementById("demo").innerHTML = this.responseText;    }  xhttp.open("GET", "ajax_info.txt", true);  xhttp.send();}
```

* * *

* * *

## What is AJAX?

AJAX = **A**synchronous **J**avaScript **A**nd **X**ML.

AJAX is not a programming language.

AJAX just uses a combination of:

*   A browser built-in `XMLHttpRequest` object (to request data from a web server)
*   JavaScript and HTML DOM (to display or use the data)

AJAX is a misleading name. AJAX applications might use XML to transport data, but it is equally common to transport data as plain text or JSON text.

AJAX allows web pages to be updated asynchronously by exchanging data with a web server behind the scenes. This means that it is possible to update parts of a web page, without reloading the whole page.

* * *

## How AJAX Works

![AJAX](pic_ajax.gif)

*   1\. An event occurs in a web page (the page is loaded, a button is clicked)
*   2\. An XMLHttpRequest object is created by JavaScript
*   3\. The XMLHttpRequest object sends a request to a web server
*   4\. The server processes the request
*   5\. The server sends a response back to the web page
*   6\. The response is read by JavaScript
*   7\. Proper action (like page update) is performed by JavaScript

* * *

## Modern Browsers (Fetch API)

Modern Browsers can use Fetch API instead of the XMLHttpRequest Object.

The Fetch API interface allows web browser to make HTTP requests to web servers.

If you use the XMLHttpRequest Object, Fetch can do the same in a simpler way.