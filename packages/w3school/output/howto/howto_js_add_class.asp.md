# How TO - Add a Class

* * *

Learn how to add a class name to an element with JavaScript.

* * *

Add Class

Click the button to add a class to me!

* * *

## Add Class

##### Step 1) Add HTML:

Add a class name to the div element with id="myDIV" (in this example we use a button to add the class).

```javascript
<button onclick="myFunction()">Try it</button><div id="myDIV">  This is a DIV element.</div>
```

* * *

##### Step 2) Add CSS:

Style the specified class name:

```javascript
.mystyle {  width: 100%;  padding: 25px;  background-color: coral;  color: white;  font-size: 25px;}
```

* * *

* * *

##### Step 3) Add JavaScript:

Get the <div> element with id="myDIV" and add the "mystyle" class to it:

```javascript
function myFunction() {  var element = document.getElementById("myDIV");  element.classList.add("mystyle");}
```

* * *

**Tip:** Also see [How To Toggle A Class](howto_js_toggle_class.asp.html).

**Tip:** Also see [How To Remove A Class](howto_js_remove_class.asp.html).

**Tip:** Learn more about the [classList](https://www.w3schools.com/jsref/prop_element_classlist.asp) property in our JavaScript Reference.

**Tip:** Learn more about the [className](https://www.w3schools.com/jsref/prop_html_classname.asp) property in our JavaScript Reference.