# How TO - Alerts

* * *

Learn how to create alert messages with CSS.

* * *

## Alerts

Alert messages can be used to notify the user about something special: danger, success, information or warning.

× **Danger!** Indicates a dangerous or potentially negative action.

× **Success!** Indicates a successful or positive action.

× **Info!** Indicates a neutral informative change or action.

× **Warning!** Indicates a warning that might need attention.

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_alert)

* * *

## Create An Alert Message

##### Step 1) Add HTML:

```javascript
<div class="alert">  <span class="closebtn" onclick="this.parentElement.style.display='none';">&times;</span>  This is an alert box.</div>
```

If you want the ability to close the alert message, add a <span> element with an `onclick` attribute that says "when you click on me, hide my parent element" - which is the container <div> (class="alert").

**Tip:** Use the HTML entity "`&times;`" to create the letter "x".

* * *

* * *

##### Step 2) Add CSS:

Style the alert box and the close button:

```javascript
/* The alert message box */.alert {  padding: 20px;  background-color: #f44336; /* Red */  color: white;  margin-bottom: 15px;}/* The close button */.closebtn {  margin-left: 15px;  color: white;  font-weight: bold;  float: right;  font-size: 22px;  line-height: 20px;  cursor: pointer;  transition: 0.3s;}/* When moving the mouse over the close button */.closebtn:hover {  color: black;}
```

* * *

## Many Alerts

If you have many alert messages on a page, you can add the following script to close different alerts without using the onclick attribute on each <span> element.

And, if you want the alerts to slowly fade out when you click on them, add `opacity` and `transition` to the `alert` class:

```javascript
<style>.alert {  opacity: 1;  transition: opacity 0.6s; /* 600ms to fade out */}</style><script>// Get all elements with class="closebtn"var close = document.getElementsByClassName("closebtn");var i;// Loop through all close buttonsfor (i = 0; i < close.length; i++) {  // When someone clicks on a close button  close[i].onclick = function(){    // Get the parent of <span class="closebtn"> (<div class="alert">)    var div = this.parentElement;    // Set the opacity of div to 0 (transparent)    div.style.opacity = "0";    // Hide the div after 600ms (the same amount of milliseconds it takes to fade out)    setTimeout(function(){ div.style.display = "none"; }, 600);  }}</script>
```

**Tip:** Also check out [Notes](howto_css_notes.asp.html).