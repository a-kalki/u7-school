# How TO - CSS Ribbon

* * *

Learn how to create a ribbon with CSS.

* * *

A button for something cool NEW  
A button for something cool HOT

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_ribbon)

* * *

## How To Create a Ribbon

##### Step 1) Add HTML:

In this example, the ribbon belongs to a button element:

```javascript
<button class="btn">A button for something cool <span class="ribbon">NEW</span></button>
```

* * *

##### Step 2) Add CSS:

```javascript
.btn {  border: none;  border-radius: 5px;  padding: 12px 20px;  font-size: 16px;  cursor: pointer;  background-color: #282A35;  color: white;  position: relative;}.ribbon {  width: 60px;  font-size: 14px;  padding: 4px;  position: absolute;  right: -25px;  top: -12px;  text-align: center;  border-radius: 25px;  transform: rotate(20deg);  background-color: #ff9800;  color: white;}
```

* * *

* * *