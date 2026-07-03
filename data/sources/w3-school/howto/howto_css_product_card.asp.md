# How TO - Product Card

* * *

Learn how to create a product card with CSS.

* * *

![Denim Jeans](https://www.w3schools.com/w3images/jeans3.jpg)

# Tailored Jeans

$19.99

Some text about the jeans. Super slim and comfy lorem ipsum lorem jeansum. Lorem jeamsun denim lorem jeansum.

Add to Cart

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_product_card)

* * *

## How To Create a Product Card

##### Step 1) Add HTML:

```javascript
<div class="card">  <img src="jeans3.jpg" alt="Denim Jeans" style="width:100%">  <h1>Tailored Jeans</h1>  <p class="price">$19.99</p>  <p>Some text about the jeans..</p>  <p><button>Add to Cart</button></p></div>
```

* * *

* * *

##### Step 2) Add CSS:

```javascript
.card {  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);  max-width: 300px;  margin: auto;  text-align: center;  font-family: arial;}.price {  color: grey;  font-size: 22px;}.card button {  border: none;  outline: 0;  padding: 12px;  color: white;  background-color: #000;  text-align: center;  cursor: pointer;  width: 100%;  font-size: 18px;}.card button:hover {  opacity: 0.7;}
```