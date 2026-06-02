# How TO - Filter/Search List

* * *

Learn how to create a filter list with JavaScript.

* * *

## Filter List

How to use JavaScript to search for items in a list.

*   [Adele](javascript:void\(0\))
*   [Agnes](javascript:void\(0\))
*   [Billy](javascript:void\(0\))
*   [Bob](javascript:void\(0\))
*   [Calvin](javascript:void\(0\))
*   [Christina](javascript:void\(0\))
*   [Cindy](javascript:void\(0\))

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_filter_list)

* * *

## Create A Search List

##### Step 1) Add HTML:

```javascript
<input type="text" id="myInput" onkeyup="myFunction()" placeholder="Search for names.."><ul id="myUL">  <li><a href="#">Adele</a></li>  <li><a href="#">Agnes</a></li>  <li><a href="#">Billy</a></li>  <li><a href="#">Bob</a></li>  <li><a href="#">Calvin</a></li>  <li><a href="#">Christina</a></li>  <li><a href="#">Cindy</a></li></ul>
```

**Note:** We use href="#" in this demo since we do not have a page to link it to. In real life this should be a real URL to a specific page.

* * *

##### Step 2) Add CSS:

Style the input element and the list:

```javascript
#myInput {  background-image: url('/css/searchicon.png'); /* Add a search icon to input */  background-position: 10px 12px; /* Position the search icon */  background-repeat: no-repeat; /* Do not repeat the icon image */  width: 100%; /* Full-width */  font-size: 16px; /* Increase font-size */  padding: 12px 20px 12px 40px; /* Add some padding */  border: 1px solid #ddd; /* Add a grey border */  margin-bottom: 12px; /* Add some space below the input */}#myUL {  /* Remove default list styling */  list-style-type: none;  padding: 0;  margin: 0;}#myUL li a {  border: 1px solid #ddd; /* Add a border to all links */  margin-top: -1px; /* Prevent double borders */  background-color: #f6f6f6; /* Grey background color */  padding: 12px; /* Add some padding */  text-decoration: none; /* Remove default text underline */  font-size: 18px; /* Increase the font-size */  color: black; /* Add a black text color */  display: block; /* Make it into a block element to fill the whole list */}#myUL li a:hover:not(.header) {  background-color: #eee; /* Add a hover effect to all links, except for headers */}
```

* * *

* * *

##### Step 3) Add JavaScript:

```javascript
<script>function myFunction() {  // Declare variables  var input, filter, ul, li, a, i, txtValue;  input = document.getElementById('myInput');  filter = input.value.toUpperCase();  ul = document.getElementById("myUL");  li = ul.getElementsByTagName('li');  // Loop through all list items, and hide those who don't match the search query  for (i = 0; i < li.length; i++) {    a = li[i].getElementsByTagName("a")[0];    txtValue = a.textContent || a.innerText;    if (txtValue.toUpperCase().indexOf(filter) > -1) {      li[i].style.display = "";    } else {      li[i].style.display = "none";    }  }}</script>
```

**Tip:** Remove toUpperCase() if you want to perform a case-sensitive search.

**Tip:** Also check out [Filter Table](howto_js_filter_table.asp.html).