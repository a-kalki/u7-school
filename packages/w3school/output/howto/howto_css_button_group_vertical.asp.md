# How TO - Vertical Button Group

* * *

Learn how to create a vertical "button group" with CSS.

* * *

## Vertical Button Groups

Group a series of buttons in a vertical button group:

Apple Samsung Sony

  

Apple Samsung Sony

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_button_group_vertical)

* * *

## How To Create a Vertical Button Group

##### Step 1) Add HTML:

```javascript
<div class="btn-group">  <button>Apple</button>  <button>Samsung</button>  <button>Sony</button></div>
```

* * *

##### Step 2) Add CSS:

```javascript
.btn-group button {  background-color: #04AA6D; /* Green background */  border: 1px solid green; /* Green border */  color: white; /* White text */  padding: 10px 24px; /* Some padding */  cursor: pointer; /* Pointer/hand icon */  width: 50%; /* Set a width if needed */  display: block; /* Make the buttons appear below each other */}.btn-group button:not(:last-child) {  border-bottom: none; /* Prevent double borders */}/* Add a background color on hover */.btn-group button:hover {  background-color: #3e8e41;}
```

* * *

**Tip:** Go to our [CSS Buttons Tutorial](https://www.w3schools.com/css/css3_buttons.asp) to learn more about how to style buttons.

* * *

* * *