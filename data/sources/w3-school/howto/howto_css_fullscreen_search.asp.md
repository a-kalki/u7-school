# How TO - Fullscreen Search

* * *

Learn how to create a full screen search box with CSS and JavaScript.

* * *

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_fullscreen_search)

* * *

## How To Create a Fullscreen Search Box

##### Step 1) Add HTML:

```javascript
<div id="myOverlay" class="overlay">  <span class="closebtn" onclick="closeSearch()" title="Close Overlay">x</span>  <div class="overlay-content">    <form action="action_page.php">      <input type="text" placeholder="Search.." name="search">      <button type="submit"><i class="fa fa-search"></i></button>    </form>  </div></div>
```

* * *

##### Step 2) Add CSS:

```javascript
/* The overlay effect with black background */.overlay {  height: 100%;  width: 100%;  display: none;  position: fixed;  z-index: 1;  top: 0;  left: 0;  background-color: rgb(0,0,0);  background-color: rgba(0,0,0, 0.9); /* Black with a little bit see-through */}/* The content */.overlay-content {  position: relative;  top: 46%;  width: 80%;  text-align: center;  margin-top: 30px;  margin: auto;}/* Close button */.overlay .closebtn {  position: absolute;  top: 20px;  right: 45px;  font-size: 60px;  cursor: pointer;  color: white;}.overlay .closebtn:hover {  color: #ccc;}/* Style the search field */.overlay input[type=text] {  padding: 15px;  font-size: 17px;  border: none;  float: left;  width: 80%;  background: white;}.overlay input[type=text]:hover {  background: #f1f1f1;}/* Style the submit button */.overlay button {  float: left;  width: 20%;  padding: 15px;  background: #ddd;  font-size: 17px;  border: none;  cursor: pointer;}.overlay button:hover {  background: #bbb;}
```

* * *

* * *

##### Step 3) Add JavaScript:

Use JavaScript to turn on and off the overlay/fullscreen effect:

```javascript
// Open the full screen search boxfunction openSearch() {  document.getElementById("myOverlay").style.display = "block";}// Close the full screen search boxfunction closeSearch() {  document.getElementById("myOverlay").style.display = "none";}
```