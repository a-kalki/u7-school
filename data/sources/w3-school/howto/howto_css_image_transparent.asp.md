# How TO - Image with Transparent Text

* * *

Learn how to create an image with a transparent (see-through) background text, using CSS.

* * *

## Transparent Image Text

![Norway](https://www.w3schools.com/w3images/notebook.jpg)

# Heading

Lorem ipsum dolor sit amet, an his etiam torquatos. Tollit soleat phaedrum te duo, eum cu recteque expetendis neglegentur. Cu mentitum maiestatis persequeris pro, pri ponderum tractatos ei.

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_image_transparent_bottom)

* * *

## How To Create a Transparent Image Text

##### Step 1) Add HTML:

```javascript
<div class="container">  <img src="notebook.jpg" alt="Notebook" style="width:100%;">  <div class="content">    <h1>Heading</h1>    <p>Lorem ipsum..</p>  </div></div>
```

* * *

##### Step 2) Add CSS:

```javascript
.container {  position: relative;  max-width: 800px; /* Maximum width */  margin: 0 auto; /* Center it */}.container .content {  position: absolute; /* Position the background text */  bottom: 0; /* At the bottom. Use top:0 to append it to the top */  background: rgb(0, 0, 0); /* Fallback color */  background: rgba(0, 0, 0, 0.5); /* Black background with 0.5 opacity */  color: #f1f1f1; /* Grey text */  width: 100%; /* Full width */  padding: 20px; /* Some padding */}
```

* * *

* * *