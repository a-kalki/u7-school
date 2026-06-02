# How TO - Vertical Menu

* * *

Learn how to create a vertical menu with CSS.

* * *

## Vertical Menu

[Home](javascript:void\(0\)) [Link 1](javascript:void\(0\)) [Link 2](javascript:void\(0\)) [Link 3](javascript:void\(0\)) [Link 4](javascript:void\(0\))

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_vertical_menu)

* * *

## How To Create a Vertical Button Group

##### Step 1) Add HTML:

```javascript
<div class="vertical-menu">  <a href="#" class="active">Home</a>  <a href="#">Link 1</a>  <a href="#">Link 2</a>  <a href="#">Link 3</a>  <a href="#">Link 4</a></div>
```

* * *

##### Step 2) Add CSS:

```javascript
.vertical-menu {  width: 200px; /* Set a width if you like */}.vertical-menu a {  background-color: #eee; /* Grey background color */  color: black; /* Black text color */  display: block; /* Make the links appear below each other */  padding: 12px; /* Add some padding */  text-decoration: none; /* Remove underline from links */}.vertical-menu a:hover {  background-color: #ccc; /* Dark grey background on mouse-over */}.vertical-menu a.active {  background-color: #04AA6D; /* Add a green color to the "active/current" link */  color: white;}
```

* * *

* * *

## Vertical Scroll Menu

[Home](javascript:void\(0\)) [Link 1](javascript:void\(0\)) [Link 2](javascript:void\(0\)) [Link 3](javascript:void\(0\)) [Link 4](javascript:void\(0\)) [Link 5](javascript:void\(0\)) [Link 6](javascript:void\(0\)) [Link 7](javascript:void\(0\)) [Link 8](javascript:void\(0\)) [Link 9](javascript:void\(0\)) [Link 10](javascript:void\(0\))

Set a specific `height` and add the `overflow` property if you want a vertical scroll menu:

```javascript
.vertical-menu {  width: 200px;  height: 150px;  overflow-y: auto;}
```

**Tip:** Check out our [How To - Side Navigation](howto_js_sidenav.asp.html) tutorial to learn how to create a fixed, full-height side navigation.