# How TO - CSS Arrows

* * *

Learn how to create arrows with CSS.

* * *

Right arrow:

Left arrow:

Up arrow:

Down arrow:

* * *

## How To Create Arrows

##### Step 1) Add HTML:

```javascript
<p>Right arrow: <i class="arrow right"></i></p><p>Left arrow: <i class="arrow left"></i></p><p>Up arrow: <i class="arrow up"></i></p><p>Down arrow: <i class="arrow down"></i></p>
```

* * *

##### Step 2) Add CSS:

```javascript
.arrow {  border: solid black;  border-width: 0 3px 3px 0;  display: inline-block;  padding: 3px;}.right {  transform: rotate(-45deg);  -webkit-transform: rotate(-45deg);}.left {  transform: rotate(135deg);  -webkit-transform: rotate(135deg);}.up {  transform: rotate(-135deg);  -webkit-transform: rotate(-135deg);}.down {  transform: rotate(45deg);  -webkit-transform: rotate(45deg);}
```

* * *

* * *