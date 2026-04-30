# How TO - Icon Bar

* * *

Learn how to create icon bars with CSS.

* * *

Vertical:

[](howto_css_icon_bar.asp.html#)[](howto_css_icon_bar.asp.html#)[](howto_css_icon_bar.asp.html#)[](howto_css_icon_bar.asp.html#)[](howto_css_icon_bar.asp.html#)

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_icon_bar_v)

Horizontal:

[](howto_css_icon_bar.asp.html#)[](howto_css_icon_bar.asp.html#)[](howto_css_icon_bar.asp.html#)[](howto_css_icon_bar.asp.html#)[](howto_css_icon_bar.asp.html#)

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_icon_bar_h)

* * *

## How To Create an Icon Bar

##### Step 1) Add HTML:

```javascript
<!-- Add icon library --><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"><div class="icon-bar">  <a class="active" href="#"><i class="fa fa-home"></i></a>  <a href="#"><i class="fa fa-search"></i></a>  <a href="#"><i class="fa fa-envelope"></i></a>  <a href="#"><i class="fa fa-globe"></i></a>  <a href="#"><i class="fa fa-trash"></i></a></div>
```

* * *

* * *

##### Step 2) Add CSS:

```javascript
.icon-bar {  width: 90px; /* Set a specific width */  background-color: #555; /* Dark-grey background */}.icon-bar a {  display: block; /* Make the links appear below each other instead of side-by-side */  text-align: center; /* Center-align text */  padding: 16px; /* Add some padding */  transition: all 0.3s ease; /* Add transition for hover effects */  color: white; /* White text color */  font-size: 36px; /* Increased font-size */}.icon-bar a:hover {  background-color: #000; /* Add a hover color */}.active {  background-color: #04AA6D; /* Add an active/current color */}
```
```javascript
.icon-bar {  width: 100%; /* Full-width */  background-color: #555; /* Dark-grey background */  overflow: auto; /* Overflow due to float */}.icon-bar a {  float: left; /* Float links side by side */  text-align: center; /* Center-align text */  width: 20%; /* Equal width (5 icons with 20% width each = 100%) */  padding: 12px 0; /* Some top and bottom padding */  transition: all 0.3s ease; /* Add transition for hover effects */  color: white; /* White text color */  font-size: 36px; /* Increased font size */}.icon-bar a:hover {  background-color: #000; /* Add a hover color */}.active {  background-color: #04AA6D; /* Add an active/current color */}
```

* * *

## Related Pages

**Tip:** Go to our [CSS Navbar Tutorial](https://www.w3schools.com/css/css_navbar.asp) to learn more about navigation bars.

**Tip:** Go to our [Icons Tutorial](https://www.w3schools.com/icons/default.asp) to learn more about icons.