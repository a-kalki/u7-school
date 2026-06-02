# How TO - Responsive Zig Zag Layout

* * *

Learn how to create a responsive zig zag (alternating) layout with CSS.

* * *

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_zig_zag_layout&stacked=h)

* * *

## How To Create a Zig Zag Layout

##### Step 1) Add HTML:

```javascript
<div class="container">  <div class="row">    <div class="column-66">      ...    </div>    <div class="column-33">      ...    </div>  </div></div><div class="container">  <div class="row">    <div class="column-33">      ...    </div>    <div class="column-66">      ...    </div>  </div></div>
```

* * *

* * *

##### Step 2) Add CSS:

```javascript
* {  box-sizing: border-box;}.container {  padding: 64px;}/* Clear floats */.row:after {  content: "";  display: table;  clear: both}/* 2/3 column */.column-66 {  float: left;  width: 66.66666%;  padding: 20px;}/* 1/3 column */.column-33 {  float: left;  width: 33.33333%;  padding: 20px;}/* Add responsiveness - make the columns appear on top of each other instead of next to each other on small screens */@media screen and (max-width: 1000px) {  .column-66,  .column-33 {    width: 100%;    text-align: center;  }}
```

**Tip:** Go to our [CSS Website Layout](https://www.w3schools.com/css/css_website_layout.asp) Tutorial to learn more about website layouts.

**Tip:** Go to our [CSS Responsive Web Design](https://www.w3schools.com/css/css_rwd_intro.asp) Tutorial to learn more about responsive web design and grids.