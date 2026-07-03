# How TO - Check if an Element is Hidden

* * *

Learn how to find out if an element is hidden with JavaScript.

* * *

## Check Hidden Element

```javascript
function myFunction() {  var x = document.getElementById("myDIV");  if (window.getComputedStyle(x).display === "none") {    // Do something..  }}
```

**Note:** When an element is hidden with `display:none` (like in the example above), the element will not take up any space.

To find out if an element is hidden with `visibility:hidden`, see the example below. This "hidden" element will take up space.

```javascript
function myFunction() {  var x = document.getElementById("myDIV");  if (window.getComputedStyle(x).visibility === "hidden") {    // Do something..  }}
```

**Tip:** Also check out [How To - Toggle Hide/Show](howto_js_toggle_hide_show.asp.html).

**Tip:** For more information about Display and Visibility, read our [CSS Display Tutorial](https://www.w3schools.com/css/css_display_visibility.asp).

* * *

* * *