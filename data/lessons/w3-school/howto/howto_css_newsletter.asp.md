# How TO - Email Newsletter

* * *

Learn how to create an email newsletter with CSS.

* * *

## Subscribe to our Newsletter

Lorem ipsum text about why you should subscribe to our newsletter blabla. Lorem ipsum text about why you should subscribe to our newsletter blabla. Lorem ipsum text about why you should subscribe to our newsletter blabla.

   Daily Newsletter

Subscribe

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_newsletter)

* * *

## How To Create a Newsletter

##### Step 1) Add HTML

Use a <form> element to process the input. You can learn more about this in our [PHP](https://www.w3schools.com/php/default.asp) tutorial. Then add inputs for each field, together with a "submit" button:

```javascript
<form action="action_page.php">  <div class="container">    <h2>Subscribe to our Newsletter</h2>    <p>Lorem ipsum..</p>  </div>  <div class="container" style="background-color:white">    <input type="text" placeholder="Name" name="name" required>    <input type="text" placeholder="Email address" name="mail" required>    <label>      <input type="checkbox" checked="checked" name="subscribe"> Daily Newsletter    </label>  </div>  <div class="container">    <input type="submit" value="Subscribe">  </div></form>
```

* * *

* * *

##### Step 2) Add CSS:

```javascript
/* Style the form element with a border around it */form {  border: 4px solid #f1f1f1;}/* Add some padding and a grey background color to containers */.container {  padding: 20px;  background-color: #f1f1f1;}/* Style the input elements and the submit button */input[type=text], input[type=submit] {  width: 100%;  padding: 12px;  margin: 8px 0;  display: inline-block;  border: 1px solid #ccc;  box-sizing: border-box;}/* Add margins to the checkbox */input[type=checkbox] {  margin-top: 16px;}/* Style the submit button */input[type=submit] {  background-color: #04AA6D;  color: white;  border: none;}input[type=submit]:hover {  opacity: 0.8;}
```

**Tip:** Go to our [HTML Form Tutorial](https://www.w3schools.com/html/html_forms.asp) to learn more about HTML Forms.

**Tip:** Go to our [CSS Form Tutorial](https://www.w3schools.com/css/css_form.asp) to learn more about how to style form elements.