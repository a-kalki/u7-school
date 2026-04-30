# How TO - Closable List Items

* * *

Learn how to close list items with JavaScript.

* * *

## Closable List Items

Click on the "x" symbol to the right of the list item to close/hide it.

*   [Adele](javascript:void\(0\))
*   [Agnes×](javascript:void\(0\))
*   [Billy×](javascript:void\(0\))
*   [Bob×](javascript:void\(0\))
*   [Calvin×](javascript:void\(0\))
*   [Christina×](javascript:void\(0\))
*   [Cindy](javascript:void\(0\))

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_close_list_items)

* * *

## How To Create Closable List Items

##### Step 1) Add HTML:

```javascript
<ul>  <li>Adele</li>  <li>Agnes<span class="close">x</span></li>  <li>Billy<span class="close">x</span></li>  <li>Bob<span class="close">x</span></li>  <li>Calvin<span class="close">x</span></li>  <li>Christina<span class="close">x</span></li>  <li>Cindy</li></ul>
```

* * *

##### Step 2) Add CSS:

```javascript
* {  box-sizing: border-box;}/* Style the list (remove margins and bullets, etc) */ul {  list-style-type: none;  padding: 0;  margin: 0;}/* Style the list items */ul li {  border: 1px solid #ddd;  margin-top: -1px; /* Prevent double borders */  background-color: #f6f6f6;  padding: 12px;  text-decoration: none;  font-size: 18px;  color: black;  display: block;  position: relative;}/* Add a light grey background color on hover */ul li:hover {  background-color: #eee;}/* Style the close button (span) */.close {  cursor: pointer;  position: absolute;  top: 50%;  right: 0%;  padding: 12px 16px;  transform: translate(0%, -50%);}.close:hover {background: #bbb;}
```

* * *

* * *

##### Step 3) Add JavaScript:

```javascript
// Get all elements with class="close"var closebtns = document.getElementsByClassName("close");var i;// Loop through the elements, and hide the parent, when clicked onfor (i = 0; i < closebtns.length; i++) {  closebtns[i].addEventListener("click", function() {    this.parentElement.style.display = 'none';  });}
```