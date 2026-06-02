# CSS Dropdowns

* * *

## CSS Dropdowns

CSS dropdowns are used to display a list of options or content when a user clicks or hover over an element, like a button or a navigation link.

A CSS dropdown consists of a trigger element (like <div>, <button>, <p>, <a>, etc.).

When the trigger element is clicked or hovered over, the dropdown content will be displayed.

The dropdown content is a container element (e.g. <div>) that holds the hidden content (can be text, links, images, etc.). 

Mouse over the three CSS dropdown examples below:

Dropdown Text

Hello World!

Dropdown Menu

[Link 1](javascript:void\(0\)) [Link 2](javascript:void\(0\)) [Link 3](javascript:void\(0\))

Other: ![Cinque Terre](img_5terre.jpg)

![Cinque Terre](img_5terre.jpg)

Beautiful Cinque Terre

* * *

## CSS Dropdown Box with Text

Here, we create a dropdown box with some text, that appears when the user mouses over a <div> element.

```javascript
<style>.dropdown {  position: relative;}.dropdown-content {  display: none;  position: absolute;  background-color: #f9f9f9;  min-width: 130px;  box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);  padding: 12px 16px;}.dropdown:hover .dropdown-content {  display: block;}</style><div class="dropdown">Mouse over me!  <div class="dropdown-content">Hello World!</div></div>
```

### Example Explained

*   The .dropdown class uses `[position:relative](https://www.w3schools.com/cssref/pr_class_position.php)`, which is needed when we want the dropdown content to be placed right below the trigger element (the dropdown content will use `[position:absolute](https://www.w3schools.com/cssref/pr_class_position.php)`).
*   The .dropdown-content class holds the dropdown content. It is hidden by default, and will be displayed on hover.
*   The `[min-width](https://www.w3schools.com/cssref/pr_dim_min-width.php)` property is set to 130px. Feel free to change this! If you want the width of the dropdown content to be as wide as the trigger element, set `[width](https://www.w3schools.com/cssref/pr_dim_width.php)` to 100% and `[overflow:auto](https://www.w3schools.com/cssref/pr_pos_overflow.php)` to enable scroll on small screens.
*   Instead of using a border, we use the `[box-shadow](https://www.w3schools.com/cssref/css3_pr_box-shadow.php)` property to make the dropdown content look like a "card".
*   The `[:hover](https://www.w3schools.com/cssref/sel_hover.php)` selector is used to show the dropdown content when the user mouses over the <div class="dropdown"> element.

* * *

* * *

## CSS Dropdown Menu

Create a dropdown menu that allows the user to choose an option from a list:

Dropdown Menu

[Link 1](javascript:void\(0\)) [Link 2](javascript:void\(0\)) [Link 3](javascript:void\(0\))

This example is similar to the previous one, except that we add a button and links inside the dropdown box and style them to fit the dropdown button:

```javascript
<style>.dropdown {  position: relative;}/* Style the dropdown button */.dropbtn {  background-color: #4CAF50;  color: white;  padding: 16px;  font-size: 16px;  border: none;  cursor: pointer;}/* Dropdown content */.dropdown-content {  display: none;  position: absolute;  background-color: #f9f9f9;  min-width: 200px;  box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);}/* Links inside dropdown content */.dropdown-content a {  color: black;  padding: 12px 16px;  text-decoration: none;  display: block;}/* Change color of dropdown links on hover */.dropdown-content a:hover {  background-color: #f1f1f1}/* Show the dropdown content on hover */.dropdown:hover .dropdown-content {  display: block;}/* Change background color of dropdown button on hover */.dropdown:hover .dropbtn {  background-color: #3e8e41;}</style><div class="dropdown">  <button class="dropbtn">Dropdown Menu</button>  <div class="dropdown-content">    <a href="#">Link 1</a>    <a href="#">Link 2</a>    <a href="#">Link 3</a>  </div></div>
```

* * *

* * *