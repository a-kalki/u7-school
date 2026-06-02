# How TO - Split Buttons

* * *

Learn how to create a split button dropdown with CSS.

* * *

## Split Button Dropdowns

Hover over the arrow icon to open the dropdown menu:

Button

[Link 1](javascript:void\(0\)) [Link 2](javascript:void\(0\)) [Link 3](javascript:void\(0\))

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_button_split)

* * *

## How To Create a Split Button

##### Step 1) Add HTML:

Create a dropdown menu that appears when the user moves the mouse over an icon.

```javascript
<!-- Font Awesome Icon Library --><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"><button class="btn">Button</button><div class="dropdown">  <button class="btn" style="border-left:1px solid navy">    <i class="fa fa-caret-down"></i>  </button>  <div class="dropdown-content">    <a href="#">Link 1</a>    <a href="#">Link 2</a>    <a href="#">Link 3</a>  </div></div>
```

### Example Explained

Use any element to open the dropdown menu, e.g. a <button>, <a> or <p> element.

Use a container element (like <div>) to create the dropdown menu and add the dropdown links inside it.

Wrap a <div> element around the button and the <div> to position the dropdown menu correctly with CSS.

* * *

* * *

##### Step 2) Add CSS:

```javascript
/* Dropdown Button */.btn {  background-color: #2196F3;  color: white;  padding: 16px;  font-size: 16px;  border: none;  outline: none;}/* The container <div> - needed to position the dropdown content */.dropdown {  position: absolute;  display: inline-block;}/* Dropdown Content (Hidden by Default) */.dropdown-content {  display: none;  position: absolute;  background-color: #f1f1f1;  min-width: 160px;  z-index: 1;}/* Links inside the dropdown */.dropdown-content a {  color: black;  padding: 12px 16px;  text-decoration: none;  display: block;}/* Change color of dropdown links on hover */.dropdown-content a:hover {background-color: #ddd}/* Show the dropdown menu on hover */.dropdown:hover .dropdown-content {  display: block;}/* Change the background color of the dropdown button when the dropdown content is shown */.btn:hover, .dropdown:hover .btn  {  background-color: #0b7dda;}
```

**Tip:** Go to our [CSS Dropdowns Tutorial](https://www.w3schools.com/css/css_dropdowns.asp) to learn more about dropdowns.

**Tip:** Go to our [Clickable Dropdowns](howto_js_dropdown.asp.html) to learn more about clickable dropdowns