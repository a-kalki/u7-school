# How TO - Column Cards

* * *

Learn how to create responsive column cards with CSS.

* * *

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_column_cards)

* * *

## How To Create Column Cards

##### Step 1) Add HTML:

```javascript
<div class="row">  <div class="column">    <div class="card">..</div>  </div>  <div class="column">    <div class="card">..</div>  </div>  <div class="column">    <div class="card">..</div>  </div>  <div class="column">    <div class="card">..</div>  </div></div>
```

* * *

* * *

##### Step 2) Add CSS:

```javascript
* {  box-sizing: border-box;}body {  font-family: Arial, Helvetica, sans-serif;}/* Float four columns side by side */.column {  float: left;  width: 25%;  padding: 0 10px;}/* Remove extra left and right margins, due to padding in columns */.row {margin: 0 -5px;}/* Clear floats after the columns */.row:after {  content: "";  display: table;  clear: both;}/* Style the counter cards */.card {  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2); /* this adds the "card" effect */  padding: 16px;  text-align: center;  background-color: #f1f1f1;}/* Responsive columns - one column layout (vertical) on small screens */@media screen and (max-width: 600px) {  .column {    width: 100%;    display: block;    margin-bottom: 20px;  }}
```

**Tip:** Go to our [CSS Website Layout](https://www.w3schools.com/css/css_website_layout.asp) Tutorial to learn more about website layouts.

**Tip:** Go to our [CSS Responsive Web Design](https://www.w3schools.com/css/css_rwd_intro.asp) Tutorial to learn more about responsive web design and grids.