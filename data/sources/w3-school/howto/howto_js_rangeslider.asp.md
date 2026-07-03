# How TO - Range Sliders

* * *

Learn how to create custom range sliders with CSS and JavaScript.

* * *

#### Default:

#### Square:

#### Round:

#### Image:

Value:

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_rangeslider)

* * *

## Creating a Range Slider

##### Step 1) Add HTML:

```javascript
<div class="slidecontainer">  <input type="range" min="1" max="100" value="50" class="slider" id="myRange"></div>
```

##### Step 2) Add CSS:

```javascript
.slidecontainer {  width: 100%; /* Width of the outside container */}/* The slider itself */.slider {  -webkit-appearance: none;  /* Override default CSS styles */  appearance: none;  width: 100%; /* Full-width */  height: 25px; /* Specified height */  background: #d3d3d3; /* Grey background */  outline: none; /* Remove outline */  opacity: 0.7; /* Set transparency (for mouse-over effects on hover) */  -webkit-transition: .2s; /* 0.2 seconds transition on hover */  transition: opacity .2s;}/* Mouse-over effects */.slider:hover {  opacity: 1; /* Fully shown on mouse-over */}/* The slider handle (use -webkit- (Chrome, Opera, Safari, Edge) and -moz- (Firefox) to override default look) */.slider::-webkit-slider-thumb {  -webkit-appearance: none; /* Override default look */  appearance: none;  width: 25px; /* Set a specific slider handle width */  height: 25px; /* Slider handle height */  background: #04AA6D; /* Green background */  cursor: pointer; /* Cursor on hover */}.slider::-moz-range-thumb {  width: 25px; /* Set a specific slider handle width */  height: 25px; /* Slider handle height */  background: #04AA6D; /* Green background */  cursor: pointer; /* Cursor on hover */}
```

##### Step 3) Add JavaScript:

Create a dynamic range slider to display the current value, with JavaScript:

```javascript
var slider = document.getElementById("myRange");var output = document.getElementById("demo");output.innerHTML = slider.value; // Display the default slider value// Update the current slider value (each time you drag the slider handle)slider.oninput = function() {  output.innerHTML = this.value;}
```

* * *

* * *

## Round Slider

To create a round slider handle, use the `border-radius` property. **Tip:** Set the height of the slider to a different value than the slider thumbs if you want unequal heights (15px vs. 25px in this example):

```javascript
.slider {  -webkit-appearance: none;  width: 100%;  height: 15px;  border-radius: 5px;    background: #d3d3d3;  outline: none;  opacity: 0.7;  -webkit-transition: .2s;  transition: opacity .2s;}.slider::-webkit-slider-thumb {  -webkit-appearance: none;  appearance: none;  width: 25px;  height: 25px;  border-radius: 50%;   background: #04AA6D;  cursor: pointer;}.slider::-moz-range-thumb {  width: 25px;  height: 25px;  border-radius: 50%;  background: #04AA6D;  cursor: pointer;}
```

* * *

## Slider Icon/Image

To create a slider handle icon/image, use the `background` property and insert an image url:

```javascript
.slider::-webkit-slider-thumb {  -webkit-appearance: none;  appearance: none;  width: 23px;  height: 24px;  border: 0;  background: url('contrasticon.png');  cursor: pointer;}.slider::-moz-range-thumb {  width: 23px;  height: 25px;  border: 0;  background: url('contrasticon.png');  cursor: pointer;}
```