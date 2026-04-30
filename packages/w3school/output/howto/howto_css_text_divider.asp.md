# How TO - Text Divider

* * *

Learn how to create a text divider with CSS.

* * *

Lorem Ipsum

OR

AND

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_text_divider)

* * *

## How To Create Responsive Text Dividers

##### Step 1) Add HTML:

```javascript
<div class="divider">Lorem Ipsum</div>
```

##### Step 2) Add CSS:

```javascript
.divider {  font-size: 30px;  display: flex;  align-items: center;}.divider::before, .divider::after {  flex: 1;  content: '';  padding: 3px;  background-color: red;  margin: 5px;}
```

* * *

* * *