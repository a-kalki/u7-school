# How TO - Sort a Table

* * *

Learn how to sort an HTML table, using JavaScript.

* * *

Click the button to sort the table alphabetically, based on customer name:

Sort

Name

Country

Berglunds snabbkop

Sweden

North/South

UK

Alfreds Futterkiste

Germany

Koniglich Essen

Germany

Magazzini Alimentari Riuniti

Italy

Paris specialites

France

Island Trading

UK

Laughing Bacchus Winecellars

Canada

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_sort_table)

* * *

## Creating a Sort Function

```javascript
function sortTable() {  var table, rows, switching, i, x, y, shouldSwitch;  table = document.getElementById("myTable");  switching = true;  /* Make a loop that will continue until  no switching has been done: */  while (switching) {    // Start by saying: no switching is done:    switching = false;    rows = table.rows;    /* Loop through all table rows (except the    first, which contains table headers): */    for (i = 1; i < (rows.length - 1); i++) {      // Start by saying there should be no switching:      shouldSwitch = false;      /* Get the two elements you want to compare,      one from current row and one from the next: */      x = rows[i].getElementsByTagName("TD")[0];      y = rows[i + 1].getElementsByTagName("TD")[0];      // Check if the two rows should switch place:      if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {        // If so, mark as a switch and break the loop:        shouldSwitch = true;        break;      }    }    if (shouldSwitch) {      /* If a switch has been marked, make the switch      and mark that a switch has been done: */      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);      switching = true;    }  }}
```

* * *

* * *

## Sort Table by Clicking the Headers

Click the headers to sort the table.

Click "Name" to sort by names, and "Country" to sort by country.

The first time you click, the sorting direction is ascending (A to Z).

Click again, and the sorting direction will be descending (Z to A):

Name

Country

Berglunds snabbkop

Sweden

North/South

UK

Alfreds Futterkiste

Germany

Koniglich Essen

Germany

Magazzini Alimentari Riuniti

Italy

Paris specialites

France

Island Trading

UK

Laughing Bacchus Winecellars

Canada

```javascript
<table id="myTable2"><tr><!--When a header is clicked, run the sortTable function, with a parameter,0 for sorting by names, 1 for sorting by country: --><th onclick="sortTable(0)">Name</th><th onclick="sortTable(1)">Country</th></tr>...<script>function sortTable(n) {  var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;  table = document.getElementById("myTable2");  switching = true;  // Set the sorting direction to ascending:  dir = "asc";  /* Make a loop that will continue until  no switching has been done: */  while (switching) {    // Start by saying: no switching is done:    switching = false;    rows = table.rows;    /* Loop through all table rows (except the    first, which contains table headers): */    for (i = 1; i < (rows.length - 1); i++) {      // Start by saying there should be no switching:      shouldSwitch = false;      /* Get the two elements you want to compare,      one from current row and one from the next: */      x = rows[i].getElementsByTagName("TD")[n];      y = rows[i + 1].getElementsByTagName("TD")[n];      /* Check if the two rows should switch place,      based on the direction, asc or desc: */      if (dir == "asc") {        if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {          // If so, mark as a switch and break the loop:          shouldSwitch = true;          break;        }      } else if (dir == "desc") {        if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {          // If so, mark as a switch and break the loop:          shouldSwitch = true;          break;        }      }    }    if (shouldSwitch) {      /* If a switch has been marked, make the switch      and mark that a switch has been done: */      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);      switching = true;      // Each time a switch is done, increase this count by 1:      switchcount ++;    } else {      /* If no switching has been done AND the direction is "asc",      set the direction to "desc" and run the while loop again. */      if (switchcount == 0 && dir == "asc") {        dir = "desc";        switching = true;      }    }  }}</script>
```

* * *

## Sort Table Numerically

```javascript
if (Number(x.innerHTML) > Number(y.innerHTML)) {  shouldSwitch = true;  break;}
```