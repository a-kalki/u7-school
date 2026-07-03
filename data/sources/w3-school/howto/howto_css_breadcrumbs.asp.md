# How TO - CSS Breadcrumbs

* * *

Learn how to create a breadcrumb navigation with CSS.

* * *

## How To Create a Breadcrumb Navigation

A breadcrumb navigation provide links back to each previous page the user navigated through, and shows the user's current location in a website.

*   [Home](javascript:void\(0\))
*   [Pictures](javascript:void\(0\))
*   [Summer 15](javascript:void\(0\))
*   Italy

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_breadcrumbs)

* * *

##### Step 1) Add HTML:

```javascript
<ul class="breadcrumb">  <li><a href="#">Home</a></li>  <li><a href="#">Pictures</a></li>  <li><a href="#">Summer 15</a></li>  <li>Italy</li></ul>
```

##### Step 2) Add CSS:

```javascript
/* Style the list */ul.breadcrumb {  padding: 10px 16px;  list-style: none;  background-color: #eee;}/* Display list items side by side */ul.breadcrumb li {  display: inline;  font-size: 18px;}/* Add a slash symbol (/) before/behind each list item */ul.breadcrumb li+li:before {  padding: 8px;  color: black;  content: "/\00a0";}/* Add a color to all links inside the list */ul.breadcrumb li a {  color: #0275d8;  text-decoration: none;}/* Add a color on mouse-over */ul.breadcrumb li a:hover {  color: #01447e;  text-decoration: underline;}
```

Go to our [CSS Pagination Tutorial](https://www.w3schools.com/css/css3_pagination.asp) to learn more about pagination.

* * *

* * *