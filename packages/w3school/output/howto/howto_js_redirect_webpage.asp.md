# How TO - Redirect to Another Webpage

* * *

Learn how to redirect to another webpage using JavaScript.

* * *

## Redirect a Webpage

There are a couple of ways to redirect to another webpage with JavaScript. The most popular ones are `location.href` and `location.replace`:

```javascript
// Simulate a mouse click:window.location.href = "http://www.w3schools.com";// Simulate an HTTP redirect:window.location.replace("http://www.w3schools.com");
```

**Note:** The difference between href and replace, is that `replace()` removes the URL of the current document from the document history, meaning that it is not possible to use the "back" button to navigate back to the original document.

**Tip:** For more information about the Location Object, read our [Location Object Reference](https://www.w3schools.com/jsref/obj_location.asp).

* * *

* * *