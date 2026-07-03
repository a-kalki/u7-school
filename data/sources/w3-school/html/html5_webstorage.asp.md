# HTML Web Storage API

* * *

HTML Web Storage API; better than cookies.

* * *

## What is HTML Web Storage?

With web storage, applications can store data locally within the user's browser.

Before HTML5, application data had to be stored in cookies, included in every server request. Web storage is more secure, and large amounts of data can be stored locally, without affecting website performance.

Unlike cookies, the storage limit is far larger (at least 5MB) and information is never transferred to the server.

Web storage is per origin (per domain and protocol). All pages, from one origin, can store and access the same data.

* * *

## Web Storage API Objects

Web storage provides two objects for storing data in the browser:

*   `window.localStorage` - stores data with no expiration date (data is not lost when the browser tab is closed)
*   `window.sessionStorage` - stores data for one session (data is lost when the browser tab is closed)

* * *

## Browser Support

The numbers in the table specify the first browser version that fully supports Web Storage.

API

localStorage

4.0

8.0

3.5

4.0

11.5

sessionStorage

4.0

8.0

3.5

4.0

11.5

* * *

## Test Web Storage API Support

Before using web storage, we can quickly check browser support for localStorage and sessionStorage:

```javascript
<script>const x = document.getElementById("result");if (typeof(Storage) !== "undefined") {  x.innerHTML = "Your browser supports Web storage!";} else {  x.innerHTML = "Sorry, no Web storage support!";}</script>
```

* * *

* * *

## The localStorage Object

The `localStorage` object stores the data with no expiration date. The data will not be lost when the browser is closed, and will be available the next day, week, or year.

```javascript
<script>const x = document.getElementById("result");if (typeof(Storage) !== "undefined") {  // Store  localStorage.setItem("lastname", "Smith");  localStorage.setItem("bgcolor", "yellow");  // Retrieve  x.innerHTML = localStorage.getItem("lastname");  x.style.backgroundColor = localStorage.getItem("bgcolor");} else {  x.innerHTML = "Sorry, no Web storage support!";}</script>
```

Example explained:

*   Use the `localStorage.setItem()` method to create name/value pairs
*   Use the `localStorage.getItem()` method to retrieve the values set
*   Retrieve the value of "lastname" and insert it into an element with id="result"
*   Retrieve the value of "bgcolor" and insert it into the style backgroundColor of the element with id="result"

The syntax for removing the "lastname" localStorage item is as follows:

localStorage.removeItem("lastname");

**Note:** Name/value pairs are always stored as strings. Remember to convert them to another format when needed!

* * *

## Counting Clicks with localStorage

The following example counts the number of times a user has clicked a button. In this code the value string is converted to a number to be able to increase the counter:

```javascript
<script>function clickCounter() {  const x = document.getElementById("result");  if (typeof(Storage) !== "undefined") {    if (localStorage.clickcount) {      localStorage.clickcount = Number(localStorage.clickcount)+1;    } else {      localStorage.clickcount = 1;    }    x.innerHTML = "You have clicked the button " + localStorage.clickcount + " time(s)!";  } else {    x.innerHTML = "Sorry, no Web storage support!";  }}</script>
```

* * *

## The sessionStorage Object

The `sessionStorage` object is equal to the `localStorage` object, **except** that it stores the data for only one session! The data is deleted when the user closes the specific browser tab.

### Counting Clicks with sessionStorage

The following example counts the number of times a user has clicked a button, in the current session:

```javascript
<script>function clickCounter() {  const x = document.getElementById("result");  if (typeof(Storage) !== "undefined") {    if (sessionStorage.clickcount) {      sessionStorage.clickcount = Number(sessionStorage.clickcount)+1;    } else {      sessionStorage.clickcount = 1;    }    x.innerHTML = "You have clicked the button " + sessionStorage.clickcount + " time(s) in this session!";  } else {    x.innerHTML = "Sorry, no Web storage support!";  }}</script>
```

* * *