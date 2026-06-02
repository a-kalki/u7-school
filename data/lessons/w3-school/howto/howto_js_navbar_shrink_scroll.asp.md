# How TO - Shrink Navigation Menu on Scroll

* * *

Learn how to resize a navigation bar on scroll with CSS and JavaScript.

* * *

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_navbar_shrink_scroll)

* * *

## How To Shrink Navbar on Scroll

##### Step 1) Add HTML:

Create a navigation bar:

```javascript
<div id="navbar">  <a href="#default" id="logo">CompanyLogo</a>  <div id="navbar-right">    <a class="active" href="#home">Home</a>    <a href="#contact">Contact</a>    <a href="#about">About</a>  </div></div>
```

* * *

##### Step 2) Add CSS:

Style the navigation bar:

```javascript
/* Create a sticky/fixed navbar */#navbar {  overflow: hidden;  background-color: #f1f1f1;  padding: 90px 10px; /* Large padding which will shrink on scroll (using JS) */  transition: 0.4s; /* Adds a transition effect when the padding is decreased */  position: fixed; /* Sticky/fixed navbar */  width: 100%;  top: 0; /* At the top */  z-index: 99;}/* Style the navbar links */#navbar a {  float: left;  color: black;  text-align: center;  padding: 12px;  text-decoration: none;  font-size: 18px;  line-height: 25px;  border-radius: 4px;}/* Style the logo */#navbar #logo {  font-size: 35px;  font-weight: bold;  transition: 0.4s;}/* Links on mouse-over */#navbar a:hover {  background-color: #ddd;  color: black;}/* Style the active/current link */#navbar a.active {  background-color: dodgerblue;  color: white;}/* Display some links to the right */#navbar-right {  float: right;}/* Add responsiveness - on screens less than 580px wide, display the navbar vertically instead of horizontally */@media screen and (max-width: 580px) {  #navbar {    padding: 20px 10px !important; /* Use !important to make sure that JavaScript doesn't override the padding on small screens */  }  #navbar a {    float: none;    display: block;    text-align: left;  }  #navbar-right {    float: none;  }}
```

* * *

* * *

##### Step 3) Add JavaScript:

```javascript
// When the user scrolls down 80px from the top of the document, resize the navbar's padding and the logo's font sizewindow.onscroll = function() {scrollFunction()};function scrollFunction() {  if (document.body.scrollTop > 80 || document.documentElement.scrollTop > 80) {    document.getElementById("navbar").style.padding = "30px 10px";    document.getElementById("logo").style.fontSize = "25px";  } else {    document.getElementById("navbar").style.padding = "80px 10px";    document.getElementById("logo").style.fontSize = "35px";  }}
```