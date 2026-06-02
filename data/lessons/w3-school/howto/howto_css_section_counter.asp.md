# How TO - Section Counter

* * *

Learn how to create a "section counter" with CSS.

* * *

## Section Counter

A section counter is used to tell people how well their business is going, by displaying interesting numbers:

### 11+

Partners

### 55+

Projects

### 100+

Happy Clients

### 100+

Meetings

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_section_counter)

* * *

## How To Create a Section Counter

##### Step 1) Add HTML:

```javascript
<div class="row">  <div class="column">    <div class="card">      <p><i class="fa fa-user"></i></p>      <h3>11+</h3>      <p>Partners</p>    </div>  </div>  <div class="column">    <div class="card">      <p><i class="fa fa-check"></i></p>      <h3>55+</h3>      <p>Projects</p>    </div>  </div>  <div class="column">    <div class="card">      <p><i class="fa fa-smile-o"></i></p>      <h3>100+</h3>      <p>Happy Clients</p>    </div>  </div>  <div class="column">    <div class="card">      <p><i class="fa fa-coffee"></i></p>      <h3>100+</h3>      <p>Meetings</p>    </div>  </div></div>
```

* * *

* * *

##### Step 2) Add CSS:

```javascript
.* {  box-sizing: border-box;}/* Float four columns side by side */.column {  float: left;  width: 25%;  padding: 0 5px;}.row {margin: 0 -5px;}/* Clear floats after the columns */.row:after {  content: "";  display: table;  clear: both;}/* Responsive columns */@media screen and (max-width: 600px) {  .column {    width: 100%;    display: block;    margin-bottom: 10px;  }}/* Style the counter cards */.card {  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);  padding: 16px;  text-align: center;  background-color: #444;  color: white;}.fa {font-size:50px;}
```