# How TO - Pill Navigation

* * *

Learn how to create a pill navigation menu with CSS.

* * *

## Pill Navigation

[Home](javascript:void\(0\)) [News](javascript:void\(0\)) [Contact](javascript:void\(0\)) [About](javascript:void\(0\))

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_pill_nav)

* * *

## Create a Pill Navigation

##### Step 1) Add HTML:

```javascript
<div class="pill-nav">  <a class="active" href="#home">Home</a>  <a href="#news">News</a>  <a href="#contact">Contact</a>  <a href="#about">About</a></div>
```

* * *

##### Step 2) Add CSS:

```javascript
/* Style the links inside the pill navigation menu */.pill-nav a {  display: inline-block;  color: black;  text-align: center;  padding: 14px;  text-decoration: none;  font-size: 17px;  border-radius: 5px;}/* Change the color of links on mouse-over */.pill-nav a:hover {  background-color: #ddd;  color: black;}/* Add a color to the active/current link */.pill-nav a.active {  background-color: dodgerblue;  color: white;}
```

* * *

## Vertical Pill Navigation

Add `display: block` to the links, and they will appear vertically instead of horizontally:

```javascript

```

**Tip:** See also [How To Create a Top Navigation Menu](howto_js_topnav.asp.html).

**Tip:** Go to our [CSS Navbar Tutorial](https://www.w3schools.com/css/css_navbar.asp) to learn more about navigation bars.

* * *

* * *