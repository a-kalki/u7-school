# CSS Lists

* * *

## CSS Styling Lists

In HTML, there are two main types of lists:

*   <ul> - unordered lists (list items are marked with bullets)
*   <ol> - ordered lists (list items are marked with numbers or letters)

CSS has the following properties for styling HTML lists:

*   `[list-style-type](https://www.w3schools.com/cssref/pr_list-style-type.php)` - Specifies the type of list-item marker
*   `[list-style-image](https://www.w3schools.com/cssref/pr_list-style-image.php)` - Specifies an image as the list-item marker
*   `[list-style-position](https://www.w3schools.com/cssref/pr_list-style-position.php)` - Specifies the position of the list-item markers
*   `[list-style](https://www.w3schools.com/cssref/pr_list-style.php)` - A shorthand property for the properties above

* * *

## CSS Style List-item Markers

The CSS `[list-style-type](https://www.w3schools.com/cssref/pr_list-style-type.php)` property specifies the type of list-item marker in a list.

The following example shows some of the available list-item markers:

```javascript
ul.a {list-style-type: circle;}ul.b {list-style-type: disc;}ul.c {list-style-type: square;}ol.d {list-style-type: upper-roman;}ol.e {list-style-type: lower-roman;}ol.f {list-style-type: lower-alpha;}ol.g {list-style-type: decimal;}
```

**Note:** Some of the values are for unordered lists, and some for ordered lists.

* * *

## CSS Replace List-item Marker with an Image

The CSS `[list-style-image](https://www.w3schools.com/cssref/pr_list-style-image.php)` property is used to replace the list-item marker with an image.

**Note:** Always specify a `[list-style-type](https://www.w3schools.com/cssref/pr_list-style-type.php)` property in addition. This property is used if the image for some reason is unavailable.

```javascript
ul {  list-style-image: url('sqpurple.gif');  list-style-type: square;}
```

* * *

## CSS Position the List-item Markers

The CSS `[list-style-position](https://www.w3schools.com/cssref/pr_list-style-position.php)` property specifies the position of the list-item markers (bullet points).

`list-style-position: outside;` means that the bullet points will be outside the list item. The start of each line of a list item will be aligned vertically. This is default:

*   Coffee
*   Tea
*   Coca-cola

`list-style-position: inside;` means that the bullet points will be inside the list item. As it is part of the list item, it will be part of the text and push the text at the start:

*   Coffee
*   Tea
*   Coca-cola

```javascript
ul.a {  list-style-position: outside;}ul.b {  list-style-position: inside;}
```

* * *

## CSS Remove List-Item Markers

The `list-style-type:none;` property is used to remove the list-item markers.

**Note:** A list has a default margin and padding. To remove this, add `margin:0` and `padding:0` to the <ul> or <ol> element:

```javascript
ul {  list-style-type: none;  margin: 0;  padding: 0;}
```

* * *

* * *

## CSS list-style Shorthand Property

The `[list-style](https://www.w3schools.com/cssref/pr_list-style.php)` property is a shorthand property. It is used to set all the list properties in one declaration.

When using the shorthand property, the order of the property values are:

*   `[list-style-type](https://www.w3schools.com/cssref/pr_list-style-type.php)`
*   `[list-style-position](https://www.w3schools.com/cssref/pr_list-style-position.php)`
*   `[list-style-image](https://www.w3schools.com/cssref/pr_list-style-image.php)`

If one of the property values above is missing, the default value for the missing property will be inserted.

```javascript
ul {  list-style: square inside url("sqpurple.gif");}
```

* * *

## CSS Styling List With Colors

We can also style lists with colors, margins and padding, to make them look a little more interesting.

Anything added to the <ol> or <ul> tag, affects the entire list, while properties added to the <li> tag will affect the individual list items:

```javascript
ol {  background: salmon;  padding: 20px;}ol li {  background: mistyrose;  color: darkred;  padding: 10px;  margin-left: 20px;}ul {  background: powderblue;  padding: 20px;}ul li {  background: mistyrose;  color: darkblue;  margin: 5px;}
```

* * *

## More Examples

[Customized list with a red left border](https://www.w3schools.com/css/tryit.asp?filename=trycss_list-style-red-border)  
This example demonstrates how to create a list with a red left border.

[Full-width bordered list](https://www.w3schools.com/css/tryit.asp?filename=trycss_list-style-border)  
This example demonstrates how to create a bordered list without bullets.

[All the different list-item markers for lists](https://www.w3schools.com/css/tryit.asp?filename=trycss_list-style-type_all)  
This example demonstrates all the different list-item markers in CSS.

* * *

* * *

## All CSS List Properties

Property

Description

[list-style](https://www.w3schools.com/cssref/pr_list-style.php)

Sets all the properties for a list in one declaration

[list-style-image](https://www.w3schools.com/cssref/pr_list-style-image.php)

Specifies an image as the list-item marker

[list-style-position](https://www.w3schools.com/cssref/pr_list-style-position.php)

Specifies the position of the list-item markers (bullet points)

[list-style-type](https://www.w3schools.com/cssref/pr_list-style-type.php)

Specifies the type of list-item marker