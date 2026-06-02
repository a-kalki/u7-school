# How TO - Detect Caps Lock

* * *

Learn how to find out if capslock is on inside an input field with JavaScript.

* * *

## Detect if Caps Lock is On

Try to press the "Caps Lock" key inside the input field:

WARNING! Caps lock is ON.

```javascript
// Get the input fieldvar input = document.getElementById("myInput");// Get the warning textvar text = document.getElementById("text");// When the user presses any key on the keyboard, run the functioninput.addEventListener("keyup", function(event) {  // If "caps lock" is pressed, display the warning text  if (event.getModifierState("CapsLock")) {    text.style.display = "block";  } else {    text.style.display = "none"  }});
```

**Tip:** Read more about the getModifierState() method in our [JavaScript Event Reference - getModifierState()](https://www.w3schools.com/jsref/event_mouse_getmodifierstate.asp).

* * *

* * *