# How TO - Comparison Table

* * *

Learn how to create a comparison table with CSS.

* * *

Features

Basic

Pro

Sample text

Sample text

Sample text

Sample text

Sample text

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_comparison_table)

* * *

## How To Create a Comparison Table

##### Step 1) Add HTML:

```javascript
<!-- Font Awesome Icon Library --><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"><table>  <tr>    <th style="width:50%">Features</th>    <th>Basic</th>    <th>Pro</th>  </tr>  <tr>    <td>Sample text</td>    <td><i class="fa fa-remove"></i></td>    <td><i class="fa fa-check"></i></td>  </tr>  <tr>    <td>Sample text</td>    <td><i class="fa fa-check"></i></td>    <td><i class="fa fa-check"></i></td>  </tr></table>
```

* * *

* * *

##### Step 2) Add CSS:

```javascript
/* Style the table */table {  border-collapse: collapse;  border-spacing: 0;  width: 100%;  border: 1px solid #ddd;}/* Style table headers and table data */th, td {  text-align: center;  padding: 16px;}th:first-child, td:first-child {  text-align: left;}/* Zebra-striped table rows */tr:nth-child(even) {  background-color: #f2f2f2}.fa-check {  color: green;}.fa-remove {  color: red;}
```