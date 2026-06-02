# How TO - Dropdown Navbar

* * *

Learn how to create a dropdown navigation bar.

* * *

## Dropdown Menu in Navbar

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_dropdown_navbar)

* * *

## Create A Dropdown Navbar

Create a dropdown menu that appears when the user moves the mouse over an element inside a navigation bar.

##### Step 1) Add HTML:

```javascript
<div class="navbar">  <a href="#home">Home</a>  <a href="#news">News</a>  <div class="dropdown">    <button class="dropbtn">Dropdown      <i class="fa fa-caret-down"></i>    </button>    <div class="dropdown-content">      <a href="#">Link 1</a>      <a href="#">Link 2</a>      <a href="#">Link 3</a>    </div>  </div></div>
```

### Example Explained

Use any element to open the dropdown menu, e.g. a <button>, <a> or <p> element.

Use a container element (like <div>) to create the dropdown menu and add the dropdown links inside it.

Wrap a <div> element around the button and the <div> to position the dropdown menu correctly with CSS.

* * *

##### Step 2) Add CSS:

```javascript
/* Navbar container */.navbar {  overflow: hidden;  background-color: #333;  font-family: Arial;}/* Links inside the navbar */.navbar a {  float: left;  font-size: 16px;  color: white;  text-align: center;  padding: 14px 16px;  text-decoration: none;}/* The dropdown container */.dropdown {  float: left;  overflow: hidden;}/* Dropdown button */.dropdown .dropbtn {  font-size: 16px;  border: none;  outline: none;  color: white;  padding: 14px 16px;  background-color: inherit;  font-family: inherit; /* Important for vertical align on mobile phones */  margin: 0; /* Important for vertical align on mobile phones */}/* Add a red background color to navbar links on hover */.navbar a:hover, .dropdown:hover .dropbtn {  background-color: red;}/* Dropdown content (hidden by default) */.dropdown-content {  display: none;  position: absolute;  background-color: #f9f9f9;  min-width: 160px;  box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);  z-index: 1;}/* Links inside the dropdown */.dropdown-content a {  float: none;  color: black;  padding: 12px 16px;  text-decoration: none;  display: block;  text-align: left;}/* Add a grey background color to dropdown links on hover */.dropdown-content a:hover {  background-color: #ddd;}/* Show the dropdown menu on hover */.dropdown:hover .dropdown-content {  display: block;}
```

### Example Explained

We have styled the navigation bar and the navbar links with a background-color, padding, etc.

We have styled the dropdown button with a background-color, padding, etc.

The `.dropdown` class is the container for `.dropdown-content`. Since this is a <div> element, and not an <a> element, we have to float it to make sure that it stays next to the links.

The `.dropdown-content` class holds the actual dropdown menu. It is hidden by default, and will be displayed on hover (see below). Note the `min-width` is set to 160px. Feel free to change this.

Instead of using a border, we have used the `box-shadow` property to make the dropdown menu look like a "card". We also use z-index to place the dropdown in front of other elements.

The `:hover` selector is used to show the dropdown menu when the user moves the mouse over the dropdown button.

* * *

* * *

## Clickable Dropdown in Navbar

```javascript

```

**Tip:** Go to our [CSS Dropdowns Tutorial](https://www.w3schools.com/css/css_dropdowns.asp) to learn more about dropdowns.

**Tip:** Go to our [Clickable Dropdowns](howto_js_dropdown.asp.html) to learn more about clickable dropdowns

**Tip:** Go to our [CSS Navbar Tutorial](https://www.w3schools.com/css/css_navbar.asp) to learn more about navbars.

**Tip:** Go to our [Responsive Top Navigation](howto_js_topnav_responsive.asp.html) to learn about how to create a responsive navbar.