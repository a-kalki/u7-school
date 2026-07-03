# How TO - CSS Pagination

* * *

Learn how to create a pagination with CSS.

* * *

## How To Create a Pagination

*   [«](javascript:void\(0\))
*   [1](javascript:void\(0\))
*   [2](javascript:void\(0\))
*   [3](javascript:void\(0\))
*   [4](javascript:void\(0\))
*   [5](javascript:void\(0\))
*   [6](javascript:void\(0\))
*   [»](javascript:void\(0\))

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_pagination)

* * *

##### Step 1) Add HTML:

```javascript
<div class="pagination">  <a href="#">&laquo;</a>  <a href="#">1</a>  <a class="active" href="#">2</a>  <a href="#">3</a>  <a href="#">4</a>  <a href="#">5</a>  <a href="#">6</a>  <a href="#">&raquo;</a></div>
```

##### Step 2) Add CSS:

```javascript
/* Pagination links */.pagination a {  color: black;  float: left;  padding: 8px 16px;  text-decoration: none;  transition: background-color .3s;}/* Style the active/current link */.pagination a.active {  background-color: dodgerblue;  color: white;}/* Add a grey background color on mouse-over */.pagination a:hover:not(.active) {background-color: #ddd;}
```

Go to our [CSS Pagination Tutorial](https://www.w3schools.com/css/css3_pagination.asp) to learn more about pagination.

* * *

* * *