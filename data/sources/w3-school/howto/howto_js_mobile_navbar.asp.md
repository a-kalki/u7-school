# How TO - Mobile Navigation Menu

* * *

Learn how to create a top navigation menu for smartphones / tablets with CSS and JavaScript.

* * *

## Mobile Navigation Bar

Vertical (**recommended**):

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_mobile_navbar)

Horizontal:

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_mobile_navbar_hor)

* * *

## Create A Mobile Navigation Menu

##### Step 1) Add HTML:

```javascript
<!-- Load an icon library to show a hamburger menu (bars) on small screens --><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"><!-- Top Navigation Menu --><div class="topnav">  <a href="#home" class="active">Logo</a>  <!-- Navigation links (hidden by default) -->  <div id="myLinks">    <a href="#news">News</a>    <a href="#contact">Contact</a>    <a href="#about">About</a>  </div>  <!-- "Hamburger menu" / "Bar icon" to toggle the navigation links -->  <a href="javascript:void(0);" class="icon" onclick="myFunction()">    <i class="fa fa-bars"></i>  </a></div>
```

* * *

##### Step 2) Add CSS:

```javascript
/* Style the navigation menu */.topnav {  overflow: hidden;  background-color: #333;  position: relative;}/* Hide the links inside the navigation menu (except for logo/home) */.topnav #myLinks {  display: none;}/* Style navigation menu links */.topnav a {  color: white;  padding: 14px 16px;  text-decoration: none;  font-size: 17px;  display: block;}/* Style the hamburger menu */.topnav a.icon {  background: black;  display: block;  position: absolute;  right: 0;  top: 0;}/* Add a grey background color on mouse-over */.topnav a:hover {  background-color: #ddd;  color: black;}/* Style the active link (or home/logo) */.active {  background-color: #04AA6D;  color: white;}
```

* * *

* * *

##### Step 3) Add JavaScript:

```javascript
/* Toggle between showing and hiding the navigation menu links when the user clicks on the hamburger menu / bar icon */function myFunction() {  var x = document.getElementById("myLinks");  if (x.style.display === "block") {    x.style.display = "none";  } else {    x.style.display = "block";  }}
```

**Tip:** To create a responsive navigation bar, that works on all devices, read our [How To - Responsive Top Navigation](howto_js_topnav_responsive.asp.html) tutorial.

**Tip:** Go to our [CSS Navbar Tutorial](https://www.w3schools.com/css/css_navbar.asp) to learn more about navigation bars.