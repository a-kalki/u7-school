# How TO - Remove a Class

* * *

Learn how to remove a class name from an element with JavaScript.

* * *

Remove Class

Click the button to remove a class from me!

* * *

## Remove Class

##### Step 1) Add HTML:

In this example, we will use a button to remove the "mystyle" class from the <div> element with id="myDIV":

```javascript
<button onclick="myFunction()">Try it</button><div id="myDIV" class="mystyle">  This is a DIV element.</div>
```

* * *

##### Step 2) Add CSS:

Style the specified class name:

```javascript
.mystyle {  width: 100%;  padding: 25px;  background-color: coral;  color: white;  font-size: 25px;}
```

* * *

* * *

##### Step 3) Add JavaScript:

Get the <div> element with id="myDIV" and remove the "mystyle" class from it:

```javascript
function myFunction() {  var element = document.getElementById("myDIV");  element.classList.remove("mystyle");}
```

* * *

**Tip:** Also see [How To Toggle A Class](howto_js_toggle_class.asp.html).

**Tip:** Also see [How To Add A Class](howto_js_add_class.asp.html).

**Tip:** Learn more about the [classList](https://www.w3schools.com/jsref/prop_element_classlist.asp) property in our JavaScript Reference.

**Tip:** Learn more about the [className](https://www.w3schools.com/jsref/prop_html_classname.asp) property in our JavaScript Reference.