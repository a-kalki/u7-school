# CSS Margins

* * *

## CSS Margins

The CSS margin properties are used to create space around elements, outside of any defined borders.

Margins define the distance between an element's border and the surrounding elements.

With CSS, you have full control over the margins. CSS has properties for setting the margin for each individual side of an element (top, right, bottom, and left), and a shorthand property for setting all the margin properties in one declaration.

This element has a margin of 70px.

[Try it Yourself »](https://www.w3schools.com/css/tryit.asp?filename=trycss_margin_intro)

* * *

## Margin - Individual Sides

CSS has properties for specifying the margin for each side of an element:

*   `[margin-top](https://www.w3schools.com/cssref/pr_margin-top.php)` - sets the top margin of an element
*   `[margin-right](https://www.w3schools.com/cssref/pr_margin-right.php)` - sets the right margin of an element
*   `[margin-bottom](https://www.w3schools.com/cssref/pr_margin-bottom.php)` - sets the bottom margin of an element
*   `[margin-left](https://www.w3schools.com/cssref/pr_margin-left.php)` - sets the left margin of an element

All the margin properties can have the following values:

*   auto - the browser calculates the margin
*   _length_ - specifies a margin in px, pt, cm, etc.
*   _%_ - specifies a margin in % of the width of the containing element
*   inherit - specifies that the margin should be inherited from the parent element

**Tip:** Negative values are also allowed.

```javascript
p {  margin-top: 100px;  margin-bottom: 100px;  margin-right: 150px;  margin-left: 80px;}
```

* * *

* * *

## Margin - Shorthand Property

To shorten the code, it is possible to specify all the margin properties in one declaration.

The `[margin](https://www.w3schools.com/cssref/pr_margin.php)` property is a shorthand property for the following individual margin properties:

*   `[margin-top](https://www.w3schools.com/cssref/pr_margin-top.php)`
*   `[margin-right](https://www.w3schools.com/cssref/pr_margin-right.php)`
*   `[margin-bottom](https://www.w3schools.com/cssref/pr_margin-bottom.php)`
*   `[margin-left](https://www.w3schools.com/cssref/pr_margin-left.php)`

Here is how it works:

If the `[margin](https://www.w3schools.com/cssref/pr_margin.php)` property has four values:

*   **margin: 25px 50px 75px 100px;**
    *   top margin is 25px
    *   right margin is 50px
    *   bottom margin is 75px
    *   left margin is 100px

```javascript
p {  margin: 25px 50px 75px 100px;}
```

If the `[margin](https://www.w3schools.com/cssref/pr_margin.php)` property has three values:

*   **margin: 25px 50px 75px;**
    *   top margin is 25px
    *   right and left margins are 50px
    *   bottom margin is 75px

```javascript
p {  margin: 25px 50px 75px;}
```

If the `[margin](https://www.w3schools.com/cssref/pr_margin.php)` property has two values:

*   **margin: 25px 50px;**
    *   top and bottom margins are 25px
    *   right and left margins are 50px

```javascript
p {  margin: 25px 50px;}
```

If the `[margin](https://www.w3schools.com/cssref/pr_margin.php)` property has one value:

*   **margin: 25px;**
    *   all four margins are 25px

```javascript
p {  margin: 25px;}
```

* * *

## The auto Value

You can set the `[margin](https://www.w3schools.com/cssref/pr_margin.php)` property to `auto` to horizontally center the element within its container.

The element will then take up the specified width, and the remaining space will be split equally between the left and right margins.

```javascript
div {  width: 300px;  margin: auto;  border: 1px solid red;}
```

* * *

## The inherit Value

You can set the `[margin](https://www.w3schools.com/cssref/pr_margin.php)` property to `inherit` to let the margin be inherited from the parent element.

This example lets the left margin of the <p class="ex1"> element be inherited from the parent element (<div>):

```javascript
div {  border: 1px solid red;  margin-left: 100px;}p.ex1 {  margin-left: inherit;}
```

* * *

* * *

## All CSS Margin Properties

Property

Description

[margin](https://www.w3schools.com/cssref/pr_margin.php)

A shorthand property for setting all the margin properties in one declaration

[margin-bottom](https://www.w3schools.com/cssref/pr_margin-bottom.php)

Sets the bottom margin of an element

[margin-left](https://www.w3schools.com/cssref/pr_margin-left.php)

Sets the left margin of an element

[margin-right](https://www.w3schools.com/cssref/pr_margin-right.php)

Sets the right margin of an element

[margin-top](https://www.w3schools.com/cssref/pr_margin-top.php)

Sets the top margin of an element