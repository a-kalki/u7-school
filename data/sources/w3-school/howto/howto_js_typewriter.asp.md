# How TO - Typing Effect

* * *

Learn how to create a typing effect with JavaScript.

* * *

Start the typing effect

* * *

## Creating a Typing Effect

##### Step 1) Add HTML:

```javascript
<p id="demo"></p>
```

* * *

##### Step 2) Add JavaScript:

```javascript
var i = 0;var txt = 'Lorem ipsum typing effect!'; /* The text */var speed = 50; /* The speed/duration of the effect in milliseconds */function typeWriter() {  if (i < txt.length) {    document.getElementById("demo").innerHTML += txt.charAt(i);    i++;    setTimeout(typeWriter, speed);  }}
```

**Tip:** Learn more about the [window.setTimeout()](https://www.w3schools.com/jsref/met_win_setinterval.asp) method in our JavaScript Reference.

* * *

* * *