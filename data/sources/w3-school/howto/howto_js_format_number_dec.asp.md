# How TO - Format a Number with Two Decimals

* * *

Learn how to format a number with two decimals in JavaScript.

* * *

## Format a Number with Two Decimals

You can use the `toFixed()` method to format a number to only show two decimals. Note that the result is rounded (shows 5.57 instead of 5.56):

```javascript
let num = 5.56789;let n = num.toFixed(2);  // 5.57
```

If you want to display three decimals, just change the number to 3:

```javascript
let num = 5.56789;let n = num.toFixed(3);  // 5.568
```

* * *

**Tip:** Learn more about the [toFixed()](https://www.w3schools.com/jsref/jsref_tofixed.asp) method in our JavaScript Reference.

* * *

* * *