# How TO - Clear Input Field

* * *

Learn how to clear an input field on focus.

* * *

Click on the input field to clear it:

* * *

## Clear Input Field on Focus

```javascript
<!-- When the input field gets focus, replace its current value with an empty string --><input type="text" onfocus="this.value=''" value="Blabla">
```

* * *

## Clear Input Field with a Button

```javascript
<button onclick="document.getElementById('myInput').value = ''">Clear input field</button><input type="text" value="Blabla" id="myInput">
```

**Tip:** Go to our [HTML Form Tutorial](https://www.w3schools.com/html/html_forms.asp) to learn more about HTML Forms.

* * *

* * *