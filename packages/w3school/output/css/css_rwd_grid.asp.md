# Responsive Web Design - Building a Grid View

* * *

## What is a Grid-View?

Many web pages are based on a [grid-view](css_grid.asp.html), which means that the page is divided into rows and columns.

A responsive grid-view often has 6 or 12 columns, and will shrink and expand as you resize the browser window.

* * *

## Building a Grid View

Lets start building a grid-view.

First ensure that all HTML elements have the `box-sizing` property set to `border-box`. This makes sure that the padding and border are included in the total width and height of the elements.

Add the following at the top of your CSS:

\* {  
  box-sizing: border-box;  
}

Read more about the `box-sizing` property in our [CSS Box Sizing](css3_box-sizing.asp.html) chapter.

* * *

## The HTML

We create a grid container with five grid items (header, menu, content, facts, footer):

```javascript
<div class="grid-container"><div class="header"><h1>Chania</h1></div><div class="menu">  <ul>    <li>The Flight</li>    <li>The City</li>    <li>The Island</li>    <li>The Food</li>  </ul></div><div class="content">  <h1>The City</h1>  <p>Chania is the capital of the Chania region on the island of Crete.</p>  <p>The city can be divided in two parts, the old town and the modern city. The old town is situated next to the old harbour and is the matrix around which the whole urban area was developed.</p>  <p>Chania lies along the north west coast of the island Crete.</p></div><div class="facts">  <h2>Facts:</h2>  <ul>    <li>Chania is a city on the island of Crete</li>    <li>Crete is a Greek island in the Mediterranean Sea</li>  </ul></div><div class="footer"><p>A footer.</p></div></div>
```

* * *

* * *

## The CSS

Add some styles and colors to make it look better:

**Note:** Look at the next chapter to add mediaqueries and breakpoints for different screen sizes!

```javascript
* {  box-sizing: border-box;}body {  font-family: "Lucida Sans", sans-serif;  font-size: 17px;}.grid-container {  display: grid;  grid-template-areas:  'header'  'menu'  'main'  'facts'  'footer';  background-color: white;  gap: 10px;}.header {  grid-area: header;  background-color: purple;  text-align: center;  color: #ffffff;}.header > h1 {  font-size: 40px;}.menu {  grid-area: menu;}.menu ul {  list-style-type: none;  margin: 0;  padding: 0;}.menu li {  padding: 8px;  margin-bottom: 7px;  background-color: #33b5e5;  color: #ffffff;}.menu li:hover {  background-color: #0099cc;}.content {  grid-area: main;}.content > h1 {  font-size: 30px;  margin-bottom: 7px;}.content > p {  margin-bottom: 7px;}.facts {  grid-area: facts;  border: 1px solid #0099cc;  background-color: beige;  padding: 10px;}.facts > h2 {  font-size: 20px;}.facts li {  margin-bottom: 5px;}.footer {  grid-area: footer;  background-color: #0099cc;  color: #ffffff;  text-align: center;}
```

* * *

* * *