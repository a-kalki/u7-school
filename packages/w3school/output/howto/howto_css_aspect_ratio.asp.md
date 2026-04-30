# How TO - Aspect Ratio

* * *

Learn how to maintain the aspect ratio of an element with CSS.

* * *

## Aspect Ratio

Create flexible elements that keep their aspect ratio (4:3, 16:9, etc.) when resized:

![](aspect_ratio.png)

**What is aspect ratio?**  
  
The aspect ratio of an element describes the proportional relationship between its width and its height. Two common video aspect ratios are 4:3 (the universal video format of the 20th century), and 16:9 (universal for HD television and European digital television, and default for YouTube videos).

* * *

## How To - Height Equal to Width

##### Step 1) Add HTML:

Use a container element, like <div>, and if you want text inside of it, add a child element:

```javascript
<div class="container">  <div class="text">Some text</div> <!-- If you want text inside the container --></div>
```

* * *

* * *

##### Step 2) Add CSS:

Add a percentage value for `padding-top` to maintain the aspect ratio of the DIV. The following example will create an aspect ratio of 1:1 (the height and width is always equal):

```javascript
.container {  background-color: red;  width: 100%;  padding-top: 100%; /* 1:1 Aspect Ratio */  position: relative; /* If you want text inside of it */}/* If you want text inside of the container */.text {  position: absolute;  top: 0;  left: 0;  bottom: 0;  right: 0;}
```

Other aspect ratios:

```javascript
.container {  padding-top: 56.25%; /* 16:9 Aspect Ratio (divide 9 by 16 = 0.5625) */}
```
```javascript
.container {  padding-top: 75%; /* 4:3 Aspect Ratio (divide 3 by 4 = 0.75) */}
```
```javascript
.container {  padding-top: 66.66%; /* 3:2 Aspect Ratio (divide 2 by 3 = 0.6666)  */}
```
```javascript
.container {  padding-top: 62.5%; /* 8:5 Aspect Ratio (divide 5 by 8 = 0.625) */}
```

* * *

## The aspect-ratio CSS Property

In newer browsers, you can simply use the CSS [`aspect-ratio`](https://www.w3schools.com/cssref/css_pr_aspect-ratio.php) property:

```javascript
.container {  aspect-ratio: 3 / 2;}
```

The numbers in the table specify the first browser version that fully supports the property.

Property

aspect-ratio

88

88

89

15

74