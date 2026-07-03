# How TO - Split Navigation

* * *

Learn how to create a "split navigation" bar with CSS.

* * *

## Split Navigation

*   [Home](javascript:void\(0\);)
*   [News](javascript:void\(0\);)
*   [Contact](javascript:void\(0\);)
*   [Help](javascript:void\(0\);)

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_topnav_split)

* * *

## Create A Split Navigation Bar

##### Step 1) Add HTML:

```javascript
<div class="topnav">  <a href="#home">Home</a>  <a href="#news">News</a>  <a href="#contact">Contact</a>  <a href="#about" class="split">Help</a></div>
```

* * *

##### Step 2) Add CSS:

```javascript
/* Create a top navigation bar with a black background color  */.topnav {  background-color: #333;  overflow: hidden;}/* Style the links inside the navigation bar */.topnav a {  float: left;  color: #f2f2f2;  text-align: center;  padding: 14px 16px;  text-decoration: none;  font-size: 17px;}/* Change the color of links on hover */.topnav a:hover {  background-color: #ddd;  color: black;}/* Create a right-aligned (split) link inside the navigation bar */.topnav a.split {  float: right;  background-color: #04AA6D;  color: white;}
```

**Tip:** To create mobile-friendly, responsive navigation bars, read our [How To - Responsive Top Navigation](howto_js_topnav_responsive.asp.html) tutorial.

**Tip:** Go to our [CSS Navbar Tutorial](https://www.w3schools.com/css/css_navbar.asp) to learn more about navigation bars.

Ever heard about **W3Schools Spaces**? Here you can create your website from scratch or use a template.

[Get started for free ❯](https://www.w3spaces.com "Get Started With W3Schools Spaces")

_\* no credit card required_