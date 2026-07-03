# How TO - Responsive Pricing Table

* * *

Learn how to create a responsive pricing table with CSS.

* * *

*   Basic
*   $ 9.99 / year
*   10GB Storage
*   10 Emails
*   10 Domains
*   1GB Bandwidth
*   [Sign Up](javascript:void\(0\))

*   Pro
*   $ 24.99 / year
*   25GB Storage
*   25 Emails
*   25 Domains
*   2GB Bandwidth
*   [Sign Up](javascript:void\(0\))

*   Premium
*   $ 49.99 / year
*   50GB Storage
*   50 Emails
*   50 Domains
*   5GB Bandwidth
*   [Sign Up](javascript:void\(0\))

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_pricing_table)

* * *

## How To Create a Responsive Pricing Table

##### Step 1) Add HTML:

```javascript
<div class="columns">  <ul class="price">    <li class="header">Basic</li>    <li class="grey">$ 9.99 / year</li>    <li>10GB Storage</li>    <li>10 Emails</li>    <li>10 Domains</li>    <li>1GB Bandwidth</li>    <li class="grey"><a href="#" class="button">Sign Up</a></li>  </ul></div>
```

* * *

* * *

##### Step 2) Add CSS:

```javascript
* {  box-sizing: border-box;}/* Create three columns of equal width */.columns {  float: left;  width: 33.3%;  padding: 8px;}/* Style the list */.price {  list-style-type: none;  border: 1px solid #eee;  margin: 0;  padding: 0;  -webkit-transition: 0.3s;  transition: 0.3s;}/* Add shadows on hover */.price:hover {  box-shadow: 0 8px 12px 0 rgba(0,0,0,0.2)}/* Pricing header */.price .header {  background-color: #111;  color: white;  font-size: 25px;}/* List items */.price li {  border-bottom: 1px solid #eee;  padding: 20px;  text-align: center;}/* Grey list item */.price .grey {  background-color: #eee;  font-size: 20px;}/* The "Sign Up" button */.button {  background-color: #04AA6D;  border: none;  color: white;  padding: 10px 25px;  text-align: center;  text-decoration: none;  font-size: 18px;}/* Change the width of the three columns to 100%(to stack horizontally on small screens) */@media only screen and (max-width: 600px) {  .columns {    width: 100%;  }}
```