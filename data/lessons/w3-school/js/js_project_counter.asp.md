# Project - localStorage Counter

## A Counter with Reset and Save

In this project you will build a **counter** with buttons to:

*   **Increase** the counter
*   **Decrease** the counter
*   **Reset** the counter
*   **Save** the counter
*   **Load** the counter

0

+ \- Reset Save Load

## Project Skills

*   JavaScript Variables
*   JavaScript Functions
*   JavaScript HTML DOM
*   JavaScript Events (onclick attributes)
*   JavaScript localStorage (to **Save** and **Restore** the counter)

```javascript
<h2>Counter</h2><p id="count" style="font-size:40px;">0</p><button onclick="increaseCount()">+</button><button onclick="decreaseCount()">-</button><button onclick="resetCount()">Reset</button><button onclick="saveCount()">Save</button><button onclick="loadCount()">Load</button><script>// JavaScript code. See below.</script>
```

* * *

* * *

## 1\. Create the HTML

*   Add a `<h2>` header element
*   Add a `<p>` element displaying a number
*   Add 5 `<button>` elements
*   Add an `onclick` attribute to each button

```javascript
<h2>Counter</h2><p id="count" style="font-size:40px;">0</p><button onclick="increaseCount()">+</button><button onclick="decreaseCount()">-</button><button onclick="resetCount()">Reset</button><button onclick="saveCount()">Save</button><button onclick="loadCount()">Load</button>
```

* * *

## 2\. Create a Script

*   `let count = 0` declares a counter
*   `Function updateCount() {}` creates a function to update counter
*   `document.getElementById().innerHTML` displays the counter

```javascript
<script>// Declare a counterlet count = 0;// Function to display the counterfunction updateCount() {  document.getElementById("count").innerHTML = count;}</script>
```

* * *

## 3: Add an Increase Counter Function

*   `Function increaseCount() {}` creates an increase function
*   `count++` increases the counter
*   `updateCount()` diplays the counter

```javascript
// Function to increase the counterfunction increaseCount() {  count++;  updateCount();}
```

* * *

## 4: Add a Decease Counter Function

*   `Function decreaseCount() {}` creates a decrease function
*   `count--` decreases the counter
*   `updateCount()` diplays the counter

```javascript
// Function to decrease the counterfunction decreaseCount() {  count--;  updateCount();}
```

* * *

## 5: Add a Reset Counter Funtion

*   `Function resetCount() {}` creates a reset function
*   `count = 0` resets the counter
*   `updateCount()` diplays the counter

```javascript
function resetCount() {  count = 0;  updateCount();}
```

* * *

## 6: Create a Save Counter Function

*   `Function saveCount() {}` creates a save function
*   `localStorage.setItem()` saves the value.

```javascript
function saveCount() {  localStorage.setItem("count", count);}
```

* * *

## 7: Create a Load Counter Function

*   `Function loadCount() {}` creates a load function
*   `localStorage.getItem()` gets the value
*   `Number(saved)` converts saved to numberstdisplays the value.
*   `updateCount()` displays the value.

```javascript
function loadCount() {  let saved = localStorage.getItem("count");  if (saved !== null) {    count = Number(saved);  }  updateCount();}
```

* * *

## What Have You Learned?

*   How to update HTML using JavaScript
*   How to use button events (onclick)
*   How to store and load values from localStorage
*   How to keep your code organized with functions

* * *

## Exercises

* * *

### Exercice 1

Make the counter start at 10 instead of 0.

### Exercice 2

Prevent the counter from going below 0.

### Exercice 3

Automatically load the saved counter value when the page opens.

```javascript
// Declare the counterlet count = 10;// Load the counter when the page opensloadCount();// Function to display the counterfunction updateCount() {  document.getElementById("count").innerHTML = count;}// Function to increase the counterfunction increaseCount() {  count++;  updateCount();}// Function to decrease the counterfunction decreaseCount() {  if (count > 0) {    count--;    updateCount();  }}// Function to reset the counterfunction resetCount() {  count = 10;  updateCount();}// Function to save the counterfunction saveCount() {  localStorage.setItem("count", count);}// Function to load the counterfunction loadCount() {  let saved = localStorage.getItem("count");  if (saved !== null) {    count = Number(saved);  }  updateCount();}
```

Try saving the value, reload the page, and see if it load automatically.

## JavaScript Projects

*   [JavaScript Counter](js_project_counter.asp.html)  
    A counter project with restore and save in lovalStorage.
*   [JavaScript Event Listener](js_project_eventlistener.asp.html)  
    The counter project using event listener instead of onclick.
*   [JavaScript Do-Do List](js_project_todo.asp.html)  
    A do-do list saved in an array in local storage.
*   [JavaScript Modal Popup](js_project_modal_popup.asp.html)  
    A modal popup window that appears on top of the page.