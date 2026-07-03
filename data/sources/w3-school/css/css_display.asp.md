# CSS The display Property

* * *

## The CSS display Property

The `[display](https://www.w3schools.com/cssref/pr_class_display.php)` property is an important CSS property for controlling layout. It specifies whether an HTML element is treated as a block or an inline element.

Every HTML element has a default display value, depending on what type of element it is. The default display value for most elements is `block` or `inline`.

The `[display](https://www.w3schools.com/cssref/pr_class_display.php)` property is used to change the default display behavior of HTML elements.

* * *

## Block-level Elements

A block-level element ALWAYS starts on a new line and takes up the full width available (stretches out to the left and right as far as it can).

The <div> element is a block-level element.

Examples of block-level elements:

*   <div>
*   <h1> - <h6>
*   <p>
*   <form>
*   <header>
*   <footer>
*   <section>

* * *

## Inline Elements

An inline element DOES NOT start on a new line and only takes up as much width as necessary.

This is an inline <span> element inside a paragraph.

Examples of inline elements:

*   <span>
*   <a>
*   <img>

* * *

* * *

## Common display Values

The CSS `[display](https://www.w3schools.com/cssref/pr_class_display.php)` property has many values. The following table lists the most commonly used:

Value

Description

inline

Displays an element as an inline element

block

Displays an element as a block element

contents

Makes the container disappear, making its child elements children of the element the next level up in the DOM

flex

Displays an element as a block-level flex container

grid

Displays an element as a block-level grid container

inline-block

Displays an element as an inline-level block container. The element itself is formatted as an inline element, but you can apply height, width, padding, and margin values

none

The element is completely hidden from the document flow (does not take up any space).

* * *

## Override the Default Display Value

The `[display](https://www.w3schools.com/cssref/pr_class_display.php)` property is used to change the default display behavior of HTML elements.

Changing an inline element to a block element, or vice versa, can be useful for making the page look a specific way, and still follow the web standards.

A common example is to change `<li>` elements to inline, to create a horizontal menu:

```javascript
li {  display: inline;}
```

**Note:** Setting the display property of an element only changes **how the element is displayed**, NOT what kind of element it is. So, an inline element with `display: block;` is not allowed to have other block elements inside it.

The following example displays <span> elements as block elements:

```javascript
span {  display: block;}
```

The following example displays <a> elements as block elements:

```javascript
a {  display: block;}
```

* * *

## Example of More Display Values

The following example demonstrates some more display values:

```javascript
p.ex1 {display: none;}p.ex2 {display: inline;}p.ex3 {display: block;}p.ex4 {display: inline-block;}p.ex5 {display: flex;}p.ex6 {display: grid;}
```

* * *

* * *