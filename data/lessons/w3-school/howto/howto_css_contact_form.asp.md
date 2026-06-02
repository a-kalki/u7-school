# How TO - Contact Form

* * *

Learn how to create a contact form with CSS.

* * *

First Name  Last Name  Country Australia Canada USA Subject [Submit](javascript:void\(0\))

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_contact_form)

* * *

## How To Create a Contact Form

##### Step 1) Add HTML

Use a <form> element to process the input. You can learn more about this in our [PHP](https://www.w3schools.com/php/default.asp) tutorial. Then add inputs (with a matching label) for each field:

```javascript
<div class="container">  <form action="action_page.php">    <label for="fname">First Name</label>    <input type="text" id="fname" name="firstname" placeholder="Your name..">    <label for="lname">Last Name</label>    <input type="text" id="lname" name="lastname" placeholder="Your last name..">    <label for="country">Country</label>    <select id="country" name="country">      <option value="australia">Australia</option>      <option value="canada">Canada</option>      <option value="usa">USA</option>    </select>    <label for="subject">Subject</label>    <textarea id="subject" name="subject" placeholder="Write something.." style="height:200px"></textarea>    <input type="submit" value="Submit">  </form></div>
```

* * *

* * *

##### Step 2) Add CSS:

```javascript
/* Style inputs with type="text", select elements and textareas */input[type=text], select, textarea {  width: 100%; /* Full width */  padding: 12px; /* Some padding */   border: 1px solid #ccc; /* Gray border */  border-radius: 4px; /* Rounded borders */  box-sizing: border-box; /* Make sure that padding and width stays in place */  margin-top: 6px; /* Add a top margin */  margin-bottom: 16px; /* Bottom margin */  resize: vertical /* Allow the user to vertically resize the textarea (not horizontally) */}/* Style the submit button with a specific background color etc */input[type=submit] {  background-color: #04AA6D;  color: white;  padding: 12px 20px;  border: none;  border-radius: 4px;  cursor: pointer;}/* When moving the mouse over the submit button, add a darker green color */input[type=submit]:hover {  background-color: #45a049;}/* Add a background color and some padding around the form */.container {  border-radius: 5px;  background-color: #f2f2f2;  padding: 20px;}
```

**Tip:** Go to our [HTML Form Tutorial](https://www.w3schools.com/html/html_forms.asp) to learn more about HTML Forms.

**Tip:** Go to our [CSS Form Tutorial](https://www.w3schools.com/css/css_form.asp) to learn more about how to style form elements.

Ever heard about **W3Schools Spaces**? Here you can create your website from scratch or use a template.

[Get started for free ❯](https://www.w3spaces.com "Get Started With W3Schools Spaces")

_\* no credit card required_