# HTML and CSS Lists & Tables

* * *

## HTML & CSS: Lists & Tables

Lists group related items; tables display structured data.

Combine semantics with CSS to improve readability and accessibility.

**Note:** Structured data means information arranged in rows and columns so it is easy to scan.

* * *

## Unordered and ordered lists

Use `<ul>` for unordered lists (bullets) and `<ol>` for ordered lists (numbers).

Each item goes in an `<li>`.

```javascript
<ul class="features">
  <li>Responsive layout</li>
  <li>Semantic HTML</li>
  <li>Accessible components</li>
</ul>
<ol class="steps">
  <li>Plan content</li>
  <li>Structure markup</li>
  <li>Apply typography and layout</li>
</ol>
```

The unordered list (`<ul>`) renders bullets and the ordered list (`<ol>`) renders numbers.

Each item is an `<li>`.

More list variations: [HTML Lists](https://www.w3schools.com/html/html_lists.asp), [Unordered Lists](https://www.w3schools.com/html/html_lists_unordered.asp), [Ordered Lists](https://www.w3schools.com/html/html_lists_ordered.asp).

* * *

## Styling lists with CSS

Control bullet style, spacing, and layout using `list-style`, `padding`, and flexbox.

```javascript
.features {
  list-style: none; 
  padding: 0; 
  margin: 0; 
  display: grid; 
  gap: 12px;
}
.features li {
  padding:16px 20px; 
  background:#fff; 
  border-radius:12px; 
  box-shadow:0 10px 25px rgba(15, 23, 42, 0.08);
}
.features li::before {
  content:"✔"; 
  color:#04AA6D; 
  margin-right:12px;
}
```

These rules remove default bullets, space items with Grid `gap`, and insert a checkmark using `::before` for custom markers.

If you want to read more about CSS Lists or get an in-depth understanding, go to [CSS Lists](https://www.w3schools.com/css/css_list.asp) in the CSS tutorial.

* * *

* * *

## Description lists

Use `<dl>` with `<dt>` (term) and `<dd>` (definition) for glossaries or metadata.

```javascript
<dl class="glossary">
  <dt>HTML</dt>
  <dd>Structure of a webpage.</dd>
  <dt>CSS</dt>
  <dd>Presentation and layout.</dd>
</dl>
```

`<dl>` groups terms (`<dt>`) with definitions (`<dd>`) and is great for glossaries or metadata lists.

More: [Other List Types](https://www.w3schools.com/html/html_lists_other.asp).

* * *

## HTML tables

`<table>` organizes tabular data with rows (`<tr>`), header cells (`<th>`), and data cells (`<td>`).

**Note:** Tabular data is information best shown in a grid, such as price lists or schedules.

```javascript
<table class="pricing">
  <thead>
    <tr>
      <th scope="col">Plan</th>
      <th scope="col">Price</th>
      <th scope="col">Features</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Starter</th>
      <td>$0</td>
      <td>Basic components</td>
    </tr>
    <tr>
      <th scope="row">Pro</th>
      <td>$19</td>
      <td>Advanced layouts</td>
    </tr>
  </tbody>
</table>
```

This table uses semantic sections (`<thead>`, `<tbody>`) and header cells (`<th>`) to improve accessibility and structure.

Learn more: [HTML Tables](https://www.w3schools.com/html/html_tables.asp), [Table Headers](https://www.w3schools.com/html/html_table_headers.asp).

* * *

## Styling tables

Use CSS to highlight headers, zebra-stripe rows, and adjust spacing.

```javascript
.pricing {
  width:100%; 
  border-collapse:collapse; 
  background:#fff; 
  border-radius:12px; 
  overflow:hidden;
}
.pricing th, .pricing td {
  padding:16px 20px; 
  text-align:left;
}
.pricing thead {
  background:#04AA6D; 
  color:#fff;
}
.pricing tbody tr:nth-child(even) {
  background:#f9fafb;
}
```

Key rules: `border-collapse: collapse` removes gaps, header styling highlights labels, and `:nth-child(even)` zebra-stripes rows.

If you want to read more or get an in-depth understanding, see [CSS Tables](https://www.w3schools.com/css/css_table.asp), [CSS Table Size](https://www.w3schools.com/css/css_table_size.asp), and [CSS Table Styling](https://www.w3schools.com/css/css_table_style.asp) in the CSS tutorial.

* * *

Tables can overflow on small screens.

Wrapping them in a scroll container preserves readability.

**Note:** A scroll container lets mobile users swipe sideways instead of breaking the layout.

```javascript
.table-wrapper {
  overflow-x:auto;
}
```

Wrapping in a horizontally scrollable container (`overflow-x: auto`) keeps tables usable on small screens.

* * *

## Accessibility tips

*   Always use `<th>` for headers and add the `scope` attribute.
*   Provide captions with `<caption>` when necessary.
*   Keep tables for data, not layout.

**Note:** The `scope` attribute tells assistive tech which header belongs to which row or column.

This helps screen readers and other assistive technologies to provide a better user experience.

* * *

## Course outline with list and table

This demo shows a topic list paired with a simple table.

It uses semantic tags to keep content scannable.

Syntax highlights: list marker customization and basic table structure with borders and header styles.

```javascript
<!DOCTYPE html>
<head>
<link rel="stylesheet" href="styles.css" type="text/css">
</head>
<body>
  <h1>Course Outline</h1>
  <ul>
    <li>HTML Basics</li>
    <li>CSS Essentials</li>
    <li>Responsive Layouts</li>
  </ul>
  <table>
    <tr><th>Module</th><th>Duration</th></tr>
    <tr><td>Getting Started</td><td>2 hrs</td></tr>
    <tr><td>Flexbox & Grid</td><td>3 hrs</td></tr>
  </table>
</body>
</html>
```

The list uses square bullets while the table collapses borders for a clean grid, with colored headers to improve readability.

* * *

* * *