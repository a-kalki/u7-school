# How TO - Toggle Class

* * *

Toggle between adding and removing a class name from an element with JavaScript.

* * *

Toggle Class

Click the button to toggle class name!

* * *

## Toggle Class

##### Step 1) Add HTML:

Toggle between adding a class name to the div element with id="myDIV" (in this example we use a button to toggle the class name).

```javascript
<button onclick="myFunction()">Try it</button><div id="myDIV">  This is a DIV element.</div>
```

* * *

##### Step 2) Add CSS:

Add a class name to toggle:

```javascript
.mystyle {  width: 100%;  padding: 25px;  background-color: coral;  color: white;  font-size: 25px;}
```

* * *

* * *

##### Step 3) Add JavaScript:

Get the <div> element with id="myDIV" and toggle between the "mystyle" class:

```javascript
function myFunction() {  var element = document.getElementById("myDIV");  element.classList.toggle("mystyle");}
```

* * *

**Tip:** Also see [How To Add A Class](howto_js_add_class.asp.html).

**Tip:** Also see [How To Remove A Class](howto_js_remove_class.asp.html).

**Tip:** Learn more about the [classList](https://www.w3schools.com/jsref/prop_element_classlist.asp) property in our JavaScript Reference.