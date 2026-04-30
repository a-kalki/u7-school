# How TO - Create a Syntax Highlighter

* * *

Learn how to create and use a Syntax Highlighter.

* * *

## Syntax Highlighter

Code snippets are easier to read when you add some color:

<!DOCTYPE html>  
<html>  
<body>  
  
<h1>Testing an HTML Syntax Highlighter</h2>  
<p>Hello world!</p>  
<a href="https://www.w3schools.com">Back to School</a>  
  
</body>  
</html>

Toggle Syntax Higlighting

* * *

## How To Create a Syntax Highlighter

##### Step 1) Add HTML:

```javascript
<div id="myDiv">&lt;!DOCTYPE html&gt;<br>&lt;html&gt;<br>&lt;body&gt;<br><br>&lt;h1&gt;Testing an HTML Syntax Highlighter&lt;/h2&gt;<br>&lt;p&gt;Hello world!&lt;/p&gt;<br>&lt;a href="https://www.w3schools.com"&gt;Back to School&lt;/a&gt;<br><br>&lt;/body&gt;<br>&lt;/html&gt;</div>
```

##### Step 2) Add JavaScript:

```javascript
w3CodeColor(document.getElementById("myDiv"));function w3CodeColor(elmnt) {  // click "Try it Yourself" to see the JavaScript...}
```

* * *

* * *