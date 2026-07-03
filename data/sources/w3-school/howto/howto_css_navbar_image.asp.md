# How TO - Navbar on Image

* * *

Learn how to add a navigation menu on an image with CSS.

* * *

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_navbar_on_image)

* * *

## How To Create a Navbar on Image

##### Step 1) Add HTML:

Create a navigation bar:

```javascript
<div class="bg-img">  <div class="container">    <div class="topnav">      <a href="#home">Home</a>      <a href="#news">News</a>      <a href="#contact">Contact</a>      <a href="#about">About</a>    </div>  </div></div>
```

* * *

##### Step 2) Add CSS:

Style the navigation bar:

```javascript
.bg-img {  /* The image used */  background-image: url("img_nature.jpg");  min-height: 380px;  /* Center and scale the image nicely */  background-position: center;  background-repeat: no-repeat;  background-size: cover;  /* Needed to position the navbar */  position: relative;}/* Position the navbar container inside the image */.container {  position: absolute;  margin: 20px;  width: auto;}/* The navbar */.topnav {  overflow: hidden;  background-color: #333;}/* Navbar links */.topnav a {  float: left;  color: #f2f2f2;  text-align: center;  padding: 14px 16px;  text-decoration: none;  font-size: 17px;}.topnav a:hover {  background-color: #ddd;  color: black;}
```

* * *

* * *