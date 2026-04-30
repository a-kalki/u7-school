# How TO - Include HTML

* * *

Learn how to include HTML snippets in HTML.

* * *

## The HTML

Save the HTML you want to include in an .html file:

```javascript
<a href="howto_google_maps.asp">Google Maps</a><br><a href="howto_css_animate_buttons.asp">Animated Buttons</a><br><a href="howto_css_modals.asp">Modal Boxes</a><br><a href="howto_js_animate.asp">Animations</a><br><a href="howto_js_progressbar.asp">Progress Bars</a><br><a href="howto_css_dropdown.asp">Hover Dropdowns</a><br><a href="howto_js_dropdown.asp">Click Dropdowns</a><br><a href="howto_css_table_responsive.asp">Responsive Tables</a><br>
```

* * *

## Include the HTML

Including HTML is done by using a **w3-include-html** attribute:

```javascript
<div w3-include-html="content.html"></div>
```

* * *

## Add the JavaScript

HTML includes are done by JavaScript.

```javascript
<script>function includeHTML() {  var z, i, elmnt, file, xhttp;  /* Loop through a collection of all HTML elements: */  z = document.getElementsByTagName("*");  for (i = 0; i < z.length; i++) {    elmnt = z[i];    /*search for elements with a certain atrribute:*/    file = elmnt.getAttribute("w3-include-html");    if (file) {      /* Make an HTTP request using the attribute value as the file name: */      xhttp = new XMLHttpRequest();      xhttp.onreadystatechange = function() {        if (this.readyState == 4) {          if (this.status == 200) {elmnt.innerHTML = this.responseText;}          if (this.status == 404) {elmnt.innerHTML = "Page not found.";}          /* Remove the attribute, and call this function once more: */          elmnt.removeAttribute("w3-include-html");          includeHTML();        }      }      xhttp.open("GET", file, true);      xhttp.send();      /* Exit the function: */      return;    }  }}</script>
```

Call includeHTML() at the bottom of the page:

```javascript
<script>includeHTML();</script>
```

* * *

* * *

## Include Many HTML Snippets

You can include any number of HTML snippets:

```javascript
<div w3-include-html="h1.html"></div><div w3-include-html="content.html"></div>
```