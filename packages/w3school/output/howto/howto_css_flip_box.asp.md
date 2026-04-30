# How TO - 3D Flip Box

* * *

Learn how to create a flip box with CSS.

* * *

## Flip Box

Move your mouse over the boxes below to see the effect:

**Horizontal** Flip:

## Front Side

## Back Side

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_flip_box)

**Vertical** Flip:

## Front Side

## Back Side

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_flip_box2)

* * *

## How To Create a Flip Box

##### Step 1) Add HTML:

```javascript
<div class="flip-box">  <div class="flip-box-inner">    <div class="flip-box-front">      <h2>Front Side</h2>    </div>    <div class="flip-box-back">      <h2>Back Side</h2>    </div>  </div></div>
```

* * *

* * *

##### Step 2) Add CSS:

```javascript
/* The flip box container - set the width and height to whatever you want. We have added the border property to demonstrate that the flip itself goes out of the box on hover (remove perspective if you don't want the 3D effect */.flip-box {  background-color: transparent;  width: 300px;  height: 200px;  border: 1px solid #f1f1f1;  perspective: 1000px; /* Remove this if you don't want the 3D effect */}/* This container is needed to position the front and back side */.flip-box-inner {  position: relative;  width: 100%;  height: 100%;  text-align: center;  transition: transform 0.8s;  transform-style: preserve-3d;}/* Do an horizontal flip when you move the mouse over the flip box container */.flip-box:hover .flip-box-inner {  transform: rotateY(180deg);}/* Position the front and back side */.flip-box-front, .flip-box-back {  position: absolute;  width: 100%;  height: 100%;  -webkit-backface-visibility: hidden; /* Safari */  backface-visibility: hidden;}/* Style the front side */.flip-box-front {  background-color: #bbb;  color: black;}/* Style the back side */.flip-box-back {  background-color: dodgerblue;  color: white;  transform: rotateY(180deg);}
```

* * *

## Vertical Flip

To do a vertical flip instead of a horizontal, use the `rotateX` method instead of `rotateY`:

```javascript
.flip-box:hover .flip-box-inner {  transform: rotateX(180deg);}.flip-box-back {  transform: rotateX(180deg);}
```

**Note:** These examples do not work properly on tablets and/or mobile phones.

**Tip:** Go to our [CSS 2D Transforms](https://www.w3schools.com/css/css3_2dtransforms.asp) Tutorial, to learn more about 2D transformations, such as the rotate() method.

**Tip:** Go to our [CSS 3D Transforms](https://www.w3schools.com/css/css3_3dtransforms.asp) Tutorial, to learn more about 3D transformations.