# How TO - JavaScript Countdown Timer

* * *

Learn how to create a countdown timer with JavaScript.

* * *

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_countdown)

* * *

## Creating a Countdown Timer

```javascript
<!-- Display the countdown timer in an element --><p id="demo"></p><script>// Set the date we're counting down tovar countDownDate = new Date("Jan 5, 2030 15:37:25").getTime();// Update the count down every 1 secondvar x = setInterval(function() {  // Get today's date and time  var now = new Date().getTime();  // Find the distance between now and the count down date  var distance = countDownDate - now;  // Time calculations for days, hours, minutes and seconds  var days = Math.floor(distance / (1000 * 60 * 60 * 24));  var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));  var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));  var seconds = Math.floor((distance % (1000 * 60)) / 1000);  // Display the result in the element with id="demo"  document.getElementById("demo").innerHTML = days + "d " + hours + "h "  + minutes + "m " + seconds + "s ";  // If the count down is finished, write some text  if (distance < 0) {    clearInterval(x);    document.getElementById("demo").innerHTML = "EXPIRED";  }}, 1000);</script>
```

**Tip:** Learn more about the [window.setInterval()](https://www.w3schools.com/jsref/met_win_setinterval.asp) method in our JavaScript Reference.

* * *

* * *