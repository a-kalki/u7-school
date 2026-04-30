# How TO - Side Navigation

* * *

Learn how to create an animated, closable side navigation menu.

* * *

[×](javascript:void\(0\)) [About](javascript:void\(0\)) [Services](javascript:void\(0\)) [Clients](javascript:void\(0\)) [Contact](javascript:void\(0\))

[×](javascript:void\(0\)) [About](javascript:void\(0\)) [Services](javascript:void\(0\)) [Clients](javascript:void\(0\)) [Contact](javascript:void\(0\))

[×](javascript:void\(0\)) [About](howto_js_sidenav.asp.html#) [Services](howto_js_sidenav.asp.html#) [Clients](howto_js_sidenav.asp.html#) [Contact](howto_js_sidenav.asp.html#)

Sidenav overlay  
Sidenav overlay without animation  
Sidenav push (off-canvas)  
Sidenav push w/opacity  
Sidenav full-width  
[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_sidenav)

* * *

## Create an Animated Side Navigation

##### Step 1) Add HTML:

```javascript
<div id="mySidenav" class="sidenav">  <a href="javascript:void(0)" class="closebtn" onclick="closeNav()">&times;</a>  <a href="#">About</a>  <a href="#">Services</a>  <a href="#">Clients</a>  <a href="#">Contact</a></div><!-- Use any element to open the sidenav --><span onclick="openNav()">open</span><!-- Add all page content inside this div if you want the side nav to push page content to the right (not used if you only want the sidenav to sit on top of the page --><div id="main">  ...</div>
```

* * *

##### Step 2) Add CSS:

```javascript
/* The side navigation menu */.sidenav {  height: 100%; /* 100% Full-height */  width: 0; /* 0 width - change this with JavaScript */  position: fixed; /* Stay in place */  z-index: 1; /* Stay on top */  top: 0; /* Stay at the top */  left: 0;  background-color: #111; /* Black*/  overflow-x: hidden; /* Disable horizontal scroll */  padding-top: 60px; /* Place content 60px from the top */  transition: 0.5s; /* 0.5 second transition effect to slide in the sidenav */}/* The navigation menu links */.sidenav a {  padding: 8px 8px 8px 32px;  text-decoration: none;  font-size: 25px;  color: #818181;  display: block;  transition: 0.3s;}/* When you mouse over the navigation links, change their color */.sidenav a:hover {  color: #f1f1f1;}/* Position and style the close button (top right corner) */.sidenav .closebtn {  position: absolute;  top: 0;  right: 25px;  font-size: 36px;  margin-left: 50px;}/* Style page content - use this if you want to push the page content to the right when you open the side navigation */#main {  transition: margin-left .5s;  padding: 20px;}/* On smaller screens, where height is less than 450px, change the style of the sidenav (less padding and a smaller font size) */@media screen and (max-height: 450px) {  .sidenav {padding-top: 15px;}  .sidenav a {font-size: 18px;}}
```

* * *

* * *

##### Step 3) Add JavaScript:

The example below slides in the side navigation, and makes it 250px wide:

```javascript
/* Set the width of the side navigation to 250px */function openNav() {  document.getElementById("mySidenav").style.width = "250px";}/* Set the width of the side navigation to 0 */function closeNav() {  document.getElementById("mySidenav").style.width = "0";}
```

The example below slides in the side navigation, and pushes the page content to the right (the value used to set the width of the sidenav is also used to set the left margin of the "page content"):

```javascript
/* Set the width of the side navigation to 250px and the left margin of the page content to 250px */function openNav() {  document.getElementById("mySidenav").style.width = "250px";  document.getElementById("main").style.marginLeft = "250px";}/* Set the width of the side navigation to 0 and the left margin of the page content to 0 */function closeNav() {  document.getElementById("mySidenav").style.width = "0";  document.getElementById("main").style.marginLeft = "0";}
```

The example below also slides in the side navigation, and pushes the page content to the right, only this time, we add a black background color with a 40% opacity to the body element, to "highlight" the side navigation:

```javascript
/* Set the width of the side navigation to 250px and the left margin of the page content to 250px and add a black background color to body */function openNav() {  document.getElementById("mySidenav").style.width = "250px";  document.getElementById("main").style.marginLeft = "250px";  document.body.style.backgroundColor = "rgba(0,0,0,0.4)";}/* Set the width of the side navigation to 0 and the left margin of the page content to 0, and the background color of body to white */function closeNav() {  document.getElementById("mySidenav").style.width = "0";  document.getElementById("main").style.marginLeft = "0";  document.body.style.backgroundColor = "white";}
```

The example below slides in the side navigation from the left and covers the whole page (100% width):

```javascript
/* Open the sidenav */function openNav() {  document.getElementById("mySidenav").style.width = "100%";}/* Close/hide the sidenav */function closeNav() {  document.getElementById("mySidenav").style.width = "0";}
```

The example below opens and close the side navigation menu without animations:

```javascript
/* Open the sidenav */function openNav() {  document.getElementById("mySidenav").style.display = "block";}/* Close/hide the sidenav */function closeNav() {  document.getElementById("mySidenav").style.display = "none";}
```

The example below shows how to create a right-sided navigation menu:

```javascript
.sidenav {  right: 0;}
```

The example below shows how to create a side navigation menu that is always shown (fixed):

```javascript
/* The sidenav */.sidenav {  height: 100%;  width: 200px;  position: fixed;  z-index: 1;  top: 0;  left: 0;  background-color: #111;  overflow-x: hidden;  padding-top: 20px;}/* Page content */.main {  margin-left: 200px; /* Same as the width of the sidenav */}
```

**Tip:** Go to our [CSS Navbar Tutorial](https://www.w3schools.com/css/css_navbar.asp) to learn more about navigation bars.

Ever heard about **W3Schools Spaces**? Here you can create your website from scratch or use a template.

[Get started for free ❯](https://www.w3spaces.com "Get Started With W3Schools Spaces")

_\* no credit card required_