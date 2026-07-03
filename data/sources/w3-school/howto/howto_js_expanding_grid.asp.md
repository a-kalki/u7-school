# How TO - Expanding Grid

* * *

Learn how to create an expanding grid with CSS and JavaScript.

* * *

## Expanding Grid

Click on a box to "expand" it (100% width):

[

Box 1

](javascript:void\(0\))

[

Box 2

](javascript:void\(0\))

[

Box 3

](javascript:void\(0\))

  

×

## Box 1

Lorem ipsum dolor sit amet, te quo doctus abhorreant, et pri deleniti intellegat, te sanctus inermis ullamcorper nam. Ius error diceret deseruisse ad

×

## Box 2

Lorem ipsum dolor sit amet, te quo doctus abhorreant, et pri deleniti intellegat, te sanctus inermis ullamcorper nam. Ius error diceret deseruisse ad

×

## Box 3

Lorem ipsum dolor sit amet, te quo doctus abhorreant, et pri deleniti intellegat, te sanctus inermis ullamcorper nam. Ius error diceret deseruisse ad

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_expanding_grid)

* * *

## Create an Expanding Grid

##### Step 1) Add HTML:

```javascript
<!-- The grid: three columns --><div class="row">  <div class="column" onclick="openTab('b1');" style="background:green;">Box 1</div>  <div class="column" onclick="openTab('b2');" style="background:blue;">Box 2</div>  <div class="column" onclick="openTab('b3');" style="background:red;">Box 3</div></div><!-- The expanding grid (hidden by default) --><div id="b1" class="containerTab" style="display:none;background:green">  <!-- If you want the ability to close the container, add a close button -->  <span onclick="this.parentElement.style.display='none'" class="closebtn">x</span>  <h2>Box 1</h2>  <p>Lorem ipsum..</p></div><div id="b2" class="containerTab" style="display:none;background:blue">  <span onclick="this.parentElement.style.display='none'" class="closebtn">x</span>  <h2>Box 2</h2>  <p>Lorem ipsum..</p></div><div id="b3" class="containerTab" style="display:none;background:red">  <span onclick="this.parentElement.style.display='none'" class="closebtn">x</span>  <h2>Box 3</h2>  <p>Lorem ipsum..</p></div>
```

* * *

##### Step 2) Add CSS:

Create three columns:

```javascript
/* The grid: Three equal columns that floats next to each other */.column {  float: left;  width: 33.33%;  padding: 50px;  text-align: center;  font-size: 25px;  cursor: pointer;  color: white;}.containerTab {  padding: 20px;  color: white;}/* Clear floats after the columns */.row:after {  content: "";  display: table;  clear: both;}/* Closable button inside the image */.closebtn {  float: right;  color: white;  font-size: 35px;  cursor: pointer;}
```

* * *

* * *

##### Step 3) Add JavaScript:

```javascript
// Hide all elements with class="containerTab", except for the one that matches the clickable grid columnfunction openTab(tabName) {  var i, x;  x = document.getElementsByClassName("containerTab");  for (i = 0; i < x.length; i++) {    x[i].style.display = "none";  }  document.getElementById(tabName).style.display = "block";}
```