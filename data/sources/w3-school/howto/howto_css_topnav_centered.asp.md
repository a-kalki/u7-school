# How TO - Centered Top Navigation

* * *

Learn how to create a navigation bar with a centered link/logo.

* * *

## Centered Menu Link

[Home](javascript:void\(0\))

[News](javascript:void\(0\)) [Contact](javascript:void\(0\))

[Search](javascript:void\(0\)) [About](javascript:void\(0\))

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_topnav_centered)

* * *

## Create a Top Navigation Bar

##### Step 1) Add HTML:

```javascript
<!-- Top navigation --><div class="topnav">  <!-- Centered link -->  <div class="topnav-centered">    <a href="#home" class="active">Home</a>  </div>  <!-- Left-aligned links (default) -->  <a href="#news">News</a>  <a href="#contact">Contact</a>  <!-- Right-aligned links -->  <div class="topnav-right">    <a href="#search">Search</a>    <a href="#about">About</a>  </div></div>
```

* * *

##### Step 2) Add CSS:

```javascript
/* Add a black background color to the top navigation */.topnav {  position: relative;  background-color: #333;  overflow: hidden;}/* Style the links inside the navigation bar */.topnav a {  float: left;  color: #f2f2f2;  text-align: center;  padding: 14px 16px;  text-decoration: none;  font-size: 17px;}/* Change the color of links on hover */.topnav a:hover {  background-color: #ddd;  color: black;}/* Add a color to the active/current link */.topnav a.active {  background-color: #04AA6D;  color: white;}/* Centered section inside the top navigation */.topnav-centered a {  float: none;  position: absolute;  top: 50%;  left: 50%;  transform: translate(-50%, -50%);}/* Right-aligned section inside the top navigation */.topnav-right {  float: right;}/* Responsive navigation menu - display links on top of each other instead of next to each other (for mobile devices) */@media screen and (max-width: 600px) {  .topnav a, .topnav-right {    float: none;    display: block;  }  .topnav-centered a {    position: relative;    top: 0;    left: 0;    transform: none;  }}
```

**Tip:** To create mobile-friendly, responsive navigation bars, read our [How To - Responsive Top Navigation](howto_js_topnav_responsive.asp.html) tutorial.

**Tip:** Go to our [CSS Navbar Tutorial](https://www.w3schools.com/css/css_navbar.asp) to learn more about navigation bars.

* * *

* * *