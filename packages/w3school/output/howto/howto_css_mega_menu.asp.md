# How TO - Mega Menu

* * *

Learn how to create a mega menu (full-width dropdown menu in a navigation bar).

* * *

## Mega Menu

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_mega_menu_responsive)

* * *

## Create A Mega Menu

Create a dropdown menu that appears when the user moves the mouse over an element inside a navigation bar.

##### Step 1) Add HTML:

```javascript
<div class="navbar">  <a href="#home">Home</a>  <a href="#news">News</a>  <div class="dropdown">    <button class="dropbtn">Dropdown      <i class="fa fa-caret-down"></i>    </button>    <div class="dropdown-content">      <div class="header">        <h2>Mega Menu</h2>      </div>      <div class="row">        <div class="column">          <h3>Category 1</h3>          <a href="#">Link 1</a>          <a href="#">Link 2</a>          <a href="#">Link 3</a>        </div>        <div class="column">          <h3>Category 2</h3>          <a href="#">Link 1</a>          <a href="#">Link 2</a>          <a href="#">Link 3</a>        </div>        <div class="column">          <h3>Category 3</h3>          <a href="#">Link 1</a>          <a href="#">Link 2</a>          <a href="#">Link 3</a>        </div>      </div>    </div>  </div></div>
```

### Example Explained

Use any element to open the dropdown menu, e.g. a <button>, <a> or <p> element.

Use a container element (like <div class="dropdown-content">) to create the dropdown menu and add a grid (columns) and add dropdown links inside the grid.

Wrap a <div class="dropdown"> element around the button and the container element (<div class="dropdown-content"> to position the dropdown menu correctly with CSS.

* * *

##### Step 2) Add CSS:

```javascript
/* Navbar container */.navbar {  overflow: hidden;  background-color: #333;  font-family: Arial;}/* Links inside the navbar */.navbar a {  float: left;  font-size: 16px;  color: white;  text-align: center;  padding: 14px 16px;  text-decoration: none;}/* The dropdown container */.dropdown {  float: left;  overflow: hidden;}/* Dropdown button */.dropdown .dropbtn {  font-size: 16px;  border: none;  outline: none;  color: white;  padding: 14px 16px;  background-color: inherit;  font: inherit; /* Important for vertical align on mobile phones */  margin: 0; /* Important for vertical align on mobile phones */}/* Add a red background color to navbar links on hover */.navbar a:hover, .dropdown:hover .dropbtn {  background-color: red;}/* Dropdown content (hidden by default) */.dropdown-content {  display: none;  position: absolute;  background-color: #f9f9f9;  width: 100%;  left: 0;  box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);  z-index: 1;}/* Mega Menu header, if needed */.dropdown-content .header {  background: red;  padding: 16px;  color: white;}/* Show the dropdown menu on hover */.dropdown:hover .dropdown-content {  display: block;}/* Create three equal columns that floats next to each other */.column {  float: left;  width: 33.33%;  padding: 10px;  background-color: #ccc;  height: 250px;}/* Style links inside the columns */.column a {  float: none;  color: black;  padding: 16px;  text-decoration: none;  display: block;  text-align: left;}/* Add a background color on hover */.column a:hover {  background-color: #ddd;}/* Clear floats after the columns */.row:after {  content: "";  display: table;  clear: both;}
```

### Example Explained

We have styled the navigation bar and the navbar links with a background-color, padding, etc.

We have styled the dropdown button with a background-color, padding, etc.

The `.dropdown-content` class holds the actual dropdown menu. It is hidden by default, and will be displayed on hover (see below). It is positioned to be visible right below the dropdown button, and the width is set to 100% to cover the whole screen.

Instead of using a border, we have used the `box-shadow` property to make the dropdown menu look like a "card". We also use z-index to place the dropdown in front of other elements.

The `:hover` selector is used to show the dropdown menu when the user moves the mouse over the dropdown button.

The `.column` classes are used to create three columns that floats next to each other inside the dropdown menu (to show different categories).

* * *

* * *

## Responsive Mega Menu

```javascript
/* Responsive layout - makes the three columns stack on top of each other instead of next to each other */@media screen and (max-width: 600px) {  .column {    width: 100%;    height: auto;  }}
```

**Tip:** Go to our [CSS Dropdowns Tutorial](https://www.w3schools.com/css/css_dropdowns.asp) to learn more about dropdowns.

**Tip:** Go to our [Clickable Dropdowns](howto_js_dropdown.asp.html) to learn more about clickable dropdowns

**Tip:** Go to our [CSS Navbar Tutorial](https://www.w3schools.com/css/css_navbar.asp) to learn more about navbars.

**Tip:** Go to our [Responsive Top Navigation](howto_js_topnav_responsive.asp.html) to learn about how to create a responsive navbar.