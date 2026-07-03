# How TO - Inline Form

* * *

Learn how to create a responsive inline form with CSS.

* * *

## Responsive Inline Form

Resize the browser window to see the effect (the labels and inputs will stack on top of each other instead of next to each other on smaller screens):

Email:  Password:  Remember me Submit

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_inline_form)

* * *

## How To Create an Inline Form

##### Step 1) Add HTML

Use a <form> element to process the input. You can learn more about this in our [PHP](https://www.w3schools.com/php/default.asp) tutorial.

```javascript
<form class="form-inline" action="/action_page.php">  <label for="email">Email:</label>  <input type="email" id="email" placeholder="Enter email" name="email">  <label for="pwd">Password:</label>  <input type="password" id="pwd" placeholder="Enter password" name="pswd">  <label>    <input type="checkbox" name="remember"> Remember me  </label>  <button type="submit">Submit</button></form>
```

* * *

* * *

##### Step 2) Add CSS:

```javascript
/* Style the form - display items horizontally */.form-inline {  display: flex;  flex-flow: row wrap;  align-items: center;}/* Add some margins for each label */.form-inline label {  margin: 5px 10px 5px 0;}/* Style the input fields */.form-inline input {  vertical-align: middle;  margin: 5px 10px 5px 0;  padding: 10px;  background-color: #fff;  border: 1px solid #ddd;}/* Style the submit button */.form-inline button {  padding: 10px 20px;  background-color: dodgerblue;  border: 1px solid #ddd;  color: white;}.form-inline button:hover {  background-color: royalblue;}/* Add responsiveness - display the form controls vertically instead of horizontally on screens that are less than 800px wide */@media (max-width: 800px) {  .form-inline input {    margin: 10px 0;  }  .form-inline {    flex-direction: column;    align-items: stretch;  }}
```

**Tip:** Go to our [HTML Form Tutorial](https://www.w3schools.com/html/html_forms.asp) to learn more about HTML Forms.

**Tip:** Go to our [CSS Form Tutorial](https://www.w3schools.com/css/css_form.asp) to learn more about how to style form elements.