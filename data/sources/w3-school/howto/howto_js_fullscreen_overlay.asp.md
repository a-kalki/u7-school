# How TO - Full screen Overlay Navigation

* * *

Learn how to create a full screen overlay navigation menu.

* * *

Click on the buttons below to see how it works:

[×](javascript:void\(0\))

[About](javascript:void\(0\)) [Services](javascript:void\(0\)) [Clients](javascript:void\(0\)) [Contact](javascript:void\(0\))

[×](javascript:void\(0\))

[About](javascript:void\(0\)) [Services](javascript:void\(0\)) [Clients](javascript:void\(0\)) [Contact](javascript:void\(0\))

[×](javascript:void\(0\))

[About](javascript:void\(0\)) [Services](javascript:void\(0\)) [Clients](javascript:void\(0\)) [Contact](javascript:void\(0\))

Slide Right

Slide Down

Show (No animation)

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_overlay)

* * *

## Create a Full screen Overlay Navigation

##### Step 1) Add HTML:

```javascript
<!-- The overlay --><div id="myNav" class="overlay">  <!-- Button to close the overlay navigation -->  <a href="javascript:void(0)" class="closebtn" onclick="closeNav()">&times;</a>  <!-- Overlay content -->  <div class="overlay-content">    <a href="#">About</a>    <a href="#">Services</a>    <a href="#">Clients</a>    <a href="#">Contact</a>  </div></div><!-- Use any element to open/show the overlay navigation menu --><span onclick="openNav()">open</span>
```

* * *

##### Step 2) Add CSS:

```javascript
/* The Overlay (background) */.overlay {  /* Height & width depends on how you want to reveal the overlay (see JS below) */     height: 100%;  width: 0;  position: fixed; /* Stay in place */  z-index: 1; /* Sit on top */  left: 0;  top: 0;  background-color: rgb(0,0,0); /* Black fallback color */  background-color: rgba(0,0,0, 0.9); /* Black w/opacity */  overflow-x: hidden; /* Disable horizontal scroll */  transition: 0.5s; /* 0.5 second transition effect to slide in or slide down the overlay (height or width, depending on reveal) */}/* Position the content inside the overlay */.overlay-content {  position: relative;  top: 25%; /* 25% from the top */  width: 100%; /* 100% width */  text-align: center; /* Centered text/links */  margin-top: 30px; /* 30px top margin to avoid conflict with the close button on smaller screens */}/* The navigation links inside the overlay */.overlay a {  padding: 8px;  text-decoration: none;  font-size: 36px;  color: #818181;  display: block; /* Display block instead of inline */  transition: 0.3s; /* Transition effects on hover (color) */}/* When you mouse over the navigation links, change their color */.overlay a:hover, .overlay a:focus {  color: #f1f1f1;}/* Position the close button (top right corner) */.overlay .closebtn {  position: absolute;  top: 20px;  right: 45px;  font-size: 60px;}/* When the height of the screen is less than 450 pixels, change the font-size of the links and position the close button again, so they don't overlap */@media screen and (max-height: 450px) {  .overlay a {font-size: 20px}  .overlay .closebtn {    font-size: 40px;    top: 15px;    right: 35px;  }}
```

* * *

* * *

##### Step 3) Add JavaScript:

The example below slides in the overlay navigation menu from left to right (0 to 100% width), when it is triggered:

```javascript
/* Open when someone clicks on the span element */function openNav() {  document.getElementById("myNav").style.width = "100%";}/* Close when someone clicks on the "x" symbol inside the overlay */function closeNav() {  document.getElementById("myNav").style.width = "0%";}
```

The example below slides in the overlay navigation menu downwards from the top (0 to 100% height).

**Note:** In this example, note that the CSS is slightly different from the one above (default height is now 0, width is 100% and overflow-y is hidden (disable vertical scroll, except for small screens)):

```javascript
/* Open */function openNav() {  document.getElementById("myNav").style.height = "100%";}/* Close */function closeNav() {  document.getElementById("myNav").style.height = "0%";}
```

This example opens the navigation menu without animation:

```javascript
/* Open */function openNav() {  document.getElementById("myNav").style.display = "block";}/* Close */function closeNav() {  document.getElementById("myNav").style.display = "none";}
```

**Tip:** Go to our [CSS Navbar Tutorial](https://www.w3schools.com/css/css_navbar.asp) to learn more about navigation bars.

Ever heard about **W3Schools Spaces**? Here you can create your website from scratch or use a template.

[Get started for free ❯](https://www.w3spaces.com "Get Started With W3Schools Spaces")

_\* no credit card required_