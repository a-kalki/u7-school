# How TO - Filter/Search Table

* * *

Learn how to create a filter table with JavaScript.

* * *

## Filter Table

How to use JavaScript to search for specific data in a table.

Name

Country

Alfreds Futterkiste

Germany

Berglunds snabbkop

Sweden

Island Trading

UK

Koniglich Essen

Germany

Laughing Bacchus Winecellars

Canada

Magazzini Alimentari Riuniti

Italy

North/South

UK

Paris specialites

France

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_filter_table)

* * *

## Create A Filtered Table

##### Step 1) Add HTML:

```javascript
<input type="text" id="myInput" onkeyup="myFunction()" placeholder="Search for names.."><table id="myTable">  <tr class="header">    <th style="width:60%;">Name</th>    <th style="width:40%;">Country</th>  </tr>  <tr>    <td>Alfreds Futterkiste</td>    <td>Germany</td>  </tr>  <tr>    <td>Berglunds snabbkop</td>    <td>Sweden</td>  </tr>  <tr>    <td>Island Trading</td>    <td>UK</td>  </tr>  <tr>    <td>Koniglich Essen</td>    <td>Germany</td>  </tr></table>
```

* * *

##### Step 2) Add CSS:

Style the input element and the table:

```javascript
#myInput {  background-image: url('/css/searchicon.png'); /* Add a search icon to input */  background-position: 10px 12px; /* Position the search icon */  background-repeat: no-repeat; /* Do not repeat the icon image */  width: 100%; /* Full-width */  font-size: 16px; /* Increase font-size */  padding: 12px 20px 12px 40px; /* Add some padding */  border: 1px solid #ddd; /* Add a grey border */  margin-bottom: 12px; /* Add some space below the input */}#myTable {  border-collapse: collapse; /* Collapse borders */  width: 100%; /* Full-width */  border: 1px solid #ddd; /* Add a grey border */  font-size: 18px; /* Increase font-size */}#myTable th, #myTable td {  text-align: left; /* Left-align text */  padding: 12px; /* Add padding */}#myTable tr {  /* Add a bottom border to all table rows */  border-bottom: 1px solid #ddd;}#myTable tr.header, #myTable tr:hover {  /* Add a grey background color to the table header and on hover */  background-color: #f1f1f1;}
```

* * *

* * *

##### Step 3) Add JavaScript:

```javascript
<script>function myFunction() {  // Declare variables  var input, filter, table, tr, td, i, txtValue;  input = document.getElementById("myInput");  filter = input.value.toUpperCase();  table = document.getElementById("myTable");  tr = table.getElementsByTagName("tr");  // Loop through all table rows, and hide those who don't match the search query  for (i = 0; i < tr.length; i++) {    td = tr[i].getElementsByTagName("td")[0];    if (td) {      txtValue = td.textContent || td.innerText;      if (txtValue.toUpperCase().indexOf(filter) > -1) {        tr[i].style.display = "";      } else {        tr[i].style.display = "none";      }    }  }}</script>
```

**Tip:** Remove toUpperCase() if you want to perform a case-sensitive search.

**Tip:** Change tr\[i\].getElementsByTagName('td')**\[0\]** to **\[1\]** if you want to search for "Country" (index 1) instead of "Name" (index 0).

**Tip:** Also check out [Filter List](howto_js_filter_lists.asp.html).