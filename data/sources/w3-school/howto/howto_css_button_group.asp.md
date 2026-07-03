# How TO - Button Group

* * *

Learn how to create a "button group" with CSS.

* * *

## Horizontal Button Groups

Group a series of buttons together on a single line in a button group:

Apple Samsung Sony

  

Apple Samsung Sony

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_button_group)

* * *

## How To Create a Button Group

##### Step 1) Add HTML:

```javascript
<div class="btn-group">  <button>Apple</button>  <button>Samsung</button>  <button>Sony</button></div>
```

* * *

##### Step 2) Add CSS:

```javascript
.btn-group button {  background-color: #04AA6D; /* Green background */  border: 1px solid green; /* Green border */  color: white; /* White text */  padding: 10px 24px; /* Some padding */  cursor: pointer; /* Pointer/hand icon */  float: left; /* Float the buttons side by side */}.btn-group button:not(:last-child) {  border-right: none; /* Prevent double borders */}/* Clear floats (clearfix hack) */.btn-group:after {  content: "";  clear: both;  display: table;}/* Add a background color on hover */.btn-group button:hover {  background-color: #3e8e41;}
```

* * *

* * *

## Justified / Full-width Button Group:

```javascript
<!-- Three buttons in a group --><div class="btn-group" style="width:100%">  <button style="width:33.3%">Apple</button>  <button style="width:33.3%">Samsung</button>  <button style="width:33.3%">Sony</button></div><!-- Four buttons in a group --><div class="btn-group" style="width:100%">  <button style="width:25%">Apple</button>  <button style="width:25%">Samsung</button>  <button style="width:25%">Sony</button>  <button style="width:25%">HTC</button></div>
```

**Tip:** Go to our [CSS Buttons Tutorial](https://www.w3schools.com/css/css3_buttons.asp) to learn more about how to style buttons.