# How TO - Hero Image

* * *

Learn how to create a Hero Image with CSS.

* * *

A Hero Image is a large image with text, often placed at the top of a webpage:

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_hero_image)

* * *

## How To Create a Hero Image

##### Step 1) Add HTML:

```javascript
<div class="hero-image">  <div class="hero-text">    <h1>I am John Doe</h1>    <p>And I'm a Photographer</p>    <button>Hire me</button>  </div></div>
```

* * *

* * *

##### Step 2) Add CSS:

```javascript
body, html {    height: 100%;}/* The hero image */.hero-image {  /* Use "linear-gradient" to add a darken background effect to the image (photographer.jpg). This will make the text easier to read */  background-image: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url("photographer.jpg");  /* Set a specific height */  height: 50%;  /* Position and center the image to scale nicely on all screens */  background-position: center;  background-repeat: no-repeat;  background-size: cover;  position: relative;}/* Place text in the middle of the image */.hero-text {  text-align: center;  position: absolute;  top: 50%;  left: 50%;  transform: translate(-50%, -50%);  color: white;}
```