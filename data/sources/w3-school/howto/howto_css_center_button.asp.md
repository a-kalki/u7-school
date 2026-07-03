# How TO - Center a Button in DIV

* * *

Learn how to center a button element vertically and horizontally with CSS.

* * *

Centered Button

* * *

## How To Center a Button Vertically

```javascript
<style>.container {  height: 200px;  position: relative;  border: 3px solid green;}.vertical-center {  margin: 0;  position: absolute;  top: 50%;  -ms-transform: translateY(-50%);  transform: translateY(-50%);}</style><div class="container">  <div class="vertical-center">    <button>Centered Button</button>  </div></div>
```

* * *

* * *

## How To Center Vertically AND Horizontally

```javascript
<style>.container {  height: 200px;  position: relative;  border: 3px solid green;}.center {  margin: 0;  position: absolute;  top: 50%;  left: 50%;  -ms-transform: translate(-50%, -50%);  transform: translate(-50%, -50%);}</style><div class="container">  <div class="center">    <button>Centered Button</button>  </div></div>
```

You can also use flexbox to center things:

```javascript
.center {  display: flex;  justify-content: center;  align-items: center;  height: 200px;  border: 3px solid green;}
```

**Tip:** Go to our [CSS Align Tutorial](https://www.w3schools.com/css/css_align.asp) to learn more about aligning elements.

**Tip:** Go to our [CSS Transform Tutorial](https://www.w3schools.com/css/css3_2dtransforms.asp) to learn more about how to scale elements.

**Tip:** Go to our [CSS Flexbox Tutorial](https://www.w3schools.com/css/css3_flexbox.asp) to learn more flexbox.