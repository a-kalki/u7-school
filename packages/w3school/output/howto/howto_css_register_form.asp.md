# How TO - Register Form

* * *

Learn how to create a register form with CSS.

* * *

# **Register**

Please fill in this form to create an account.

* * *

**Email** 

**Password** 

**Repeat Password** 

By creating an account you agree to our [Terms & Privacy](javascript:void\(0\)).

Register

Already have an account? [Sign in](javascript:void\(0\))

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_register_form)

* * *

## How To Create a Register Form

##### Step 1) Add HTML:

Use a <form> element to process the input. You can learn more about this in our [PHP](https://www.w3schools.com/php/default.asp) tutorial. Then add inputs (with a matching label) for each field:

```javascript
<form action="action_page.php">  <div class="container">    <h1>Register</h1>    <p>Please fill in this form to create an account.</p>    <hr>    <label for="email"><b>Email</b></label>    <input type="text" placeholder="Enter Email" name="email" id="email" required>    <label for="psw"><b>Password</b></label>    <input type="password" placeholder="Enter Password" name="psw" id="psw" required>    <label for="psw-repeat"><b>Repeat Password</b></label>    <input type="password" placeholder="Repeat Password" name="psw-repeat" id="psw-repeat" required>    <hr>    <p>By creating an account you agree to our <a href="#">Terms & Privacy</a>.</p>    <button type="submit" class="registerbtn">Register</button>  </div>  <div class="container signin">    <p>Already have an account? <a href="#">Sign in</a>.</p>  </div></form>
```

* * *

* * *

##### Step 2) Add CSS:

```javascript
* {box-sizing: border-box}/* Add padding to containers */.container {  padding: 16px;}/* Full-width input fields */input[type=text], input[type=password] {  width: 100%;  padding: 15px;  margin: 5px 0 22px 0;  display: inline-block;  border: none;  background: #f1f1f1;}input[type=text]:focus, input[type=password]:focus {  background-color: #ddd;  outline: none;}/* Overwrite default styles of hr */hr {  border: 1px solid #f1f1f1;  margin-bottom: 25px;}/* Set a style for the submit/register button */.registerbtn {  background-color: #04AA6D;  color: white;  padding: 16px 20px;  margin: 8px 0;  border: none;  cursor: pointer;  width: 100%;  opacity: 0.9;}.registerbtn:hover {  opacity:1;}/* Add a blue text color to links */a {  color: dodgerblue;}/* Set a grey background color and center the text of the "sign in" section */.signin {  background-color: #f1f1f1;  text-align: center;}
```

* * *

**Tip:** Go to our [HTML Form Tutorial](https://www.w3schools.com/html/html_forms.asp) to learn more about HTML Forms.

**Tip:** Go to our [CSS Form Tutorial](https://www.w3schools.com/css/css_form.asp) to learn more about how to style form elements.