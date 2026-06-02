# How TO - Callout Message

* * *

Learn how to create callout messages with CSS.

* * *

## Callout

A callout message is often positioned at the bottom of a page to notify the user about something special: tips/tricks, discounts, action needed, other.

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_callout)

* * *

## Create a Callout

##### Step 1) Add HTML:

```javascript
<div class="callout">  <div class="callout-header">Callout Header</div>  <span class="closebtn" onclick="this.parentElement.style.display='none';">&times;</span>  <div class="callout-container">    <p>Some text...</p>  </div></div>
```

If you want the ability to close the callout message, add a <span> element with an `onclick` attribute that says "when you click on me, hide my parent element" - which is the container <div> (class="alert").

**Tip:** Use the HTML entity "`&times;`" to create the letter "x".

* * *

* * *

##### Step 2) Add CSS:

Style the callout box and the close button:

```javascript
/* Callout box - fixed position at the bottom of the page */.callout {  position: fixed;  bottom: 35px;  right: 20px;  margin-left: 20px;  max-width: 300px;}/* Callout header */.callout-header {  padding: 25px 15px;  background: #555;  font-size: 30px;  color: white;}/* Callout container/body */.callout-container {  padding: 15px;  background-color: #ccc;  color: black}/* Close button */.closebtn {  position: absolute;  top: 5px;  right: 15px;  color: white;  font-size: 30px;  cursor: pointer;}/* Change color on mouse-over */.closebtn:hover {  color: lightgrey;}
```

**Tip:** Also check out [Alert Messages](howto_js_alert.asp.html).

**Tip:** Also check out [Notes](howto_css_notes.asp.html).