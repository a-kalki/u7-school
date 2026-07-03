# How TO - Notification Buttons

* * *

Learn how to create notification buttons with CSS.

* * *

[Inbox 3](javascript:void\(0\))

* * *

## How To Create a Notification Button

##### Step 1) Add HTML:

```javascript
<a href="#" class="notification">  <span>Inbox</span>  <span class="badge">3</span></a>
```

* * *

##### Step 2) Add CSS:

```javascript
.notification {  background-color: #555;  color: white;  text-decoration: none;  padding: 15px 26px;  position: relative;  display: inline-block;  border-radius: 2px;}.notification:hover {  background: red;}.notification .badge {  position: absolute;  top: -10px;  right: -10px;  padding: 5px 10px;  border-radius: 50%;  background: red;  color: white;}
```

Go to our [CSS Buttons Tutorial](https://www.w3schools.com/css/css3_buttons.asp) to learn more about how to style buttons.

* * *

* * *