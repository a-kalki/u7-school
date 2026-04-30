# HTML Tables

* * *

HTML tables allow web developers to arrange data into rows and columns.

* * *

```javascript

```

* * *

## Define an HTML Table

A table in HTML consists of table cells inside rows and columns.

```javascript
<table>  <tr>    <th>Company</th>    <th>Contact</th>    <th>Country</th>  </tr>  <tr>    <td>Alfreds Futterkiste</td>    <td>Maria Anders</td>    <td>Germany</td>  </tr>  <tr>    <td>Centro comercial Moctezuma</td>    <td>Francisco Chang</td>    <td>Mexico</td>  </tr></table>
```

* * *

## Table Cells

Each table cell is defined by a `<td>` and a `</td>` tag.

`td` stands for table data.

Everything between `<td>` and `</td>` is the content of a table cell.

```javascript
<table>  <tr>    <td>Emil</td>    <td>Tobias</td>    <td>Linus</td>  </tr></table>
```

**Note:** A table cell can contain all sorts of HTML elements: text, images, lists, links, other tables, etc.

* * *

* * *

## Table Rows

Each table row starts with a `<tr>` and ends with a `</tr>` tag.

`tr` stands for table row.

```javascript
<table>  <tr>    <td>Emil</td>    <td>Tobias</td>    <td>Linus</td>  </tr>  <tr>    <td>16</td>    <td>14</td>    <td>10</td>  </tr></table>
```

You can have as many rows as you like in a table; just make sure that the number of cells are the same in each row.

**Note:** There are times when a row can have less or more cells than another. You will learn about that in a later chapter.

* * *

## Table Headers

Sometimes you want your cells to be table header cells. In those cases use the `<th>` tag instead of the `<td>` tag:

`th` stands for table header.

```javascript
<table>  <tr>    <th>Person 1</th>    <th>Person 2</th>    <th>Person 3</th>  </tr>  <tr>    <td>Emil</td>    <td>Tobias</td>    <td>Linus</td>  </tr>  <tr>    <td>16</td>    <td>14</td>    <td>10</td>  </tr></table>
```

By default, the text in `<th>` elements are bold and centered, but you can change that with CSS.

* * *

* * *

## HTML Table Tags

Tag

Description

[<table>](https://www.w3schools.com/tags/tag_table.asp)

Defines a table

[<th>](https://www.w3schools.com/tags/tag_th.asp)

Defines a header cell in a table

[<tr>](https://www.w3schools.com/tags/tag_tr.asp)

Defines a row in a table

[<td>](https://www.w3schools.com/tags/tag_td.asp)

Defines a cell in a table

[<caption>](https://www.w3schools.com/tags/tag_caption.asp)

Defines a table caption

[<colgroup>](https://www.w3schools.com/tags/tag_colgroup.asp)

Specifies a group of one or more columns in a table for formatting

[<col>](https://www.w3schools.com/tags/tag_col.asp)

Specifies column properties for each column within a <colgroup> element

[<thead>](https://www.w3schools.com/tags/tag_thead.asp)

Groups the header content in a table

[<tbody>](https://www.w3schools.com/tags/tag_tbody.asp)

Groups the body content in a table

[<tfoot>](https://www.w3schools.com/tags/tag_tfoot.asp)

Groups the footer content in a table

For a complete list of all available HTML tags, visit our [HTML Tag Reference](https://www.w3schools.com/tags/default.asp).

* * *

## Video: HTML Tables

  [![Tutorial on YouTube](images/yt_logo_rgb_dark.png)

 ![Tutorial on YouTube](images/14_html_tables.png)](https://youtu.be/e62D-aayveY&list=PLP9IO4UYNF0VdAajP_5pYG-jG2JRrG72s)

* * *

#### LEARN MORE

[Styling Tables](../css/css_table.asp.html)  
[Filter Table](https://www.w3schools.com/howto/howto_js_filter_table.asp)  
[Sort Table](https://www.w3schools.com/howto/howto_js_sort_table.asp)  
[Responsive Table](https://www.w3schools.com/howto/howto_css_table_responsive.asp)  
[Zebra Striped Table](https://www.w3schools.com/howto/howto_css_table_zebra.asp)