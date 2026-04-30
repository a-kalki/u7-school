# How TO - Coupon

* * *

Learn how to create a "coupon" with CSS.

* * *

### Company Logo

![Avatar](https://www.w3schools.com/w3images/hamburger.jpg)

## **20% OFF YOUR PURCHASE**

Lorem ipsum dolor sit amet, et nam pertinax gloriatur. Sea te minim soleat senserit, ex quo luptatum tacimates voluptatum, salutandi delicatissimi eam ea. In sed nullam laboramus appellantur, mei ei omnis dolorem mnesarchum.

Use Promo Code: BOH232

Expires: Jan 03, 2021

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_coupon)

* * *

## How To Create a Coupon

##### Step 1) Add HTML:

```javascript
<div class="coupon">  <div class="container">    <h3>Company Logo</h3>  </div>  <img src="hamburger.jpg" alt="Avatar" style="width:100%;">  <div class="container" style="background-color:white">    <h2><b>20% OFF YOUR PURCHASE</b></h2>    <p>Lorem ipsum..</p>  </div>  <div class="container">    <p>Use Promo Code: <span class="promo">BOH232</span></p>    <p class="expire">Expires: Jan 03, 2021</p>  </div></div>
```

* * *

* * *

##### Step 2) Add CSS:

```javascript
.coupon {  border: 5px dotted #bbb; /* Dotted border */  width: 80%;  border-radius: 15px; /* Rounded border */  margin: 0 auto; /* Center the coupon */  max-width: 600px;}.container {  padding: 2px 16px;  background-color: #f1f1f1;}.promo {  background: #ccc;  padding: 3px;}.expire {  color: red;}
```