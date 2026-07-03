# How TO - Stacked Form

* * *

Learn how to create a stacked form with CSS.

* * *

## Stacked Form

A vertically stacked form (where inputs and labels are placed on top of each other, instead of next to each other):

First Name  Last Name  Country Australia Canada USA Submit

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_stacked_form)

* * *

## How To Create a Stacked Form

##### Step 1) Add HTML

Use a <form> element to process the input. You can learn more about this in our [PHP](https://www.w3schools.com/php/default.asp) tutorial.

Add inputs (with a matching label) for each field:

```javascript
<form action="/action_page.php">  <label for="fname">First Name</label>  <input type="text" id="fname" name="firstname" placeholder="Your name..">  <label for="lname">Last Name</label>  <input type="text" id="lname" name="lastname" placeholder="Your last name..">  <label for="country">Country</label>  <select id="country" name="country">    <option value="australia">Australia</option>    <option value="canada">Canada</option>    <option value="usa">USA</option>  </select>  <input type="submit" value="Submit"></form>
```

* * *

* * *

##### Step 2) Add CSS:

```javascript
/* Style inputs */  input[type=text], select {  width: 100%;  padding: 12px 20px;  margin: 8px 0;  display: inline-block;  border: 1px solid #ccc;  border-radius: 4px;  box-sizing: border-box;}/* Style the submit button */input[type=submit] {  width: 100%;  background-color: #04AA6D;  color: white;  padding: 14px 20px;  margin: 8px 0;  border: none;  border-radius: 4px;  cursor: pointer;}/* Add a background color to the submit button on mouse-over */input[type=submit]:hover {  background-color: #45a049;}
```

**Tip:** Go to our [HTML Form Tutorial](https://www.w3schools.com/html/html_forms.asp) to learn more about HTML Forms.

**Tip:** Go to our [CSS Form Tutorial](https://www.w3schools.com/css/css_form.asp) to learn more about how to style form elements.