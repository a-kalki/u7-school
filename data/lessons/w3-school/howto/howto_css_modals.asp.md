# How TO - CSS/JS Modal

* * *

Learn how to create a Modal Box with CSS and JavaScript.

* * *

## How To Create a Modal Box

A modal is a dialog box/popup window that is displayed on top of the current page:

Open Modal

×

## Modal Header

Hello World!

Modals are awesome!

Modal Footer

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_modal)

* * *

##### Step 1) Add HTML:

```javascript
<!-- Trigger/Open The Modal --><button id="myBtn">Open Modal</button><!-- The Modal --><div id="myModal" class="modal">  <!-- Modal content -->  <div class="modal-content">    <span class="close">&times;</span>    <p>Some text in the Modal..</p>  </div></div>
```

* * *

##### Step 2) Add CSS:

```javascript
/* The Modal (background) */.modal {  display: none; /* Hidden by default */  position: fixed; /* Stay in place */  z-index: 1; /* Sit on top */  left: 0;  top: 0;  width: 100%; /* Full width */  height: 100%; /* Full height */  overflow: auto; /* Enable scroll if needed */  background-color: rgb(0,0,0); /* Fallback color */  background-color: rgba(0,0,0,0.4); /* Black w/ opacity */}/* Modal Content/Box */.modal-content {  background-color: #fefefe;  margin: 15% auto; /* 15% from the top and centered */  padding: 20px;  border: 1px solid #888;  width: 80%; /* Could be more or less, depending on screen size */}/* The Close Button */.close {  color: #aaa;  float: right;  font-size: 28px;  font-weight: bold;}.close:hover,.close:focus {  color: black;  text-decoration: none;  cursor: pointer;}
```

* * *

##### Step 3) Add JavaScript:

```javascript
// Get the modalvar modal = document.getElementById("myModal");// Get the button that opens the modalvar btn = document.getElementById("myBtn");// Get the <span> element that closes the modalvar span = document.getElementsByClassName("close")[0];// When the user clicks on the button, open the modalbtn.onclick = function() {  modal.style.display = "block";}// When the user clicks on <span> (x), close the modalspan.onclick = function() {  modal.style.display = "none";}// When the user clicks anywhere outside of the modal, close itwindow.onclick = function(event) {  if (event.target == modal) {    modal.style.display = "none";  }}
```

* * *

* * *

## Add Header and Footer

Add a class for modal-header, modal-body and modal-footer:

```javascript
<!-- Modal content --><div class="modal-content">  <div class="modal-header">    <span class="close">&times;</span>    <h2>Modal Header</h2>  </div>  <div class="modal-body">    <p>Some text in the Modal Body</p>    <p>Some other text...</p>  </div>  <div class="modal-footer">    <h3>Modal Footer</h3>  </div></div>
```

Style the modal header, body and footer, and add animation (slide in the modal):

```javascript
/* Modal Header */.modal-header {  padding: 2px 16px;  background-color: #5cb85c;  color: white;}/* Modal Body */.modal-body {padding: 2px 16px;}/* Modal Footer */.modal-footer {  padding: 2px 16px;  background-color: #5cb85c;  color: white;}/* Modal Content */.modal-content {  position: relative;  background-color: #fefefe;  margin: auto;  padding: 0;  border: 1px solid #888;  width: 80%;  box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2),0 6px 20px 0 rgba(0,0,0,0.19);  animation-name: animatetop;  animation-duration: 0.4s}/* Add Animation */@keyframes animatetop {  from {top: -300px; opacity: 0}  to {top: 0; opacity: 1}}
```

* * *

## Bottom Modal ("Bottom sheets")

An example on how to create a full-width modal that slides in from the bottom:

```javascript

```

**Tip:** Also check out [Modal Images](howto_css_modal_images.asp.html) and [Lightbox](howto_js_lightbox.asp.html).