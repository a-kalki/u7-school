# CSS Pagination Examples

* * *

## CSS Pagination

Learn how to create a responsive pagination using CSS.

If you have a website with lots of pages, you may want to add some sort of pagination on each page.

Pagination is typically a series of links, wrapped in an unordered list (`<ul>`). Each link represents an individual page number. In addition there are "previous" and "next" controls:

*   [«](css3_pagination.asp.html#)
*   [1](css3_pagination.asp.html#)
*   [2](css3_pagination.asp.html#)
*   [3](css3_pagination.asp.html#)
*   [4](css3_pagination.asp.html#)
*   [5](css3_pagination.asp.html#)
*   [»](css3_pagination.asp.html#)

```javascript
.pagination {  display: flex;  justify-content: center;  list-style: none; /* remove list bullets */  padding: 0px;}.pagination li a {  display: block; /* let links fill the list item */  padding: 8px 12px;  text-decoration: none;  border: 1px solid gray;  color: black;  margin: 0 4px;  border-radius: 5px; /* add rounded borders */}
```

### Example Explained

Style the pagination container with:

*   `display: flex;` to arrange the page numbers horizontally
*   `justify-content: center;` to center align them
*   `list-style: none;` to remove the list bullets

The style the `<a>` elements within the `<li>` elements for the look of the page numbers, with properties like `display`, `padding`, `text-decoration`, `border`, `background-color`, `color`, `font-size`, and `border-radius`.

* * *

## Pagination With an Active Class

Highlight the currently active page with an `.active` class, to indicate which page the user is on:

*   [«](css3_pagination.asp.html#)
*   [1](css3_pagination.asp.html#)
*   [2](css3_pagination.asp.html#)
*   [3](css3_pagination.asp.html#)
*   [4](css3_pagination.asp.html#)
*   [5](css3_pagination.asp.html#)
*   [»](css3_pagination.asp.html#)

```javascript
.pagination li a.active {  background-color: #4CAF50;  color: white;}
```

* * *

* * *

## Pagination With a Disabled Class

If the user are currently on the last page, the "Next" button should be disabled.

Here, we add a `.disabled` class, and sets the `[color](https://www.w3schools.com/cssref/pr_text_color.php)` , `[cursor](https://www.w3schools.com/cssref/pr_class_cursor.php)` and `[pointer-events](https://www.w3schools.com/cssref/css3_pr_pointer-events.php)` properties, to make the "Next" button disabled:

*   [«](css3_pagination.asp.html#)
*   [1](css3_pagination.asp.html#)
*   [2](css3_pagination.asp.html#)
*   [3](css3_pagination.asp.html#)
*   [4](css3_pagination.asp.html#)
*   [5](css3_pagination.asp.html#)
*   [»](css3_pagination.asp.html#)

```javascript
.pagination li a.disabled {  color: #dddddd;  cursor: not-allowed;  pointer-events: none;}
```

* * *

## Pagination Subpages

Continue learning about CSS pagination:

*   [Pagination Styles](css3_pagination_styles.asp.html) - hover effects, transitions, breadcrumbs

* * *

* * *