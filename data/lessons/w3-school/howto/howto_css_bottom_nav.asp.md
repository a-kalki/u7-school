# How TO - Bottom Navigation

* * *

Learn how to create a bottom navigation menu with CSS.

* * *

## Bottom Navigation Menu

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_bottom_nav)

* * *

## Create A Bottom Navigation Menu

##### Step 1) Add HTML:

```javascript
<div class="navbar">  <a href="#home" class="active">Home</a>  <a href="#news">News</a>  <a href="#contact">Contact</a></div>
```

* * *

##### Step 2) Add CSS:

```javascript
/* Place the navbar at the bottom of the page, and make it stick */.navbar {  background-color: #333;  overflow: hidden;  position: fixed;  bottom: 0;  width: 100%;}/* Style the links inside the navigation bar */.navbar a {  float: left;  display: block;  color: #f2f2f2;  text-align: center;  padding: 14px 16px;  text-decoration: none;  font-size: 17px;}/* Change the color of links on hover */.navbar a:hover {  background-color: #ddd;  color: black;}/* Add a color to the active/current link */.navbar a.active {  background-color: #04AA6D;  color: white;}
```

**Tip:** To create a mobile-friendly, responsive bottom navigation bar, read our [How To - Responsive Bottom Navigation](howto_js_bottom_nav_responsive.asp.html) tutorial.

**Tip:** Go to our [CSS Navbar Tutorial](https://www.w3schools.com/css/css_navbar.asp) to learn more about navigation bars.

* * *

* * *