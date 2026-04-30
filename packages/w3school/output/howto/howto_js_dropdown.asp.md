# How TO - Clickable Dropdown

* * *

Learn how to create a clickable dropdown menu with CSS and JavaScript.

* * *

## Dropdown

A dropdown menu is a toggleable menu that allows the user to choose one value from a predefined list:

Click Me

[Link 1](javascript:void\(0\)) [Link 2](javascript:void\(0\)) [Link 3](javascript:void\(0\))

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_js_dropdown)

* * *

## Create a Clickable Dropdown

Create a dropdown menu that appears when the user clicks on a button.

##### Step 1) Add HTML:

```javascript
<div class="dropdown">  <button onclick="myFunction()" class="dropbtn">Dropdown</button>  <div id="myDropdown" class="dropdown-content">    <a href="#">Link 1</a>    <a href="#">Link 2</a>    <a href="#">Link 3</a>  </div></div>
```

### Example Explained

Use any element to open the dropdown menu, e.g. a <button>, <a> or <p> element.

Use a container element (like <div>) to create the dropdown menu and add the dropdown links inside it.

Wrap a <div> element around the button and the <div> to position the dropdown menu correctly with CSS.

* * *

##### Step 2) Add CSS:

```javascript
/* Dropdown Button */.dropbtn {  background-color: #3498DB;  color: white;  padding: 16px;  font-size: 16px;  border: none;  cursor: pointer;}/* Dropdown button on hover & focus */.dropbtn:hover, .dropbtn:focus {  background-color: #2980B9;}/* The container <div> - needed to position the dropdown content */.dropdown {  position: relative;  display: inline-block;}/* Dropdown Content (Hidden by Default) */.dropdown-content {  display: none;  position: absolute;  background-color: #f1f1f1;  min-width: 160px;  box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);  z-index: 1;}/* Links inside the dropdown */.dropdown-content a {  color: black;  padding: 12px 16px;  text-decoration: none;  display: block;}/* Change color of dropdown links on hover */.dropdown-content a:hover {background-color: #ddd;}/* Show the dropdown menu (use JS to add this class to the .dropdown-content container when the user clicks on the dropdown button) */.show {display:block;}
```

### Example Explained

We have styled the dropdown button with a background-color, padding, hover effect, etc.

The `.dropdown` class uses `position:relative`, which is needed when we want the dropdown content to be placed right below the dropdown button (using `position:absolute`).

The `.dropdown-content` class holds the actual dropdown menu. It is hidden by default, and will be displayed on hover (see below). Note the `min-width` is set to 160px. Feel free to change this. **Tip:** If you want the width of the dropdown content to be as wide as the dropdown button, set the `width` to 100% (and `overflow:auto` to enable scroll on small screens).

Instead of using a border, we have used the `box-shadow` property to make the dropdown menu look like a "card". We also use z-index to place the dropdown in front of other elements.

* * *

* * *

##### Step 3) Add JavaScript:

```javascript
/* When the user clicks on the button,toggle between hiding and showing the dropdown content */function myFunction() {  document.getElementById("myDropdown").classList.toggle("show");}// Close the dropdown menu if the user clicks outside of itwindow.onclick = function(event) {  if (!event.target.matches('.dropbtn')) {    var dropdowns = document.getElementsByClassName("dropdown-content");    var i;    for (i = 0; i < dropdowns.length; i++) {      var openDropdown = dropdowns[i];      if (openDropdown.classList.contains('show')) {        openDropdown.classList.remove('show');      }    }  }}
```

* * *

## Right-aligned dropdown

```javascript

```

* * *

## Dropdown Menu in Navbar

```javascript

```

* * *

## Search (Filter) Dropdown

```javascript

```

**Tip:** Go to our [CSS Dropdowns Tutorial](https://www.w3schools.com/css/css_dropdowns.asp) to learn more about dropdowns.

**Tip:** Go to our [Hoverable Dropdowns](howto_css_dropdown.asp.html) to learn more about hoverable dropdowns