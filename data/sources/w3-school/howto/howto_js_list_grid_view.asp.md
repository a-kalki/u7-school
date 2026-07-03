# How TO - List Grid View

* * *

How to create a list grid view.

* * *

Click on a button to choose list view or grid view.

List Grid

  

## Column 1

Some text..

## Column 2

Some text..

## Column 3

Some text..

## Column 4

Some text..

  
[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_list_grid_view)

* * *

## List Grid View

##### Step 1) Add HTML:

```javascript
<!-- Load Font Awesome Icon Library --><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"><!-- Buttons to choose list or grid view --><button onclick="listView()"><i class="fa fa-bars"></i> List</button><button onclick="gridView()"><i class="fa fa-th-large"></i> Grid</button><div class="row">  <div class="column" style="background-color:#aaa;">    <h2>Column 1</h2>    <p>Some text..</p>  </div>  <div class="column" style="background-color:#bbb;">    <h2>Column 2</h2>    <p>Some text..</p>  </div></div><div class="row">  <div class="column" style="background-color:#ccc;">    <h2>Column 3</h2>    <p>Some text..</p>  </div>  <div class="column" style="background-color:#ddd;">    <h2>Column 4</h2>    <p>Some text..</p>  </div></div>
```

* * *

* * *

##### Step 2) Add CSS:

```javascript
/* Create two equal columns that floats next to each other */.column {  float: left;  width: 50%;  padding: 10px;}/* Clear floats after the columns */.row:after {  content: "";  display: table;  clear: both;}
```

* * *

##### Step 3) Add JavaScript:

```javascript
// Get the elements with class="column"var elements = document.getElementsByClassName("column");// Declare a loop variablevar i;// List Viewfunction listView() {  for (i = 0; i < elements.length; i++) {    elements[i].style.width = "100%";  }}// Grid Viewfunction gridView() {  for (i = 0; i < elements.length; i++) {    elements[i].style.width = "50%";  }}
```