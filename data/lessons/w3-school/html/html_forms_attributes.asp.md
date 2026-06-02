# HTML Form Attributes

* * *

This chapter describes the different attributes for the HTML `<form>` element.

* * *

## The Action Attribute

The `action` attribute defines the action to be performed when the form is submitted.

Usually, the form data is sent to a file on the server when the user clicks on the submit button.

In the example below, the form data is sent to a file called "action\_page.php". This file contains a server-side script that handles the form data:

```javascript
<form action="/action_page.php">  <label for="fname">First name:</label><br>  <input type="text" id="fname" name="fname" value="John"><br>  <label for="lname">Last name:</label><br>  <input type="text" id="lname" name="lname" value="Doe"><br><br>  <input type="submit" value="Submit"></form>
```

**Tip:** If the `action` attribute is omitted, the action is set to the current page.

* * *

## The Target Attribute

The `target` attribute specifies where to display the response that is received after submitting the form.

The `target` attribute can have one of the following values:

Value

Description

\_blank

The response is displayed in a new window or tab

\_self

The response is displayed in the current window

\_parent

The response is displayed in the parent frame

\_top

The response is displayed in the full body of the window

_framename_

The response is displayed in a named iframe

The default value is `_self` which means that the response will open in the current window.

```javascript
<form action="/action_page.php" target="_blank">
```

* * *

## The Method Attribute

The `method` attribute specifies the HTTP method to be used when submitting the form data.

The form-data can be sent as URL variables (with `method="get"`) or as HTTP post transaction (with `method="post"`).

The default HTTP method when submitting form data is GET. 

```javascript
<form action="/action_page.php" method="get">
```
```javascript
<form action="/action_page.php" method="post">
```

**Notes on GET:**

*   Appends the form data to the URL, in name/value pairs
*   NEVER use GET to send sensitive data! (the submitted form data is visible in the URL!)
*   The length of a URL is limited (2048 characters)
*   Useful for form submissions where a user wants to bookmark the result
*   GET is good for non-secure data, like query strings in Google

**Notes on POST:**

*   Appends the form data inside the body of the HTTP request (the submitted form data is not shown in the URL)
*   POST has no size limitations, and can be used to send large amounts of data.
*   Form submissions with POST cannot be bookmarked

**Tip:** Always use POST if the form data contains sensitive or personal information!

* * *

* * *

## The Autocomplete Attribute

The `autocomplete` attribute specifies whether a form should have autocomplete on or off.

When autocomplete is on, the browser automatically complete values based on values that the user has entered before.

```javascript
<form action="/action_page.php" autocomplete="on">
```

* * *

## The Novalidate Attribute

The `novalidate` attribute is a boolean attribute.

When present, it specifies that the form-data (input) should not be validated when submitted.

```javascript
<form action="/action_page.php" novalidate>
```

* * *

* * *

## List of All <form> Attributes

Attribute

Description

[accept-charset](https://www.w3schools.com/tags/att_form_accept_charset.asp)

Specifies the character encodings used for form submission

[action](https://www.w3schools.com/tags/att_form_action.asp)

Specifies where to send the form-data when a form is submitted

[autocomplete](https://www.w3schools.com/tags/att_form_autocomplete.asp)

Specifies whether a form should have autocomplete on or off

[enctype](https://www.w3schools.com/tags/att_form_enctype.asp)

Specifies how the form-data should be encoded when submitting it to the server (only for method="post")

[method](https://www.w3schools.com/tags/att_form_method.asp)

Specifies the HTTP method to use when sending form-data

[name](https://www.w3schools.com/tags/att_form_name.asp)

Specifies the name of the form

[novalidate](https://www.w3schools.com/tags/att_form_novalidate.asp)

Specifies that the form should not be validated when submitted

[rel](https://www.w3schools.com/tags/att_form_rel.asp)

Specifies the relationship between a linked resource and the current document

[target](https://www.w3schools.com/tags/att_form_target.asp)

Specifies where to display the response that is received after submitting the form