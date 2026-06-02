# How TO - Dropup

* * *

Learn how to create a dropup menu with CSS.

* * *

## Dropup

A dropup menu is a toggleable menu that allows the user to choose one value from a predefined list:

Dropup

[Link 1](javascript:void\(0\)) [Link 2](javascript:void\(0\)) [Link 3](javascript:void\(0\))

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_dropup_hover)

* * *

## Create A Hoverable Dropup

Create a dropup menu that appears when the user moves the mouse over an element.

##### Step 1) Add HTML:

```javascript
<div class="dropup">  <button class="dropbtn">Dropup</button>  <div class="dropup-content">    <a href="#">Link 1</a>    <a href="#">Link 2</a>    <a href="#">Link 3</a>  </div></div>
```

### Example Explained

Use any element to open the dropup menu, e.g. a <button>, <a> or <p> element.

Use a container element (like <div>) to create the dropup menu and add the dropup links inside it.

Wrap a <div> element around the button and the <div> to position the dropup menu correctly with CSS.

* * *

##### Step 2) Add CSS:

```javascript
/* Dropup Button */.dropbtn {  background-color: #3498DB;  color: white;  padding: 16px;  font-size: 16px;  border: none;}/* The container <div> - needed to position the dropup content */.dropup {  position: relative;  display: inline-block;}/* Dropup content (Hidden by Default) */.dropup-content {  display: none;  position: absolute;  bottom: 50px;  background-color: #f1f1f1;  min-width: 160px;  box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);  z-index: 1;}/* Links inside the dropup */.dropup-content a {  color: black;  padding: 12px 16px;  text-decoration: none;  display: block;}/* Change color of dropup links on hover */.dropup-content a:hover {background-color: #ddd}/* Show the dropup menu on hover */.dropup:hover .dropup-content {  display: block;}/* Change the background color of the dropup button when the dropup content is shown */.dropup:hover .dropbtn {  background-color: #2980B9;}
```

### Example Explained

We have styled the dropup button with a background-color, padding, etc.

The `.dropup` class uses `position:relative`, which is needed when we want the dropup content to be placed on top of the dropup button (using `position:absolute`).

The `.dropup-content` class holds the actual dropup menu. It is hidden by default, and will be displayed on hover (see below). Note the `min-width` is set to 160px. Feel free to change this. **Tip:** If you want the width of the dropup content to be as wide as the dropup button, set the `width` to 100% (and `overflow:auto` to enable scroll on small screens).

Instead of using a border, we have used the `box-shadow` property to make the dropup menu look like a "card". We also use z-index to place the dropup in front of other elements.

The `:hover` selector is used to show the dropup menu when the user moves the mouse over the dropup button.

* * *

* * *