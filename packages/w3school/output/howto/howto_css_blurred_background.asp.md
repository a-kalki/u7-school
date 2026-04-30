# How TO - Blurred Background Image

* * *

Learn how to create a blurry background image with CSS.

* * *

## Blur Background Image

**Note:** This example does not work in Edge 12, IE 11 or earlier versions.

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_blurred_bg)

* * *

## How To Create a Blurry Background Image

##### Step 1) Add HTML:

```javascript
<div class="bg-image"></div><div class="bg-text">  <h1>I am John Doe</h1>  <p>And I'm a Photographer</p></div>
```

* * *

* * *

##### Step 2) Add CSS:

```javascript
body, html {  height: 100%;}* {  box-sizing: border-box;}.bg-image {  /* The image used */  background-image: url("photographer.jpg");  /* Add the blur effect */  filter: blur(8px);  -webkit-filter: blur(8px);  /* Full height */  height: 100%;  /* Center and scale the image nicely */  background-position: center;  background-repeat: no-repeat;  background-size: cover;}/* Position text in the middle of the page/image */.bg-text {  background-color: rgb(0,0,0); /* Fallback color */  background-color: rgba(0,0,0, 0.4); /* Black w/opacity/see-through */  color: white;  font-weight: bold;  border: 3px solid #f1f1f1;  position: absolute;  top: 50%;  left: 50%;  transform: translate(-50%, -50%);  z-index: 2;  width: 80%;  padding: 20px;  text-align: center;}
```