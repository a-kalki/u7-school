# How TO - Toggle Dark Mode

* * *

Switch between dark and light mode with CSS and JavaScript.

* * *

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_toggle_dark_mode)

* * *

## Toggle Class

##### Step 1) Add HTML:

Use any element that should store the content you want to toggle the design for. In our example, we will use `<body>` for the sake of simplicity:

```javascript
<body>
```

* * *

##### Step 2) Add CSS:

Style the `<body>` element and create a `.dark-mode` class for toggle:

```javascript
body {  padding: 25px;  background-color: white;  color: black;  font-size: 25px;}.dark-mode {  background-color: black;  color: white;}
```

* * *

* * *

##### Step 3) Add JavaScript:

Get the `<body>` element and toggle between the `.dark-mode` class:

```javascript
function myFunction() {  var element = document.body;  element.classList.toggle("dark-mode");}
```

* * *

**Tip:** Also see [How To Add A Class](howto_js_add_class.asp.html).

**Tip:** Learn more about the [classList](https://www.w3schools.com/jsref/prop_element_classlist.asp) property in our JavaScript Reference.