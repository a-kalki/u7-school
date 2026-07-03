# How TO - Button on Image

* * *

Learn how to add a button to an image with CSS.

* * *

## Button on Image

![Snow](img_snow.jpg)

Button

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_button_on_image)

* * *

## How To Add Button over Image

##### Step 1) Add HTML:

```javascript
<div class="container">  <img src="img_snow.jpg" alt="Snow">  <button class="btn">Button</button></div>
```

* * *

* * *

##### Step 2) Add CSS:

```javascript
/* Container needed to position the button. Adjust the width as needed */.container {  position: relative;  width: 50%;}/* Make the image responsive */.container img {  width: 100%;  height: auto;}/* Style the button and place it in the middle of the container/image */.container .btn {  position: absolute;  top: 50%;  left: 50%;  transform: translate(-50%, -50%);  -ms-transform: translate(-50%, -50%);  background-color: #555;  color: white;  font-size: 16px;  padding: 12px 24px;  border: none;  cursor: pointer;  border-radius: 5px;}.container .btn:hover {  background-color: black;}
```