# JavaScript Output

* * *

## JavaScript Display Possibilities

JavaScript can "display" data in different ways:

*   Writing into an HTML element, using `innerHTML` or `innerText`.
*   Writing into the HTML output using `document.write()`.
*   Writing into an alert box, using `window.alert()`.
*   Writing into the browser console, using `console.log()`.

* * *

## Using innerHTML

To access an HTML element, you can use the `document.getElementById(id)` method.

Use the `id` attribute to identify the HTML element.

Then use the `innerHTML` property to change the HTML content of the HTML element:

```javascript
<!DOCTYPE html><html><body><h1>My First Web Page</h1><p>My First Paragraph</p><p id="demo"></p><script>document.getElementById("demo").innerHTML = "<h2>Hello World</h2>";</script></body></html>
```

Changing the innerHTML property of an HTML element is the most common way to display data in HTML.

* * *

## Using innerText

To access an HTML element, use the `document.getElementById(id)` method.

Then use the `innerText` property to change the inner text of the HTML element:

```javascript
<!DOCTYPE html><html><body><h1>My First Web Page</h1><p>My First Paragraph</p><p id="demo"></p><script>document.getElementById("demo").innerText = "Hello World";</script></body></html>
```

Use innerHTML when you want to change an HTML element.

Use innerText when you only want to change the plain text.

* * *

## Using document.write()

For testing purposes, it is convenient to use `document.write()`:

```javascript
<!DOCTYPE html><html><body><h1>My First Web Page</h1><p>My first paragraph.</p><script>document.write(5 + 6);</script></body></html>
```

Using document.write() after an HTML document is loaded, will **delete all existing HTML**:

```javascript
<!DOCTYPE html><html><body><h1>My First Web Page</h1><p>My first paragraph.</p><button type="button" onclick="document.write(5 + 6)">Try it</button></body></html>
```

The document.write() method should only be used for testing.

* * *

* * *

## Using window.alert()

You can use an alert box to display data:

```javascript
<!DOCTYPE html><html><body><h1>My First Web Page</h1><p>My first paragraph.</p><script>window.alert(5 + 6);</script></body></html>
```

You can skip the `window` keyword.

In JavaScript, the window object is the global scope object. This means that variables, properties, and methods by default belong to the window object. This also means that specifying the `window` keyword is optional:

```javascript
<!DOCTYPE html><html><body><h1>My First Web Page</h1><p>My first paragraph.</p><script>alert(5 + 6);</script></body></html>
```

* * *

## Using console.log()

For debugging purposes, you can call the `console.log()` method in the browser to display data.

You will learn more about debugging in a later chapter.

```javascript
<!DOCTYPE html><html><body><script>console.log(5 + 6);</script></body></html>
```

* * *

## JavaScript Print

JavaScript does not have any print object or print methods.

You cannot access output devices from JavaScript.

The only exception is that you can call the `window.print()` method in the browser to print the content of the current window.

```javascript
<!DOCTYPE html><html><body><button onclick="window.print()">Print this page</button></body></html>
```

* * *

* * *

* * *

## Video: JavaScript Output

  [![Tutorial on YouTube](images/yt_logo_rgb_dark.png)

 ![Tutorial on YouTube](images/img_javascript_output.png)](https://youtu.be/we8YhT-NiOA&list=PLP9IO4UYNF0WWmZpE3W33vVPRl2GvjEqz)

* * *