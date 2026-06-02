# How TO - Get Iframe Elements

* * *

Get an element from within an iframe with JavaScript.

* * *

Click the button to hide the first H1 element in the iframe (another document).

Hide H1 Element

* * *

## Get Element in Iframe

Get the first <h1> element inside the iframe and hide it:

```javascript
var iframe = document.getElementById("myFrame");var elmnt = iframe.contentWindow.document.getElementsByTagName("H1")[0];elmnt.style.display = "none";
```

* * *

* * *