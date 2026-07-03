# HTML Buttons

* * *

Buttons let users interact with a web page. They can submit forms, run JavaScript, or trigger different actions when clicked.

* * *

## HTML Button

The HTML `<button>` element defines a clickable button.

By itself, the button does nothing until you add an action to it.

```javascript
<button>Click Me</button>
```

* * *

## Styling HTML Buttons

Buttons are often styled with CSS:

```javascript
<button class="mytestbtn">Green Button</button>
```

* * *

## Disabled Buttons

Use the `disabled` attribute to make a button unclickable:

```javascript
<button disabled>Disabled Button</button>
```

**Tip:** Disabled buttons cannot be clicked and usually appear faded.

* * *

* * *

* * *

## Button with JavaScript

You can run JavaScript when the user clicks a button using the `onclick` attribute:

```javascript
<button onclick="alert('Hello!')">Click Me</button>
```

**Note:** You will learn more about JavaScript in our [HTML JavaScript](html_scripts.asp.html) chapter.

* * *

## Button Types

The `type` attribute defines what a button does when clicked. There are three button types:

*   `type="button"` - A normal clickable button (does nothing by default)
*   `type="submit"` - Submits a form
*   `type="reset"` - Resets all form fields

```javascript
<button type="button">Normal Button</button><button type="submit">Submit</button><button type="reset">Reset</button>
```

Buttons are often used inside [forms](html_forms.asp.html), which you will learn more about in a later chapter.

For now, just know that a `submit` button sends the form data to the server, while a `reset` button clears the form:

```javascript
<form action="/action_page.php">  First name: <input type="text" name="fname">  <button type="submit">Submit</button>  <button type="reset">Reset Form</button></form>
```

**Note:** You should always specify the `type` attribute. Inside a form, the default type is `submit`, and browsers may behave differently if the type is omitted.

* * *

## HTML Button Reference

Tag

Description

[<button>](https://www.w3schools.com/tags/tag_button.asp)

Defines a clickable button

**Tip:** For a complete list of all HTML tags, visit our [HTML Tag Reference](https://www.w3schools.com/tags/default.asp).

* * *