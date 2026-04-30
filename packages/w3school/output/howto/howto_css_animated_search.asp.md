# How TO - Animated Search Form

* * *

Learn how to create an animated search form with CSS.

* * *

## How To Create an Animated Search Form

Click on the input field:

* * *

##### Step 1) Add HTML:

```javascript
<input type="text" name="search" placeholder="Search..">
```

##### Step 2) Add CSS:

```javascript
input[type=text] {  width: 130px;  -webkit-transition: width 0.4s ease-in-out;  transition: width 0.4s ease-in-out;}/* When the input field gets focus, change its width to 100% */input[type=text]:focus {  width: 100%;}
```

**Tip:** Go to our [HTML Form Tutorial](https://www.w3schools.com/html/html_forms.asp) to learn more about HTML Forms.

Go to our [CSS Forms Tutorial](https://www.w3schools.com/css/css_form.asp) to learn more about how to style HTML Forms.

* * *

* * *