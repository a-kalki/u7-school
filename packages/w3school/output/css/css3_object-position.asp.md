# CSS object-position Property

* * *

## CSS object-position Property

The CSS `[object-position](https://www.w3schools.com/cssref/css3_pr_object-position.php)` property is used together with the `[object-fit](https://www.w3schools.com/cssref/css3_pr_object-fit.php)` property to specify how an <img> or <video> should be positioned with x/y coordinates within its container.

The first value controls the x-axis and the second value controls the y-axis. The value can be a string (left, center or right), or a number (in px or %). Negative values are also allowed.

* * *

## Using the object-position Property

Let's say that the part of the image that is shown, is not the part that we want. To position the image, we will use the `object-position` property.

Here we position the image so that the great old building is in center:

![Paris](paris.jpg)
```javascript
.image-container {  width: 200px;  height: 300px;  border: 1px solid black;}.image-container img {  width: 100%;  height: 100%;  object-fit: cover;  object-position: 80% 100%;}
```

* * *

* * *

Here we will use the `[object-position](https://www.w3schools.com/cssref/css3_pr_object-position.php)` property to position the image so that the famous Eiffel Tower is in center:

![Paris](paris.jpg)
```javascript
.image-container {  width: 200px;  height: 300px;  border: 1px solid black;}.image-container img {  width: 100%;  height: 100%;  object-fit: cover;  object-position: 15% 100%;}
```

* * *

* * *

## CSS Object-\* Properties

The following table lists the CSS object-\* properties:

Property

Description

[object-fit](https://www.w3schools.com/cssref/css3_pr_object-fit.php)

Specifies how an <img> or <video> should be resized to fit its container

[object-position](https://www.w3schools.com/cssref/css3_pr_object-position.php)

Specifies how an <img> or <video> should be positioned with x/y coordinates inside its "own content box"