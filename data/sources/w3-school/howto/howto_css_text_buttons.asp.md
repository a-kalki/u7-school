# How TO - Text Buttons

* * *

Learn how to style text buttons with CSS.

* * *

Success Info Warning Danger Default

* * *

## How To Style Text Buttons

##### Step 1) Add HTML:

```javascript
<button class="btn success">Success</button><button class="btn info">Info</button><button class="btn warning">Warning</button><button class="btn danger">Danger</button><button class="btn default">Default</button>
```

* * *

##### Step 2) Add CSS:

To get the "text button" look, we remove the default background color and border:

```javascript
.btn {  border: none;  background-color: inherit;  padding: 14px 28px;  font-size: 16px;  cursor: pointer;  display: inline-block;}/* On mouse-over */.btn:hover {background: #eee;}.success {color: green;}.info {color: dodgerblue;}.warning {color: orange;}.danger {color: red;}.default {color: black;}
```

* * *

## Text Buttons with Individual Backgrounds

Text buttons with a specific background color on hover:

```javascript
.btn {    border: none;    background-color: inherit;    padding: 14px 28px;    font-size: 16px;    cursor: pointer;    display: inline-block;}/* Green */.success {    color: green;}.success:hover {    background-color: #04AA6D;    color: white;}/* Blue */.info {    color: dodgerblue;}.info:hover {    background: #2196F3;    color: white;}/* Orange */.warning {    color: orange;}.warning:hover {    background: #ff9800;    color: white;}/* Red */.danger {    color: red;}.danger:hover {    background: #f44336;    color: white;}/* Gray */.default {    color: black;}.default:hover {    background: #e7e7e7;}
```

Go to our [CSS Buttons Tutorial](https://www.w3schools.com/css/css3_buttons.asp) to learn more about how to style buttons.

* * *

* * *