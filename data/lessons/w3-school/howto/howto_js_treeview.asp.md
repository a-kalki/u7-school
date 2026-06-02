# How TO - Tree View

* * *

Learn how to create a tree view with CSS and JavaScript.

* * *

## Tree View

A tree view represents a hierarchical view of information, where each item can have a number of subitems.

Click on the arrow(s) to open or close the tree branches.

*   Beverages
    *   Water
    *   Coffee
    *   Tea
        *   Black Tea
        *   White Tea
        *   Green Tea
            *   Sencha
            *   Gyokuro
            *   Matcha
            *   Pi Lo Chun

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_treeview)

* * *

## Tree View

##### Step 1) Add HTML:

```javascript
<ul id="myUL">  <li><span class="caret">Beverages</span>    <ul class="nested">      <li>Water</li>      <li>Coffee</li>      <li><span class="caret">Tea</span>        <ul class="nested">          <li>Black Tea</li>          <li>White Tea</li>          <li><span class="caret">Green Tea</span>            <ul class="nested">              <li>Sencha</li>              <li>Gyokuro</li>              <li>Matcha</li>              <li>Pi Lo Chun</li>            </ul>          </li>        </ul>      </li>    </ul>  </li></ul>
```

* * *

##### Step 2) Add CSS:

```javascript
/* Remove default bullets */ul, #myUL {  list-style-type: none;}/* Remove margins and padding from the parent ul */#myUL {  margin: 0;  padding: 0;}/* Style the caret/arrow */.caret {  cursor: pointer;  user-select: none; /* Prevent text selection */}/* Create the caret/arrow with a unicode, and style it */.caret::before {  content: "\25B6";  color: black;  display: inline-block;  margin-right: 6px;}/* Rotate the caret/arrow icon when clicked on (using JavaScript) */.caret-down::before {  transform: rotate(90deg);}/* Hide the nested list */.nested {  display: none;}/* Show the nested list when the user clicks on the caret/arrow (with JavaScript) */.active {  display: block;}
```

* * *

* * *

##### Step 3) Add JavaScript:

```javascript
var toggler = document.getElementsByClassName("caret");var i;for (i = 0; i < toggler.length; i++) {  toggler[i].addEventListener("click", function() {    this.parentElement.querySelector(".nested").classList.toggle("active");    this.classList.toggle("caret-down");  });}
```

* * *

## Checkbox Tree View

In this example, we use a "ballot box" unicode instead of a caret:

```javascript

```