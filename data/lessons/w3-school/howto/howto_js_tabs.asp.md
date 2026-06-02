# How TO - Tabs

* * *

Learn how to create tabs with CSS and JavaScript.

* * *

## Tabs

Tabs are perfect for single page web applications, or for web pages capable of displaying different subjects:

*   [London](javascript:void\(0\))
*   [Paris](javascript:void\(0\))
*   [Tokyo](javascript:void\(0\))

### London

London is the capital city of England.

### Paris

Paris is the capital of France.

### Tokyo

Tokyo is the capital of Japan.

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_tabs)

* * *

## Create Toggleable Tabs

##### Step 1) Add HTML:

```javascript
<!-- Tab links --><div class="tab">  <button class="tablinks" onclick="openCity(event, 'London')">London</button>  <button class="tablinks" onclick="openCity(event, 'Paris')">Paris</button>  <button class="tablinks" onclick="openCity(event, 'Tokyo')">Tokyo</button></div><!-- Tab content --><div id="London" class="tabcontent">  <h3>London</h3>  <p>London is the capital city of England.</p></div><div id="Paris" class="tabcontent">  <h3>Paris</h3>  <p>Paris is the capital of France.</p></div><div id="Tokyo" class="tabcontent">  <h3>Tokyo</h3>  <p>Tokyo is the capital of Japan.</p></div>
```

Create buttons to open specific tab content. All <div> elements with `class="tabcontent"` are hidden by default (with CSS & JS). When the user clicks on a button - it will open the tab content that "matches" this button.

* * *

##### Step 2) Add CSS:

Style the buttons and the tab content:

```javascript
/* Style the tab */.tab {  overflow: hidden;  border: 1px solid #ccc;  background-color: #f1f1f1;}/* Style the buttons that are used to open the tab content */.tab button {  background-color: inherit;  float: left;  border: none;  outline: none;  cursor: pointer;  padding: 14px 16px;  transition: 0.3s;}/* Change background color of buttons on hover */.tab button:hover {  background-color: #ddd;}/* Create an active/current tablink class */.tab button.active {  background-color: #ccc;}/* Style the tab content */.tabcontent {  display: none;  padding: 6px 12px;  border: 1px solid #ccc;  border-top: none;}
```

* * *

* * *

##### Step 3) Add JavaScript:

```javascript
function openCity(evt, cityName) {  // Declare all variables  var i, tabcontent, tablinks;  // Get all elements with class="tabcontent" and hide them  tabcontent = document.getElementsByClassName("tabcontent");  for (i = 0; i < tabcontent.length; i++) {    tabcontent[i].style.display = "none";  }  // Get all elements with class="tablinks" and remove the class "active"  tablinks = document.getElementsByClassName("tablinks");  for (i = 0; i < tablinks.length; i++) {    tablinks[i].className = tablinks[i].className.replace(" active", "");  }  // Show the current tab, and add an "active" class to the button that opened the tab  document.getElementById(cityName).style.display = "block";  evt.currentTarget.className += " active";}
```

* * *

## Fade in Tabs:

If you want to fade in the tab content, add the following CSS:

```javascript
.tabcontent {  animation: fadeEffect 1s; /* Fading effect takes 1 second */}/* Go from zero to full opacity */@keyframes fadeEffect {  from {opacity: 0;}  to {opacity: 1;}}
```

* * *

## Show a tab by default

To open a specific tab on page load, use JavaScript to "click" on the specified tab button:

```javascript
<button class="tablinks" onclick="openCity(event, 'London')" id="defaultOpen">London</button><script>// Get the element with id="defaultOpen" and click on itdocument.getElementById("defaultOpen").click();</script>
```

* * *

## Close a tab

If you want to close a specific tab, use JavaScript to hide the tab with a click of a button:

```javascript
<!-- Click on the <span> element to close the tab --><div id="London" class="tabcontent">  <h3>London</h3>  <p>London is the capital city of England.</p>  <span onclick="this.parentElement.style.display='none'">x</span></div>
```

**Tip:** Also check out [How To - Vertical Tabs](howto_js_vertical_tabs.asp.html).