# How TO - Popup Chat Window

* * *

Learn how to create a popup chat window with CSS and JavaScript.

* * *

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_popup_chat)

* * *

## How To Create a Popup Chat

##### Step 1) Add HTML

Use a <form> element to process the input. You can learn more about this in our [PHP](https://www.w3schools.com/php/default.asp) tutorial.

```javascript
<div class="chat-popup" id="myForm">  <form action="/action_page.php" class="form-container">    <h1>Chat</h1>    <label for="msg"><b>Message</b></label>    <textarea placeholder="Type message.." name="msg" required></textarea>    <button type="submit" class="btn">Send</button>    <button type="button" class="btn cancel" onclick="closeForm()">Close</button>  </form></div>
```

* * *

* * *

##### Step 2) Add CSS:

```javascript
{box-sizing: border-box;}/* Button used to open the chat form - fixed at the bottom of the page */.open-button {  background-color: #555;  color: white;  padding: 16px 20px;  border: none;  cursor: pointer;  opacity: 0.8;  position: fixed;  bottom: 23px;  right: 28px;  width: 280px;}/* The popup chat - hidden by default */.form-popup {  display: none;  position: fixed;  bottom: 0;  right: 15px;  border: 3px solid #f1f1f1;  z-index: 9;}/* Add styles to the form container */.form-container {  max-width: 300px;  padding: 10px;  background-color: white;}/* Full-width textarea */.form-container textarea {  width: 100%;  padding: 15px;  margin: 5px 0 22px 0;  border: none;  background: #f1f1f1;  resize: none;  min-height: 200px;}/* When the textarea gets focus, do something */.form-container textarea:focus {  background-color: #ddd;  outline: none;}/* Set a style for the submit/login button */.form-container .btn {  background-color: #04AA6D;  color: white;  padding: 16px 20px;  border: none;  cursor: pointer;  width: 100%;  margin-bottom:10px;  opacity: 0.8;}/* Add a red background color to the cancel button */.form-container .cancel {  background-color: red;}/* Add some hover effects to buttons */.form-container .btn:hover, .open-button:hover {  opacity: 1;}
```

* * *

##### Step 3) Add JavaScript:

```javascript
function openForm() {  document.getElementById("myForm").style.display = "block";}function closeForm() {  document.getElementById("myForm").style.display = "none";}
```

**Tip:** Go to our [HTML Form Tutorial](https://www.w3schools.com/html/html_forms.asp) to learn more about HTML Forms.

**Tip:** Go to our [CSS Form Tutorial](https://www.w3schools.com/css/css_form.asp) to learn more about how to style form elements.