# How TO - Thumbnail

* * *

Learn how to create a thumbnail image.

* * *

## Thumbnail Image

A thumbnail is a small image that represents a larger image (when clicked on), and is often recognized with a border around it:

[![Paris](img_forest.jpg)](img_forest.jpg)

* * *

## How To Create a Thumbnail Image

Use an <img> element and wrap an <a> element around it. Style the image with a border and add a hover effect:

```javascript
<style>img {  border: 1px solid #ddd; /* Gray border */  border-radius: 4px;  /* Rounded border */  padding: 5px; /* Some padding */  width: 150px; /* Set a small width */}/* Add a hover effect (blue shadow) */img:hover {  box-shadow: 0 0 2px 1px rgba(0, 140, 186, 0.5);}</style><body><a target="_blank" href="img_forest.jpg">  <img src="img_forest.jpg" alt="Forest"></a></body>
```

Go to our [CSS Images Tutorial](https://www.w3schools.com/css/css3_images.asp) to learn more about how to style images.

* * *

* * *