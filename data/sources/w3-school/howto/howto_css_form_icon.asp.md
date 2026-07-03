# How TO - Form with Icons

* * *

Learn how to create a form with icons.

* * *

## Register

Register

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_form_icon)

* * *

## How To Create an Icon Form

##### Step 1) Add HTML:

Use a <form> element to process the input. You can learn more about this in our [PHP](https://www.w3schools.com/php/default.asp) tutorial. Then add inputs for each field:

```javascript
<form action="/action_page.php">  <h2>Register Form</h2>  <div class="input-container">    <i class="fa fa-user icon"></i>    <input class="input-field" type="text" placeholder="Username" name="usrnm">  </div>  <div class="input-container">    <i class="fa fa-envelope icon"></i>    <input class="input-field" type="text" placeholder="Email" name="email">  </div>  <div class="input-container">    <i class="fa fa-key icon"></i>    <input class="input-field" type="password" placeholder="Password" name="psw">  </div>  <button type="submit" class="btn">Register</button></form>
```

* * *

* * *

##### Step 2) Add CSS:

```javascript
* {box-sizing: border-box;}/* Style the input container */.input-container {  display: flex;  width: 100%;  margin-bottom: 15px;}/* Style the form icons */.icon {  padding: 10px;  background: dodgerblue;  color: white;  min-width: 50px;  text-align: center;}/* Style the input fields */.input-field {  width: 100%;  padding: 10px;  outline: none;}.input-field:focus {  border: 2px solid dodgerblue;}/* Set a style for the submit button */.btn {  background-color: dodgerblue;  color: white;  padding: 15px 20px;  border: none;  cursor: pointer;  width: 100%;  opacity: 0.9;}.btn:hover {  opacity: 1;}
```

* * *

**Tip:** Go to our [HTML Form Tutorial](https://www.w3schools.com/html/html_forms.asp) to learn more about HTML Forms.

**Tip:** Go to our [CSS Form Tutorial](https://www.w3schools.com/css/css_form.asp) to learn more about how to style form elements.

**Tip:** Go to our [CSS Flexbox Tutorial](https://www.w3schools.com/css/css3_flexbox.asp) to learn more about the flexible box layout module.