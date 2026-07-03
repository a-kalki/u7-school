# CSS User Interface

* * *

## CSS User Interface

In this chapter you will learn about the following CSS user interface properties:

*   `resize`
*   `outline-offset`

* * *

## CSS Resize

The `[resize](https://www.w3schools.com/cssref/css3_pr_resize.php)` property specifies if (and how) an element can be resized by a user.

This property can have one of the following values:

*   `horizontal` - user can resize the element horizontally (the width)
*   `vertical` - user can resize the element vertically (the height)
*   `both` - user can resize the element both vertically and horizontally
*   `none` - user cannot resize the element

You can resize this div element in a vertical way!

To resize: Click and drag at the bottom-right corner!

### CSS Resize - Only Width

The following example lets the user resize only the width of a <div> element:

```javascript
div {  resize: horizontal;  overflow: auto;}
```

### CSS Resize - Only Height

The following example lets the user resize only the height of a <div> element:

```javascript
div {  resize: vertical;  overflow: auto;}
```

### CSS Resize - Both Width and Height

The following example lets the user resize both the width and height of a <div> element:

```javascript
div {  resize: both;  overflow: auto;}
```

### CSS Disable Resize in Textarea

A <textarea> is often resizable by default.

Here, we have used the `resize` property to disable the resizability in <textarea>:

```javascript
textarea {  resize: none;}
```

* * *

* * *

## CSS Outline Offset

The `[outline-offset](https://www.w3schools.com/cssref/pr_outline-offset.php)` property adds a space between an outline and the edge/border of an element. The space between an element and its outline is transparent.

The following example specifies an outline 15px outside the border edge:

This paragraph has a black border and a red outline 15px outside the border edge.

**Note:** Outline differs from borders! Unlike border, the outline is drawn outside the element's border, and may overlap other content. Also, the outline is NOT a part of the element's dimensions; the element's total width and height is not affected by the width of the outline.

The following example uses the `outline-offset` property to add space between the border and the outline:

```javascript
div.ex1 {  margin: 20px;  border: 1px solid black;  outline: 4px solid red;  outline-offset: 15px;}div.ex2 {  margin: 10px;  border: 1px solid black;  outline: 5px dashed blue;  outline-offset: 5px;}
```

* * *

* * *

## CSS User Interface Properties

The following table lists all the user interface properties:

Property

Description

[outline-offset](https://www.w3schools.com/cssref/css3_pr_outline-offset.php)

Adds space between an outline and the edge or border of an element

[resize](https://www.w3schools.com/cssref/css3_pr_resize.php)

Specifies whether or not an element is resizable by the user