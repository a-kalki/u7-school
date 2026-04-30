# CSS 12-Column Grid Layout

* * *

## CSS 12-Column Grid Layout

A 12-column grid is a common and flexible method for structuring web page content, particularly for responsive web design.

The 12-column grid system divides the available horizontal space into 12 equal-width columns, allowing for precise placement and sizing of elements within the layout.

* * *

## Benefits of a 12-Column Grid

*   **Flexibility:** The number 12 is highly divisible. Designers can easily create designs with halves, thirds, and quarters (2 columns of 6, 3 columns of 4, 4 columns of 3).
*   **Responsiveness:** A 12-column grid is ideal for building responsive websites that adapt to different screen sizes (desktop, tablet, or mobile) with mediaqueries. This provides a consistent user experience across all platforms.
*   **Efficiency:** Having a pre-defined structure speeds up the design process.

Here is how to create a basic 12-column CSS Grid layout:

* * *

## Define the Grid Container

Apply `display: grid;` to the grid container.

* * *

## Create the 12 Columns

Use the `grid-template-columns` property to define the 12 columns.

The code `repeat(12, [col-start] 1fr);` creates a 12-column grid with equal-width, and names the start line of each column track `col-start`.

*   `repeat(12,..)`: Tells the grid to repeat the following track definition 12 times, resulting in 12 columns.
*   `[col-start]`: This creates a named grid line. Because it is repeated 12 times, you will have 12 lines named col-start. This is useful for placing grid items at specific start points within the grid.
*   `1fr`: A fractional unit that represents one fraction of the total available space in the grid container. By using 1fr, each of the 12 columns will be an equal, fluid width.

* * *

## Place the Grid Items

Grid items can then be placed and sized across these 12 columns using `grid-column`.

*   To make a grid item span a certain number of columns, use `grid-column: span <number>;` or `grid-column: <start-line> / span <number>;`.
*   You can also define the start and end grid lines for an item using `grid-column: <start-line> / <end-line>;`.

* * *

* * *

## Use Mediaqueries to Add Breakpoints

Always design for mobile first: Here we display the sections in the source order (from top to bottom) for screens less than 576 pixels wide.

Then, we go to a two-column layout for screens between 576 and 767 pixels wide.

Then, we go to a three-column layout for screens over 767 pixels wide.

```javascript
* {  box-sizing: border-box;}.container {  display: grid;  grid-template-columns: repeat(12, [col-start] 1fr);  gap: 20px;}nav ul {  list-style: none;  margin: 0;  padding: 0;}/* Mobile first */.container > * {  border: 1px solid green;  background-color: beige;  padding: 10px;  grid-column: col-start / span 12;}@media (min-width: 576px) {  .sidebar {    grid-column: col-start / span 3;    grid-row: 3;  }  .ads {    grid-column: col-start / span 3;  }  .content, .footer {    grid-column: col-start 4 / span 9;  }  nav ul {    display: flex;    justify-content: space-between;  }}@media (min-width: 768px) {  .nav {    grid-column: col-start / span 2;    grid-row: 2 / 4;  }  .content {    grid-column: col-start 3 / span 8;    grid-row: 2 / 4;  }  .sidebar {    grid-column: col-start 11 / span 2;  }  .ads {    grid-column: col-start 11 / span 2;  }  .footer {    grid-column: col-start / span 12;  }  nav ul {    flex-direction: column;  }}
```