# How TO - Portfolio Gallery

* * *

Learn how to create a responsive portfolio gallery grid with CSS.

* * *

## Portfolio Gallery

Learn how to create a responsive portfolio gallery that varies between 4 columns, 2 columns and full-width columns depending on screen width:

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_portfolio_gallery)

* * *

## How To Create a Portfolio Website

##### Step 1) Add HTML:

```javascript
<!-- MAIN (Center website) --><div class="main"><h1>MYLOGO.COM</h1><hr><h2>PORTFOLIO</h2><p>Resize the browser window to see the responsive effect.</p><!-- Portfolio Gallery Grid --><div class="row">  <div class="column">    <div class="content">      <img src="mountains.jpg" alt="Mountains" style="width:100%">      <h3>My Work</h3>      <p>Lorem ipsum..</p>    </div>  </div>  <div class="column">    <div class="content">      <img src="lights.jpg" alt="Lights" style="width:100%">      <h3>My Work</h3>      <p>Lorem ipsum..</p>    </div>  </div>  <div class="column">    <div class="content">      <img src="nature.jpg" alt="Nature" style="width:100%">      <h3>My Work</h3>      <p>Lorem ipsum..</p>    </div>  </div>  <div class="column">    <div class="content">      <img src="mountains.jpg" alt="Mountains" style="width:100%">      <h3>My Work</h3>      <p>Lorem ipsum..</p>    </div>  </div></div><div class="content">  <img src="bear.jpg" alt="Bear" style="width:100%">  <h3>Some Other Work</h3>  <p>Lorem ipsum..</p></div><!-- END MAIN --></div>
```

* * *

* * *

##### Step 2) Add CSS:

```javascript
* {  box-sizing: border-box;}body {  background-color: #f1f1f1;  padding: 20px;  font-family: Arial;}/* Center website */.main {  max-width: 1000px;  margin: auto;}h1 {  font-size: 50px;  word-break: break-all;}.row {  margin: 8px -16px;}/* Add padding BETWEEN each column (if you want) */.row,.row > .column {  padding: 8px;}/* Create four equal columns that floats next to each other */.column {  float: left;  width: 25%;}/* Clear floats after rows */.row:after {  content: "";  display: table;  clear: both;}/* Content */.content {  background-color: white;  padding: 10px;}/* Responsive layout - makes a two column-layout instead of four columns */@media screen and (max-width: 900px) {  .column {    width: 50%;  }}/* Responsive layout - makes the two columns stack on top of each other instead of next to each other */@media screen and (max-width: 600px) {  .column {    width: 100%;  }}
```

**Tip:** Also check out [Portfolio Gallery with Filtering](howto_js_portfolio_filter.asp.html)