# How TO - Popup

* * *

Learn how to create popups with CSS and JavaScript.

* * *

Click me to toggle the popup! A Simple Popup!

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_popup)

* * *

## How To Create Popups

##### Step 1) Add HTML:

```javascript
<div class="popup" onclick="myFunction()">Click me!  <span class="popuptext" id="myPopup">Popup text...</span></div>
```

* * *

##### Step 2) Add CSS:

```javascript
/* Popup container */.popup {  position: relative;  display: inline-block;  cursor: pointer;}/* The actual popup (appears on top) */.popup .popuptext {  visibility: hidden;  width: 160px;  background-color: #555;  color: #fff;  text-align: center;  border-radius: 6px;  padding: 8px 0;  position: absolute;  z-index: 1;  bottom: 125%;  left: 50%;  margin-left: -80px;}/* Popup arrow */.popup .popuptext::after {  content: "";  position: absolute;  top: 100%;  left: 50%;  margin-left: -5px;  border-width: 5px;  border-style: solid;  border-color: #555 transparent transparent transparent;}/* Toggle this class when clicking on the popup container (hide and show the popup) */.popup .show {  visibility: visible;  -webkit-animation: fadeIn 1s;  animation: fadeIn 1s}/* Add animation (fade in the popup) */@-webkit-keyframes fadeIn {  from {opacity: 0;}  to {opacity: 1;}}@keyframes fadeIn {  from {opacity: 0;}  to {opacity:1 ;}}
```

* * *

* * *

##### Step 3) Add JavaScript:

```javascript
<script>// When the user clicks on <div>, open the popupfunction myFunction() {  var popup = document.getElementById("myPopup");  popup.classList.toggle("show");}</script>
```

* * *

## Related Pages

**Tip:** Tooltips are similar to popups. Go to our [How To Create Tooltips Tutorial](howto_css_tooltip.asp.html) to learn about tooltips.

**Tip:** Modals are also similar to popups. Go to our [How To Create Modals Tutorial](howto_css_modals.asp.html) to learn about modals.