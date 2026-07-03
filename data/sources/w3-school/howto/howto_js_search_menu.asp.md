# How TO - Search Menu

* * *

Learn how to create a search menu to filter links with JavaScript.

* * *

## Search/Filter Menu

How to search for links in a navigation menu:

## Menu

*   [HTML](javascript:void\(0\))
*   [CSS](javascript:void\(0\))
*   [JavaScript](javascript:void\(0\))
*   [PHP](javascript:void\(0\))
*   [Python](javascript:void\(0\))
*   [jQuery](javascript:void\(0\))
*   [SQL](javascript:void\(0\))
*   [Bootstrap](javascript:void\(0\))
*   [Node.js](javascript:void\(0\))

## Page Content

Start to type for a specific category/link inside the search bar to "filter" the search options.

Some text..Some text..Some text..Some text..Some text..Some text..Some text..Some text..

Some other text..Some text..Some text..Some text..Some text..Some text..Some text..Some text..

Some text..

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_search_menu)

* * *

## Create A Search Menu

##### Step 1) Add HTML:

```javascript
<input type="text" id="mySearch" onkeyup="myFunction()" placeholder="Search.." title="Type in a category"><ul id="myMenu">  <li><a href="#">HTML</a></li>  <li><a href="#">CSS</a></li>  <li><a href="#">JavaScript</a></li>  <li><a href="#">PHP</a></li>  <li><a href="#">Python</a></li>  <li><a href="#">jQuery</a></li>  <li><a href="#">SQL</a></li>  <li><a href="#">Bootstrap</a></li>  <li><a href="#">Node.js</a></li></ul>
```

**Note:** We use href="#" in this demo since we do not have a page to link it to. In real life this should be a real URL to a specific page.

* * *

##### Step 2) Add CSS:

Style the search box and the navigation menu:

```javascript
/* Style the search box */#mySearch {  width: 100%;  font-size: 18px;  padding: 11px;  border: 1px solid #ddd;}/* Style the navigation menu */#myMenu {  list-style-type: none;  padding: 0;  margin: 0;}/* Style the navigation links */#myMenu li a {  padding: 12px;  text-decoration: none;  color: black;  display: block}#myMenu li a:hover {  background-color: #eee;}
```

* * *

* * *

##### Step 3) Add JavaScript:

```javascript
<script>function myFunction() {  // Declare variables  var input, filter, ul, li, a, i;  input = document.getElementById("mySearch");  filter = input.value.toUpperCase();  ul = document.getElementById("myMenu");  li = ul.getElementsByTagName("li");  // Loop through all list items, and hide those who don't match the search query  for (i = 0; i < li.length; i++) {    a = li[i].getElementsByTagName("a")[0];    if (a.innerHTML.toUpperCase().indexOf(filter) > -1) {      li[i].style.display = "";    } else {      li[i].style.display = "none";    }  }}</script>
```

**Tip:** Remove toUpperCase() if you want to perform a case-sensitive search.

**Tip:** Also check out [How To Filter Tables](howto_js_filter_table.asp.html).

**Tip:** Also check out [How To Filter Lists](howto_js_filter_lists.asp.html).