# How TO - JavaScript Progress Bar

* * *

Learn how to create a progress bar using JavaScript.

  
Run

* * *

## Creating a Progress Bar

##### Step 1) Add HTML:

```javascript
<div id="myProgress">  <div id="myBar"></div></div>
```

##### Step 2) Add CSS:

```javascript
#myProgress {  width: 100%;  background-color: grey;}#myBar {  width: 1%;  height: 30px;  background-color: green;}
```

##### Step 3) Add JavaScript:

Create a Dynamic Progress Bar (animated) Using JavaScript:

```javascript
var i = 0;function move() {  if (i == 0) {    i = 1;    var elem = document.getElementById("myBar");    var width = 1;    var id = setInterval(frame, 10);    function frame() {      if (width >= 100) {        clearInterval(id);        i = 0;      } else {        width++;        elem.style.width = width + "%";      }    }  }}
```

* * *

* * *

## Add Labels

If you want to add labels to indicate how far the user is in the process, add a new element inside (or outside) the progress bar:

##### Step 1) Add HTML:

```javascript
<div id="myProgress">  <div id="myBar">10%</div></div>
```

##### Step 2) Add CSS:

```javascript
#myBar {  width: 10%;  height: 30px;  background-color: #04AA6D;  text-align: center; /* To center it horizontally (if you want) */  line-height: 30px; /* To center it vertically */  color: white;}
```

##### Step 3) Add JavaScript:

If you want to dynamically update the text inside the label to the same value of the width of the progress bar, add the following:

```javascript
var i = 0;function move() {  if (i == 0) {    i = 1;    var elem = document.getElementById("myBar");    var width = 10;    var id = setInterval(frame, 10);    function frame() {      if (width >= 100) {        clearInterval(id);        i = 0;      } else {        width++;        elem.style.width = width + "%";        elem.innerHTML = width + "%";      }    }  }}
```