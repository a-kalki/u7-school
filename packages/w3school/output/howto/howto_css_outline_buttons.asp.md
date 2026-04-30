# How TO - Outline Buttons

* * *

Learn how to style outline buttons with CSS.

* * *

Success Info Warning Danger Default

  

Success Info Warning Danger Default

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_outline_buttons)

* * *

## How To Style Outline Buttons

##### Step 1) Add HTML:

```javascript
<button class="btn success">Success</button><button class="btn info">Info</button><button class="btn warning">Warning</button><button class="btn danger">Danger</button><button class="btn default">Default</button>
```

* * *

##### Step 2) Add CSS:

```javascript
.btn {  border: 2px solid black;  background-color: white;  color: black;  padding: 14px 28px;  font-size: 16px;  cursor: pointer;}/* Green */.success {  border-color: #04AA6D;  color: green;}.success:hover {  background-color: #04AA6D;  color: white;}/* Blue */.info {  border-color: #2196F3;  color: dodgerblue}.info:hover {  background: #2196F3;  color: white;}/* Orange */.warning {  border-color: #ff9800;  color: orange;}.warning:hover {  background: #ff9800;  color: white;}/* Red */.danger {  border-color: #f44336;  color: red}.danger:hover {  background: #f44336;  color: white;}/* Gray */.default {  border-color: #e7e7e7;  color: black;}.default:hover {  background: #e7e7e7;}
```

Add the `border-radius` property to create rounded outline buttons:

```javascript
.btn {  border-radius: 5px;}
```

Go to our [CSS Buttons Tutorial](https://www.w3schools.com/css/css3_buttons.asp) to learn more about how to style buttons.

* * *

* * *