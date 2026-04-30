# How TO - Fixed Menu

* * *

Learn how to create a "fixed" menu with CSS.

* * *

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_fixed_menu)

* * *

## How To Create a Fixed Top Menu

##### Step 1) Add HTML:

```javascript
<div class="navbar">  <a href="#home">Home</a>  <a href="#news">News</a>  <a href="#contact">Contact</a></div><div class="main">  <p>Some text some text some text some text..</p></div>
```

* * *

##### Step 2) Add CSS:

To create a fixed top menu, use `position:fixed` and `top:0`. Note that the fixed menu will overlay your other content. To fix this, add a `margin-top` (to the content) that is equal or larger than the height of your menu.

```javascript
/* The navigation bar */.navbar {  overflow: hidden;  background-color: #333;  position: fixed; /* Set the navbar to fixed position */  top: 0; /* Position the navbar at the top of the page */  width: 100%; /* Full width */}/* Links inside the navbar */.navbar a {  float: left;  display: block;  color: #f2f2f2;  text-align: center;  padding: 14px 16px;  text-decoration: none;}/* Change background on mouse-over */.navbar a:hover {  background: #ddd;  color: black;}/* Main content */.main {  margin-top: 30px; /* Add a top margin to avoid content overlay */}
```

* * *

## How To Create a Fixed Bottom Menu

To create a fixed bottom menu, use `position:fixed` and `bottom:0`:

```javascript
/* The navigation bar */.navbar {  position: fixed; /* Set the navbar to fixed position */  bottom: 0; /* Position the navbar at the bottom of the page */  width: 100%; /* Full width */}/* Main content */.main {  margin-bottom: 30px; /* Add a bottom margin to avoid content overlay */}
```

**Tip:** Go to our [CSS Navbar Tutorial](https://www.w3schools.com/css/css_navbar.asp) to learn more about navigation bars.

* * *

* * *