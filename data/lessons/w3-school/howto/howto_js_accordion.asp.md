# How TO - Collapsibles/Accordion

* * *

Learn how to create an accordion (collapsible content).

* * *

## Accordion

Accordions are useful when you want to toggle between hiding and showing large amount of content:

Section 1

Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Section 2

Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Section 3

Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_accordion)

* * *

## Create An Accordion

##### Step 1) Add HTML:

```javascript
<button class="accordion">Section 1</button><div class="panel">  <p>Lorem ipsum...</p></div><button class="accordion">Section 2</button><div class="panel">  <p>Lorem ipsum...</p></div><button class="accordion">Section 3</button><div class="panel">  <p>Lorem ipsum...</p></div>
```

* * *

##### Step 2) Add CSS:

Style the accordion:

```javascript
/* Style the buttons that are used to open and close the accordion panel */.accordion {  background-color: #eee;  color: #444;  cursor: pointer;  padding: 18px;  width: 100%;  text-align: left;  border: none;  outline: none;  transition: 0.4s;}/* Add a background color to the button if it is clicked on (add the .active class with JS), and when you move the mouse over it (hover) */.active, .accordion:hover {  background-color: #ccc;}/* Style the accordion panel. Note: hidden by default */.panel {  padding: 0 18px;  background-color: white;  display: none;  overflow: hidden;}
```

* * *

* * *

##### Step 3) Add JavaScript:

```javascript
var acc = document.getElementsByClassName("accordion");var i;for (i = 0; i < acc.length; i++) {  acc[i].addEventListener("click", function() {    /* Toggle between adding and removing the "active" class,    to highlight the button that controls the panel */    this.classList.toggle("active");    /* Toggle between hiding and showing the active panel */    var panel = this.nextElementSibling;    if (panel.style.display === "block") {      panel.style.display = "none";    } else {      panel.style.display = "block";    }  });}
```

* * *

## Animated Accordion (Slide Down)

To make an animated accordion, add `max-height: 0`, `overflow: hidden` and a `transition` for the max-height property, to the `panel` class.

Then, use JavaScript to slide down the content by setting a calculated `max-height`, depending on the panel's height on different screen sizes:

```javascript
<style>.panel {  padding: 0 18px;  background-color: white;  max-height: 0;  overflow: hidden;  transition: max-height 0.2s ease-out;}</style><script>var acc = document.getElementsByClassName("accordion");var i;for (i = 0; i < acc.length; i++) {  acc[i].addEventListener("click", function() {    this.classList.toggle("active");    var panel = this.nextElementSibling;    if (panel.style.maxHeight) {      panel.style.maxHeight = null;    } else {      panel.style.maxHeight = panel.scrollHeight + "px";    }  });}</script>
```

* * *

## Add Icons

Add a symbol to each button to indicate whether the collapsible content is open or closed:

```javascript
.accordion:after {  content: '\02795'; /* Unicode character for "plus" sign (+) */  font-size: 13px;  color: #777;  float: right;  margin-left: 5px;}.active:after {  content: "\2796"; /* Unicode character for "minus" sign (-) */}
```