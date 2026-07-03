# How TO - Bottom Border Nav Links

* * *

Learn how to create bottom bordered (underline) navigation links with CSS.

* * *

## Bottom Border Nav Links

[Home](javascript:void\(0\)) [News](javascript:void\(0\)) [Contact](javascript:void\(0\))

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_navbar_border)

* * *

## Create A Navigation Menu

##### Step 1) Add HTML:

```javascript
<div class="topnav">  <a href="#home" class="active">Home</a>  <a href="#news">News</a>  <a href="#contact">Contact</a></div>
```

* * *

##### Step 2) Add CSS:

```javascript
/* Add a black background color to the top navigation */.topnav {  background-color: #333;  overflow: hidden;}/* Style the links inside the navigation bar */.topnav a {  float: left;  display: block;  color: #f2f2f2;  text-align: center;  padding: 14px 16px;  text-decoration: none;  font-size: 17px;  border-bottom: 3px solid transparent;}.topnav a:hover {  border-bottom: 3px solid red;}.topnav a.active {  border-bottom: 3px solid red;}
```

**Tip:** To create mobile-friendly, responsive navigation bars, read our [How To - Responsive Top Navigation](howto_js_topnav_responsive.asp.html) tutorial.

**Tip:** Go to our [CSS Navbar Tutorial](https://www.w3schools.com/css/css_navbar.asp) to learn more about navigation bars.

* * *

* * *