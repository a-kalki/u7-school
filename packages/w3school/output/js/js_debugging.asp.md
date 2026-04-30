# JavaScript Debugging

## Debugging for Beginners

**Many beginners quit because they cannot debug**.

This page shows you how to find out **why code does not work**.

**Debugging** means finding and fixing mistakes (bugs) in your code.

**Bugs are normal**. The skill is learning how to locate them quickly.

## Why Code Does Not Work?

Programming code might contain syntax errors, or logical errors.

Many of these errors are difficult to diagnose.

When code fails, beginners often **guess** what is wrong.

Debugging is the opposite: you **check facts**.

A good debugging habit is: **Read** → **Reproduce** → **Reduce** → **Fix**

*   Read the error
*   Reproduce the problem
*   Reduce to a small example
*   Then fix it.

Often, when programming code contains errors, nothing will happen. There are no error messages, and you will get no indications where to search for errors.

Searching for (and fixing) errors in programming code is called code debugging.

* * *

❝

_Errors can and will happen, every time you write computer code._

* * *

## JavaScript Debuggers

Debugging is not easy. But fortunately, all modern browsers have a built-in JavaScript debugger.

Built-in debuggers can be turned on and off, forcing errors to be reported to the user.

With a debugger, you can also set breakpoints (places where code execution can be stopped), and examine variables while the code is executing.

* * *

## Did You Know?

Debugging is the process of testing, finding, and reducing bugs (errors) in computer programs.

The first known computer bug was a real bug (an insect) stuck in the electronics.

* * *

## Step 1: Look in the Console

The browser console shows errors and messages from JavaScript.

If your code "does nothing", the console often tells you why.

Normally (otherwise follow the steps at the bottom of this page), you **activate debugging** in your browser with the **F12 key**, and select **Console** in the debugger menu.  

If you do only one thing: **always check the console** when something fails.

* * *

## Step 2: Use console.log()

In JavaScript `console.log()` prints values to the console.

This helps you to see what your code is doing.

```javascript
<!DOCTYPE html><html><body><h1>My First Web Page</h1><script>console.log("Hello!");</script></body></html>
```

## Tip:

Log the value **before** and **after** the line you suspect.

That can tell you where things start going wrong.

* * *

## Step 3: Confirm Your Assumptions

Many bugs happen because you **assume a value** is something, but it is not.

**Check the value**.

**Check the type**.

```javascript
let x = 5;let y = "5";console.log(x + y);  // 55 (string!)console.log(x + Number(y));  // 10 (number)
```

* * *

## Reading Error Messages (Beginner Friendly)

Error messages look scary, but they usually mean one of a few common things.

### ReferenceError

Means: This name does not exist.

Often a misspelling or variable not declared.

```javascript
console.log(myValue);// ReferenceError: myValue is not defined
```

### TypeError

Means: You tried to use a value in an impossible way.

Often `undefined` or `null`.

```javascript
let x;console.log(x.length);// TypeError: Cannot read properties of undefined
```

In the console window, the error usually includes a **line number**.

Click it in the console to jump to the exact line.

* * *

## A Simple Debugging Checklist

*   Check the console for errors
*   Read the error message carefully
*   Log values with `console.log()`
*   Reduce the problem to a small example
*   Fix one thing at a time.

* * *

## Common Beginner Mistakes

```javascript
let x = 10;if (x = 5) {  console.log("This runs");}
```

If your `if` statement behaves strangely, check if you accidentally used `=`.

* * *

* * *

## Major Browsers' Debugging Tools

You can activate debugging in your browser with **F12**, and select **Console** in the debugger menu.

Otherwise follow these steps:

## Chrome

*   Open the browser.
*   From the menu, select "More tools".
*   From tools, choose "Developer tools".
*   Finally, select Console.

## Firefox

*   Open the browser.
*   From the menu, select "Web Developer".
*   Finally, select "Web Console".

## Edge

*   Open the browser.
*   From the menu, select "Developer Tools".
*   Finally, select "Console".

## Opera

*   Open the browser.
*   From the menu, select "Developer".
*   From "Developer", select "Developer tools".  
    
*   Finally, select "Console".

## Safari

*   Go to Safari, Preferences, Advanced in the main menu.
*   Check "Enable Show Develop menu in menu bar".
*   When the new option "Develop" appears in the menu:  
    Choose "Show Error Console".

```javascript
<script>let a = 5;let b = 6;let c = a + b;console.log(c);
```

* * *

## See Also:

[JavaScript Errors](js_errors_intro.asp.html)

[JavaScript Silent Errors](js_errors_silent.asp.html)

[JavaScript Error Statemets](js_errors.asp.html)

[JavaScript Error Object](js_error_object.asp.html)

* * *

* * *