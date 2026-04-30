# How TO - Fixed Sidebar

* * *

Learn how to create a fixed side navigation menu with CSS.

* * *

Full height:

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_sidenav_fixed)

Auto height:

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_sidenav_fixed2)

* * *

## Create a Fixed Sidebar

##### Step 1) Add HTML:

```javascript
<!-- Side navigation --><div class="sidenav">  <a href="#">About</a>  <a href="#">Services</a>  <a href="#">Clients</a>  <a href="#">Contact</a></div><!-- Page content --><div class="main">  ...</div>
```

* * *

* * *

##### Step 2) Add CSS:

```javascript
/* The sidebar menu */.sidenav {  height: 100%; /* Full-height: remove this if you want "auto" height */  width: 160px; /* Set the width of the sidebar */  position: fixed; /* Fixed Sidebar (stay in place on scroll) */  z-index: 1; /* Stay on top */  top: 0; /* Stay at the top */  left: 0;  background-color: #111; /* Black */  overflow-x: hidden; /* Disable horizontal scroll */  padding-top: 20px;}/* The navigation menu links */.sidenav a {  padding: 6px 8px 6px 16px;  text-decoration: none;  font-size: 25px;  color: #818181;  display: block;}/* When you mouse over the navigation links, change their color */.sidenav a:hover {  color: #f1f1f1;}/* Style page content */.main {  margin-left: 160px; /* Same as the width of the sidebar */  padding: 0px 10px;}/* On smaller screens, where height is less than 450px, change the style of the sidebar (less padding and a smaller font size) */@media screen and (max-height: 450px) {  .sidenav {padding-top: 15px;}  .sidenav a {font-size: 18px;}}
```

* * *

**Tip:** Go to our [CSS Navbar](https://www.w3schools.com/css/css_navbar.asp) tutorial to learn more about navigation bars.

**Tip:** Go to our [How To - Side Navigation](howto_js_sidenav.asp.html) tutorial to learn how to create an animated, closable side navigation.