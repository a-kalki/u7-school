# How TO - Change a Class

* * *

Learn how to change the class name of an element with JavaScript.

* * *

Change Class

This is a DIV.

* * *

## Change Class

Change the class of a <div> element from "mystyle" to "newone":

```javascript
<div id="myDIV" class="mystyle">This is a DIV element.</div><script>function myFunction() {  const element = document.getElementById("myDIV");  // Get the DIV element  element.classList.remove("mystyle"); // Remove mystyle class from DIV  element.classList.add("newone"); // Add newone class to DIV}</script>
```

* * *

**Tip:** Also see [How To Toggle A Class](howto_js_toggle_class.asp.html).

**Tip:** Learn more about the [classList](https://www.w3schools.com/jsref/prop_element_classlist.asp) property in our JavaScript Reference.

* * *

* * *