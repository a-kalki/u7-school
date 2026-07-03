# CSS  Rounded Corners

* * *

## CSS Rounded Corners

The CSS `[border-radius](https://www.w3schools.com/cssref/css3_pr_border-radius.php)` property is used to create rounded corners for elements.

* * *

## CSS border-radius Property

The `[border-radius](https://www.w3schools.com/cssref/css3_pr_border-radius.php)` property defines the radius of an element's corners.

This property can be applied to all elements with a `[background-color](https://www.w3schools.com/cssref/pr_background-color.php)`, a `[border](https://www.w3schools.com/cssref/pr_border.php)`, or a `[background-image](https://www.w3schools.com/cssref/pr_background-image.php)`.

Here are three examples:

1\. Rounded corners for an element with a background color:

Rounded corners!

2\. Rounded corners for an element with a border:

Rounded corners!

3\. Rounded corners for an element with a background image:

Rounded corners!

Here is the code:

```javascript
#div1 {  border-radius: 25px;  background-color: #73AD21;  padding: 20px;  width: 200px;  height: 150px;}#div2 {  border-radius: 25px;  border: 2px solid #73AD21;  padding: 20px;  width: 200px;  height: 150px;}#div3 {  border-radius: 25px;  background-image: url(paper.gif);  background-position: left top;  background-repeat: repeat;  padding: 20px;  width: 200px;  height: 150px;}
```

**Tip:** The `[border-radius](https://www.w3schools.com/cssref/css3_pr_border-radius.php)` property is actually a shorthand property for the `[border-top-left-radius](https://www.w3schools.com/cssref/css3_pr_border-top-left-radius.php)`, `[border-top-right-radius](https://www.w3schools.com/cssref/css3_pr_border-top-right-radius.php)`, `[border-bottom-right-radius](https://www.w3schools.com/cssref/css3_pr_border-bottom-right-radius.php)` and `[border-bottom-left-radius](https://www.w3schools.com/cssref/css3_pr_border-bottom-left-radius.php)` properties.

* * *

* * *

## CSS border-radius - Specify Each Corner

The `[border-radius](https://www.w3schools.com/cssref/css3_pr_border-radius.php)` property can have from one to four values. Here are the rules:

**Four values - border-radius: 15px 50px 30px 5px;** (first value applies to top-left corner, second value applies to top-right corner, third value applies to bottom-right corner, and fourth value applies to bottom-left corner): 

**Three values - border-radius: 15px 50px 30px;** (first value applies to top-left corner, second value applies to top-right and bottom-left corners, and third value applies to bottom-right corner):

**Two values - border-radius: 15px 50px;** (first value applies to top-left and bottom-right corners, and the second value applies to top-right and bottom-left corners):

**One value - border-radius: 15px;** (the value applies to all four corners, which are rounded equally:

Here is the code:

```javascript
#div1 {  border-radius: 15px 50px 30px 5px; /* four values */ background: #04AA6D;  width: 200px;  height: 150px;}#div2 {  border-radius: 15px 50px 30px; /* three values */  background: #04AA6D;  width: 200px;  height: 150px;}#div3 {  border-radius: 15px 50px; /* two values */  background: #04AA6D;  width: 200px;  height: 150px;}#div4 {  border-radius: 15px; /* one value */  background: #04AA6D;  width: 200px;  height: 150px;}
```

* * *

## CSS Elliptical and Circular Shapes

To create elliptical corners, you must specify two values for each radius, separated by a slash /. The first value defines the horizontal radius, and the second value defines the vertical radius.

To create a oval shape (for a rectangular element), or to create a circular shape (for a square element) set `[border-radius](https://www.w3schools.com/cssref/css3_pr_border-radius.php)` to 50%. 

```javascript
#div1 {  border-radius: 70px / 30px;  background: #04AA6D;  width: 200px;  height: 150px;}#div2 {  border-radius: 15px / 50px;  background: #04AA6D;  width: 200px;  height: 150px;}#div3 {  border-radius: 50%;  background: #04AA6D;  width: 200px;  height: 150px;}#div4 {border-radius: 50%;background: #04AA6D;width: 200px;height: 200px;}
```

* * *

* * *

## CSS Rounded Corners Properties

Property

Description

[border-radius](https://www.w3schools.com/cssref/css3_pr_border-radius.php)

A shorthand property for setting all the four border-\*-\*-radius properties

[border-top-left-radius](https://www.w3schools.com/cssref/css3_pr_border-top-left-radius.php)

Defines the shape of the border of the top-left corner

[border-top-right-radius](https://www.w3schools.com/cssref/css3_pr_border-top-right-radius.php)

Defines the shape of the border of the top-right corner

[border-bottom-right-radius](https://www.w3schools.com/cssref/css3_pr_border-bottom-right-radius.php)

Defines the shape of the border of the bottom-right corner

[border-bottom-left-radius](https://www.w3schools.com/cssref/css3_pr_border-bottom-left-radius.php)

Defines the shape of the border of the bottom-left corner