# CSS Padding

* * *

## CSS Padding

The CSS padding properties are used to generate space around an element's content, inside of any defined borders.

With CSS, you have full control over the padding. There are properties for setting the padding for each side of an element (top, right, bottom, and left), and a shorthand property for setting all the padding properties in one declaration.

This element has a padding of 70px.

  
[Try it Yourself »](https://www.w3schools.com/css/tryit.asp?filename=trycss_padding_intro)

* * *

## Padding - Individual Sides

CSS has properties for specifying the padding for each side of an element:

*   `[padding-top](https://www.w3schools.com/cssref/pr_padding-top.php)` - sets the top padding of an element
*   `[padding-right](https://www.w3schools.com/cssref/pr_padding-right.php)` - sets the right padding of an element
*   `[padding-bottom](https://www.w3schools.com/cssref/pr_padding-bottom.php)` - sets the bottom padding of an element
*   `[padding-left](https://www.w3schools.com/cssref/pr_padding-left.php)` - sets the left padding of an element

All the padding properties can have the following values:

*   _length_ - specifies a padding in px, pt, cm, etc.
*   _%_ - specifies a padding in % of the width of the containing element
*   inherit - specifies that the padding should be inherited from the parent element

**Note:** Negative values are not allowed.

```javascript
div {  padding-top: 50px;  padding-right: 30px;  padding-bottom: 50px;  padding-left: 80px;}
```

* * *

* * *

## Padding - Shorthand Property

To shorten the code, it is possible to specify all the padding properties in one declaration.

The `[padding](https://www.w3schools.com/cssref/pr_padding.php)` property is a shorthand property for the following individual padding properties:

*   `[padding-top](https://www.w3schools.com/cssref/pr_padding-top.php)`
*   `[padding-right](https://www.w3schools.com/cssref/pr_padding-right.php)`
*   `[padding-bottom](https://www.w3schools.com/cssref/pr_padding-bottom.php)`
*   `[padding-left](https://www.w3schools.com/cssref/pr_padding-left.php)`

Here is how it works:

If the `[padding](https://www.w3schools.com/cssref/pr_padding.php)` property has four values:

*   **padding: 25px 50px 75px 100px;**
    *   top padding is 25px
    *   right padding is 50px
    *   bottom padding is 75px
    *   left padding is 100px

```javascript
div {  padding: 25px 50px 75px 100px;}
```

If the `[padding](https://www.w3schools.com/cssref/pr_padding.php)` property has three values:

*   **padding: 25px 50px 75px;**
    *   top padding is 25px
    *   right and left paddings are 50px
    *   bottom padding is 75px

```javascript
div {  padding: 25px 50px 75px;}
```

If the `[padding](https://www.w3schools.com/cssref/pr_padding.php)` property has two values:

*   **padding: 25px 50px;**
    *   top and bottom paddings are 25px
    *   right and left paddings are 50px

```javascript
div {  padding: 25px 50px;}
```

If the `[padding](https://www.w3schools.com/cssref/pr_padding.php)` property has one value:

*   **padding: 25px;**
    *   all four paddings are 25px

```javascript
div {  padding: 25px;}
```

* * *

## More Examples

[Set the left-padding property](https://www.w3schools.com/css/tryit.asp?filename=trycss_padding-left)  
This example demonstrates how to set the left padding of a <p> element.

[Set the right-padding property](https://www.w3schools.com/css/tryit.asp?filename=trycss_padding-right)  
This example demonstrates how to set the right padding of a <p> element.

[Set the top-padding property](https://www.w3schools.com/css/tryit.asp?filename=trycss_padding-top)  
This example demonstrates how to set the top padding of a <p> element.

[Set the bottom-padding property](https://www.w3schools.com/css/tryit.asp?filename=trycss_padding-bottom)  
This example demonstrates how to set the bottom padding of a <p> element.

* * *