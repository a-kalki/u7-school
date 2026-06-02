# How TO - Toggle Switch

* * *

Learn how to create a "toggle switch" (on/off button) with CSS.

* * *

  
  

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_switch)

* * *

## How To Create a Toggle Switch

##### Step 1) Add HTML:

```javascript
<!-- Rectangular switch --><label class="switch">  <input type="checkbox">  <span class="slider"></span></label><!-- Rounded switch --><label class="switch">  <input type="checkbox">  <span class="slider round"></span></label>
```

* * *

* * *

##### Step 2) Add CSS:

```javascript
/* The switch - the box around the slider */.switch {  position: relative;  display: inline-block;  width: 60px;  height: 34px;}/* Hide default HTML checkbox */.switch input {  opacity: 0;  width: 0;  height: 0;}/* The slider */.slider {  position: absolute;  cursor: pointer;  top: 0;  left: 0;  right: 0;  bottom: 0;  background-color: #ccc;  -webkit-transition: .4s;  transition: .4s;}.slider:before {  position: absolute;  content: "";  height: 26px;  width: 26px;  left: 4px;  bottom: 4px;  background-color: white;  -webkit-transition: .4s;  transition: .4s;}input:checked + .slider {  background-color: #2196F3;}input:focus + .slider {  box-shadow: 0 0 1px #2196F3;}input:checked + .slider:before {  -webkit-transform: translateX(26px);  -ms-transform: translateX(26px);  transform: translateX(26px);}/* Rounded sliders */.slider.round {  border-radius: 34px;}.slider.round:before {  border-radius: 50%;}
```