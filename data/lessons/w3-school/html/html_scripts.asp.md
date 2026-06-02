# HTML JavaScript

* * *

JavaScript makes HTML pages more dynamic and interactive.

* * *

```javascript

```

* * *

## The HTML <script> Tag

The HTML `<script>` tag is used to define a client-side script (JavaScript).

The `<script>` element either contains script statements, or it points to an external script file through the `src` attribute.

Common uses for JavaScript are image manipulation, form validation, and dynamic changes of content.

To select an HTML element, JavaScript most often uses the `document.getElementById()` method.

This JavaScript example writes "Hello JavaScript!" into an HTML element with id="demo":

```javascript
<script>document.getElementById("demo").innerHTML = "Hello JavaScript!";</script>
```

**Tip:** You can learn much more about JavaScript in our [JavaScript Tutorial](https://www.w3schools.com/js/default.asp).

* * *

## A Taste of JavaScript

Here are some examples of what JavaScript can do:

```javascript
document.getElementById("demo").innerHTML = "Hello JavaScript!";
```
```javascript
document.getElementById("demo").style.fontSize = "25px";document.getElementById("demo").style.color = "red";document.getElementById("demo").style.backgroundColor = "yellow";
```
```javascript
document.getElementById("image").src = "picture.gif";
```

* * *

* * *

## The HTML <noscript> Tag

The HTML `<noscript>` tag defines an alternate content to be displayed to users that have disabled scripts in their browser or have a browser that doesn't support scripts:

```javascript
<script>document.getElementById("demo").innerHTML = "Hello JavaScript!";</script><noscript>Sorry, your browser does not support JavaScript!</noscript>
```

* * *

* * *

## HTML Script Tags

Tag

Description

[<script>](https://www.w3schools.com/tags/tag_script.asp)

Defines a client-side script

[<noscript>](https://www.w3schools.com/tags/tag_noscript.asp)

Defines an alternate content for users that do not support client-side scripts

For a complete list of all available HTML tags, visit our [HTML Tag Reference](https://www.w3schools.com/tags/default.asp).

* * *

## Video: HTML and JavaScript

  [![Tutorial on YouTube](images/yt_logo_rgb_dark.png)

 ![Tutorial on YouTube](images/20_html_javascript.png)](https://youtu.be/uSgcWDkwc3U&list=PLP9IO4UYNF0VdAajP_5pYG-jG2JRrG72s)

* * *