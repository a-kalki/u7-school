# How TO - Navbar with Icons

* * *

Learn how to create a responsive navigation menu with icons, using CSS.

* * *

## Navigation Bar With Icons

[Home](javascript:void\(0\)) [Search](javascript:void\(0\)) [Contact](javascript:void\(0\)) [Login](javascript:void\(0\))

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_navbar_icon)

* * *

## Create A Responsive Navbar with Icons

##### Step 1) Add HTML:

```javascript
<!-- Load an icon library --><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"><div class="navbar">  <a class="active" href="#"><i class="fa fa-fw fa-home"></i> Home</a>  <a href="#"><i class="fa fa-fw fa-search"></i> Search</a>  <a href="#"><i class="fa fa-fw fa-envelope"></i> Contact</a>  <a href="#"><i class="fa fa-fw fa-user"></i> Login</a></div>
```

* * *

##### Step 2) Add CSS:

```javascript
/* Style the navigation bar */.navbar {  width: 100%;  background-color: #555;  overflow: auto;}/* Navbar links */.navbar a {  float: left;  text-align: center;  padding: 12px;  color: white;  text-decoration: none;  font-size: 17px;}/* Navbar links on mouse-over */.navbar a:hover {  background-color: #000;}/* Current/active navbar link */.active {  background-color: #04AA6D;}/* Add responsiveness - will automatically display the navbar vertically instead of horizontally on screens less than 500 pixels */@media screen and (max-width: 500px) {  .navbar a {    float: none;    display: block;  }}
```

* * *

**Tip:** Go to our [CSS Navbar Tutorial](https://www.w3schools.com/css/css_navbar.asp) to learn more about navigation bars.

**Tip:** If you want to create a navigation bar that only contains icons, read our [How To - Icon Bar Tutorial](howto_css_icon_bar.asp.html).

* * *

* * *