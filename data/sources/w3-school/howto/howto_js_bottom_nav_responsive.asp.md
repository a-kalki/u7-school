# How TO - Responsive Bottom Navigation

* * *

Learn how to create a responsive bottom navigation menu with CSS and JavaScript.

* * *

## Responsive Bottom Navigation

**Resize** the browser window to see how the responsive navigation menu works:

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_bottom_nav)

* * *

## Create A Responsive Bottom Navbar

##### Step 1) Add HTML:

```javascript
<div class="navbar" id="myNavbar">  <a href="#home">Home</a>  <a href="#news">News</a>  <a href="#contact">Contact</a>  <a href="#about">About</a>  <a href="javascript:void(0);" class="icon" onclick="myFunction()">&#9776;</a></div>
```

The link with class="icon" is used to open and close the navbar on small screens.

* * *

##### Step 2) Add CSS:

```javascript
/* Place the navbar at the bottom of the page, and make it stick */.navbar {  background-color: #333;  overflow: hidden;  position: fixed;  bottom: 0;  width: 100%;}/* Style the links inside the navigation bar */.navbar a {  float: left;  display: block;  color: #f2f2f2;  text-align: center;  padding: 14px 16px;  text-decoration: none;  font-size: 17px;}/* Change the color of links on hover */.navbar a:hover {  background-color: #ddd;  color: black;}/* Add a green background color to the active link */.navbar a.active {  background-color: #04AA6D;  color: white;}/* Hide the link that should open and close the navbar on small screens */.navbar .icon {  display: none;}
```

* * *

* * *

Add media queries:

```javascript
/* When the screen is less than 600 pixels wide, hide all links, except for the first one ("Home"). Show the link that contains should open and close the navbar (.icon) */@media screen and (max-width: 600px) {  .navbar a:not(:first-child) {display: none;}  .navbar a.icon {    float: right;    display: block;  }}/* The "responsive" class is added to the navbar with JavaScript when the user clicks on the icon. This class makes the navbar look good on small screens (display the links vertically instead of horizontally) */@media screen and (max-width: 600px) {  .navbar.responsive a.icon {    position: absolute;    right: 0;    bottom: 0;  }  .navbar.responsive a {    float: none;    display: block;    text-align: left;  }}
```

* * *

##### Step 3) Add JavaScript:

```javascript
/* Toggle between adding and removing the "responsive" class to the navbar when the user clicks on the icon */function myFunction() {  var x = document.getElementById("myNavbar");  if (x.className === "navbar") {    x.className += " responsive";  } else {    x.className = "navbar";  }}
```

**Tip:** Go to our [CSS Navbar Tutorial](https://www.w3schools.com/css/css_navbar.asp) to learn more about navigation bars.