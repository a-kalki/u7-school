# How TO - Split Screen 1/2

* * *

Learn how to create a split screen (50/50) with CSS.

* * *

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_split_screen)

* * *

## How To Create A Split Screen

##### Step 1) Add HTML:

```javascript
<div class="split left">  <div class="centered">    <img src="img_avatar2.png" alt="Avatar woman">    <h2>Jane Flex</h2>    <p>Some text.</p>  </div></div><div class="split right">  <div class="centered">    <img src="img_avatar.png" alt="Avatar man">    <h2>John Doe</h2>    <p>Some text here too.</p>  </div></div>
```

* * *

* * *

##### Step 2) Add CSS:

```javascript
/* Split the screen in half */.split {  height: 100%;  width: 50%;  position: fixed;  z-index: 1;  top: 0;  overflow-x: hidden;  padding-top: 20px;}/* Control the left side */.left {  left: 0;  background-color: #111;}/* Control the right side */.right {  right: 0;  background-color: red;}/* If you want the content centered horizontally and vertically */.centered {  position: absolute;  top: 50%;  left: 50%;  transform: translate(-50%, -50%);  text-align: center;}/* Style the image inside the centered container, if needed */.centered img {  width: 150px;  border-radius: 50%;}
```