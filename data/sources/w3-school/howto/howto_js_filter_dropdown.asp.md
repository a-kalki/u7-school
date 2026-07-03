# How TO - Search/Filter Dropdown

* * *

Learn how to search for items in a dropdown menu with CSS and JavaScript.

* * *

## Filter Dropdown Menu

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_js_dropdown_filter)

* * *

## Create a Clickable Dropdown

Create a dropdown menu that appears when the user clicks on a button.

##### Step 1) Add HTML:

```javascript
<div class="dropdown">  <button onclick="myFunction()" class="dropbtn">Dropdown</button>  <div id="myDropdown" class="dropdown-content">    <input type="text" placeholder="Search.." id="myInput" onkeyup="filterFunction()">    <a href="#about">About</a>    <a href="#base">Base</a>    <a href="#blog">Blog</a>    <a href="#contact">Contact</a>    <a href="#custom">Custom</a>    <a href="#support">Support</a>    <a href="#tools">Tools</a>  </div></div>
```

### Example Explained

Use any element to open the dropdown menu, e.g. a <button>, <a> or <p> element.

Use a container element (like <div>) to create the dropdown menu and add the dropdown links inside it.

Wrap a <div> element around the button and the <div> to position the dropdown menu correctly with CSS.

* * *

##### Step 2) Add CSS:

```javascript
/* Dropdown Button */.dropbtn {  background-color: #04AA6D;  color: white;  padding: 16px;  font-size: 16px;  border: none;  cursor: pointer;}/* Dropdown button on hover & focus */.dropbtn:hover, .dropbtn:focus {  background-color: #3e8e41;}/* The search field */#myInput {  box-sizing: border-box;  background-image: url('searchicon.png');  background-position: 14px 12px;  background-repeat: no-repeat;  font-size: 16px;  padding: 14px 20px 12px 45px;  border: none;  border-bottom: 1px solid #ddd;}/* The search field when it gets focus/clicked on */#myInput:focus {outline: 3px solid #ddd;}/* The container <div> - needed to position the dropdown content */.dropdown {  position: relative;  display: inline-block;}/* Dropdown Content (Hidden by Default) */.dropdown-content {  display: none;  position: absolute;  background-color: #f6f6f6;  min-width: 230px;  border: 1px solid #ddd;  z-index: 1;}/* Links inside the dropdown */.dropdown-content a {  color: black;  padding: 12px 16px;  text-decoration: none;  display: block;}/* Change color of dropdown links on hover */.dropdown-content a:hover {background-color: #f1f1f1}/* Show the dropdown menu (use JS to add this class to the .dropdown-content container when the user clicks on the dropdown button) */.show {display:block;}
```

### Example Explained

We have styled the dropdown button with a background-color, padding, hover effect, etc.

The `.dropdown` class uses `position:relative`, which is needed when we want the dropdown content to be placed right below the dropdown button (using `position:absolute`).

The `.dropdown-content` class holds the actual dropdown menu. It is hidden by default, and will be displayed on hover (see below). Note the `min-width` is set to 230px. Feel free to change this. **Tip:** If you want the width of the dropdown content to be as wide as the dropdown button, set the `width` to 100% (and `overflow:auto` to enable scroll on small screens).

The search field (#myInput) is styled to fit inside the dropdown menu. We have added a search icon, which is placed to the left inside the search field to indicate that this is actually a search field.

* * *

* * *

##### Step 3) Add JavaScript:

```javascript
/* When the user clicks on the button,toggle between hiding and showing the dropdown content */function myFunction() {  document.getElementById("myDropdown").classList.toggle("show");}function filterFunction() {  var input, filter, ul, li, a, i;  input = document.getElementById("myInput");  filter = input.value.toUpperCase();  div = document.getElementById("myDropdown");  a = div.getElementsByTagName("a");  for (i = 0; i < a.length; i++) {    txtValue = a[i].textContent || a[i].innerText;    if (txtValue.toUpperCase().indexOf(filter) > -1) {      a[i].style.display = "";    } else {      a[i].style.display = "none";    }  }}
```

* * *

**Tip:** Go to our [CSS Dropdowns Tutorial](https://www.w3schools.com/css/css_dropdowns.asp) to learn more about dropdowns.

**Tip:** Go to our [Hoverable Dropdowns](howto_css_dropdown.asp.html) to learn more about hoverable dropdowns