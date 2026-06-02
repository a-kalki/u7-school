# How TO - Trigger Button Click on Enter

* * *

Trigger a button click on keyboard "enter" with JavaScript.

* * *

## Trigger a Button Click on Enter

Press the "Enter" key inside the input field to trigger the button:

 Button
```javascript
// Get the input fieldvar input = document.getElementById("myInput");// Execute a function when the user presses a key on the keyboardinput.addEventListener("keypress", function(event) {  // If the user presses the "Enter" key on the keyboard  if (event.key === "Enter") {    // Cancel the default action, if needed    event.preventDefault();    // Trigger the button element with a click    document.getElementById("myBtn").click();  }});
```

**Tip:** Learn more about the [KeyboardEvent key Property](https://www.w3schools.com/jsref/event_key_key.asp) in our JavaScript Reference.

* * *

* * *