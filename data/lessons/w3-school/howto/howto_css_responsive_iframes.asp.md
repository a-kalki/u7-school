# How TO - Responsive Iframe

* * *

Learn how to create responsive iframes with CSS.

* * *

## Responsive Iframes

Create an iframe that will keep the aspect ratio (4:3, 16:9, etc.) when resized:

**What is aspect ratio?**  
  
The aspect ratio of an element describes the proportional relationship between its width and its height. Two common video aspect ratios are 4:3 (the universal video format of the 20th century), and 16:9 (universal for HD television and European digital television, and for YouTube videos).

* * *

## How To - Responsive Iframes

##### Step 1) Add HTML:

Use a container element, like <div>, and add the iframe inside of it:

```javascript
<div class="container">  <iframe class="responsive-iframe" src="https://www.youtube.com/embed/tgbNymZ7vqY"></iframe></div>
```

* * *

* * *

##### Step 2) Add CSS:

Add a percentage value for `padding-top` to maintain the aspect ratio of the container DIV. The following example will create an aspect ratio of 16:9, which is the default aspect ratio of YouTube videos.

```javascript
.container {  position: relative;  overflow: hidden;  width: 100%;  padding-top: 56.25%; /* 16:9 Aspect Ratio (divide 9 by 16 = 0.5625) */}/* Then style the iframe to fit in the container div with full height and width */.responsive-iframe {  position: absolute;  top: 0;  left: 0;  bottom: 0;  right: 0;  width: 100%;  height: 100%;}
```

Other aspect ratios:

```javascript
.container {  padding-top: 75%; /* 4:3 Aspect Ratio */}
```
```javascript
.container {  padding-top: 66.66%; /* 3:2 Aspect Ratio */}
```
```javascript
.container {  padding-top: 62.5%; /* 8:5 Aspect Ratio */}
```
```javascript
.container {  padding-top: 100%; /* 1:1 Aspect Ratio */}
```