# How TO - Hide Menu on Scroll

* * *

Learn how to hide a navigation menu on scroll down with CSS and JavaScript.

* * *

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_navbar_hide_scroll)

* * *

## How To Hide Navbar on Scroll Down

##### Step 1) Add HTML:

Create a navigation bar:

```javascript
<div id="navbar">  <a href="#home">Home</a>  <a href="#news">News</a>  <a href="#contact">Contact</a></div>
```

* * *

##### Step 2) Add CSS:

Style the navigation bar:

```javascript
#navbar {  background-color: #333; /* Black background color */  position: fixed; /* Make it stick/fixed */  top: 0; /* Stay on top */  width: 100%; /* Full width */  transition: top 0.3s; /* Transition effect when sliding down (and up) */}/* Style the navbar links */#navbar a {  float: left;  display: block;  color: white;  text-align: center;  padding: 15px;  text-decoration: none;}#navbar a:hover {  background-color: #ddd;  color: black;}
```

* * *

* * *

##### Step 3) Add JavaScript:

```javascript
/* When the user scrolls down, hide the navbar. When the user scrolls up, show the navbar */var prevScrollpos = window.pageYOffset;window.onscroll = function() {  var currentScrollPos = window.pageYOffset;  if (prevScrollpos > currentScrollPos) {    document.getElementById("navbar").style.top = "0";  } else {    document.getElementById("navbar").style.top = "-50px";  }  prevScrollpos = currentScrollPos;}
```