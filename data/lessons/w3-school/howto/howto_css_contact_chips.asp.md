# How TO - Contact Chips

* * *

Learn how to create contact chips with CSS.

* * *

## Contact Chips

![Person](img_avatar.png) John Doe

![Person](img_avatar2.png) Jane Row ×

* * *

## Create Contact Chips

##### Step 1) Add HTML:

```javascript
<div class="chip">  <img src="img_avatar.jpg" alt="Person" width="96" height="96">  John Doe</div>
```

* * *

##### Step 2) Add CSS:

```javascript
.chip {  display: inline-block;  padding: 0 25px;  height: 50px;  font-size: 16px;  line-height: 50px;  border-radius: 25px;  background-color: #f1f1f1;}.chip img {  float: left;  margin: 0 10px 0 -25px;  height: 50px;  width: 50px;  border-radius: 50%;}
```

* * *

* * *

## Closable Contact Chips

To close/hide the contact chip, add an element with an onclick event attribute that says "when you click you on me, hide my parent element" - which is the container div (class="chip").

```javascript
<div class="chip">  <img src="img_avatar.jpg" alt="Person" width="96" height="96">  John Doe  <span class="closebtn" onclick="this.parentElement.style.display='none'">&times;</span></div>
```

**Tip:** Use the HTML entity "`&times;`" to create the letter "x".

Next, style the close button:

```javascript
.closebtn {  padding-left: 10px;  color: #888;  font-weight: bold;  float: right;  font-size: 20px;  cursor: pointer;}.closebtn:hover {  color: #000;}
```