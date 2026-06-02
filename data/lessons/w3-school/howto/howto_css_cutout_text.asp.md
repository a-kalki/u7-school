# How TO - Cutout Text

* * *

Learn how to create a responsive cutout/knockout text with CSS.

* * *

A cutout text (or knockout text) is a see-through text that appears cut out on top of a background image:

NATURE

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_cutout_text)

**Note:** This example does not work in Internet Explorer or Edge.

* * *

## How To Create a Cutout Text

##### Step 1) Add HTML:

```javascript
<div class="image-container">  <div class="text">NATURE</div></div>
```

* * *

* * *

##### Step 2) Add CSS:

The `mix-blend-mode` property makes it possible to add the cutout text to the image. However, it is not supported in IE or Edge:

```javascript
.image-container {  background-image: url("img_nature.jpg"); /* The image used - important! */  background-size: cover;  position: relative; /* Needed to position the cutout text in the middle of the image */  height: 300px; /* Some height */}.text {  background-color: white;  color: black;  font-size: 10vw; /* Responsive font size */  font-weight: bold;  margin: 0 auto; /* Center the text container */  padding: 10px;  width: 50%;  text-align: center; /* Center text */  position: absolute; /* Position text */  top: 50%; /* Position text in the middle */  left: 50%; /* Position text in the middle */  transform: translate(-50%, -50%); /* Position text in the middle */  mix-blend-mode: screen; /* This makes the cutout text possible */}
```

If you want a black container text, change the mix-blend-mode to "multiply" and background-color to black, and color to white:

```javascript
.text {  background-color: black;  color: white;  mix-blend-mode: multiply;  ....}
```