# How TO - Collapse

* * *

Learn how to create a collapsible section.

* * *

## Collapsible

Click the button to toggle between showing and hiding the collapsible content.

Collapsible

Some collapsible content. Click the button to toggle between showing and hiding the collapsible content. Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_collapsible)

* * *

## Create A Collapsible

##### Step 1) Add HTML:

```javascript
<button type="button" class="collapsible">Open Collapsible</button><div class="content">  <p>Lorem ipsum...</p></div>
```

* * *

##### Step 2) Add CSS:

Style the accordion:

```javascript
/* Style the button that is used to open and close the collapsible content */.collapsible {  background-color: #eee;  color: #444;  cursor: pointer;  padding: 18px;  width: 100%;  border: none;  text-align: left;  outline: none;  font-size: 15px;}/* Add a background color to the button if it is clicked on (add the .active class with JS), and when you move the mouse over it (hover) */.active, .collapsible:hover {  background-color: #ccc;}/* Style the collapsible content. Note: hidden by default */.content {  padding: 0 18px;  display: none;  overflow: hidden;  background-color: #f1f1f1;}
```

* * *

* * *

##### Step 3) Add JavaScript:

```javascript
var coll = document.getElementsByClassName("collapsible");var i;for (i = 0; i < coll.length; i++) {  coll[i].addEventListener("click", function() {    this.classList.toggle("active");    var content = this.nextElementSibling;    if (content.style.display === "block") {      content.style.display = "none";    } else {      content.style.display = "block";    }  });}
```

* * *

## Animated Collapsible (Slide Down)

To make an animated collapsible, add `max-height: 0`, `overflow: hidden` and a `transition` for the max-height property, to the `panel` class.

Then, use JavaScript to slide down the content by setting a calculated `max-height`, depending on the panel's height on different screen sizes:

```javascript
<style>.content {  padding: 0 18px;  background-color: white;  max-height: 0;  overflow: hidden;  transition: max-height 0.2s ease-out;}</style><script>var coll = document.getElementsByClassName("collapsible");var i;for (i = 0; i < coll.length; i++) {  coll[i].addEventListener("click", function() {    this.classList.toggle("active");    var content = this.nextElementSibling;    if (content.style.maxHeight){      content.style.maxHeight = null;    } else {      content.style.maxHeight = content.scrollHeight + "px";    }  });}</script>
```

* * *

## Add Icons

Add a symbol to each button to indicate whether the collapsible content is open or closed:

```javascript
.collapsible:after {  content: '\02795'; /* Unicode character for "plus" sign (+) */  font-size: 13px;  color: white;  float: right;  margin-left: 5px;}.active:after {  content: "\2796"; /* Unicode character for "minus" sign (-) */}
```