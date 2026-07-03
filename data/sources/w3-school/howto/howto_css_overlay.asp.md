# How TO - Overlay

* * *

Learn how to create an overlay effect with CSS.

* * *

## Overlay

Learn how to create an overlay effect:

Overlay

  
  
Click anywhere to turn off the overlay effect

Turn on the overlay effect

* * *

## How To Create an Overlay Effect

##### Step 1) Add HTML:

Use any element and place it anywhere inside the document:

```javascript
<div id="overlay"></div>
```

* * *

##### Step 2) Add CSS:

Style the overlay element:

```javascript
#overlay {  position: fixed; /* Sit on top of the page content */  display: none; /* Hidden by default */  width: 100%; /* Full width (cover the whole page) */  height: 100%; /* Full height (cover the whole page) */  top: 0;  left: 0;  right: 0;  bottom: 0;  background-color: rgba(0,0,0,0.5); /* Black background with opacity */  z-index: 2; /* Specify a stack order in case you're using a different order for other elements */  cursor: pointer; /* Add a pointer on hover */}
```

* * *

* * *

##### Step 3) Add JavaScript:

Use JavaScript to turn on and off the overlay effect:

```javascript
function on() {  document.getElementById("overlay").style.display = "block";}function off() {  document.getElementById("overlay").style.display = "none";}
```

* * *

## Overlay Effect with Text

Add anything you want inside the overlay, and place it where you want. In this example we add text in the middle of the page:

```javascript
<style>#text{  position: absolute;  top: 50%;  left: 50%;  font-size: 50px;  color: white;  transform: translate(-50%,-50%);  -ms-transform: translate(-50%,-50%);}</style><div id="overlay">  <div id="text">Overlay Text</div></div>
```