# How TO - Center Tables

* * *

Learn how to center a table with CSS.

* * *

Centered table:

Firstname

Lastname

Age

Jill

Smith

50

Eve

Jackson

94

John

Doe

80

* * *

## How To Center Tables

##### Step 1) Add HTML:

```javascript
<table class="center">  <tr>    <th>Firstname</th>    <th>Lastname</th>    <th>Age</th>  </tr>  <tr>    <td>Jill</td>    <td>Smith</td>    <td>50</td>  </tr>  <tr>    <td>Eve</td>    <td>Jackson</td>    <td>94</td>  </tr>  <tr>    <td>John</td>    <td>Doe</td>    <td>80</td>  </tr></table>
```

* * *

##### Step 2) Add CSS:

To center a table, set left and right margin to `auto`:

```javascript
.center {  margin-left: auto;  margin-right: auto;}
```

Note that a table cannot be centered if the width is set to 100% (full-width).

**Tip:** Go to our [CSS Tables Tutorial](https://www.w3schools.com/css/css_table.asp) to learn more about how to style tables. 

* * *

* * *