# HTML Div Element

* * *

The `<div>` element is used as a container for other HTML elements.

* * *

## The <div> Element

The `<div>` element is by default a block element, meaning that it takes all available width, and comes with line breaks before and after.

```javascript
Lorem Ipsum <div>I am a div</div> dolor sit amet.
```

The `<div>` element has no required attributes, but `style`, `class` and `id` are common.

* * *

## <div> as a container

The `<div>` element is often used to group sections of a web page together.

```javascript
<div>  <h2>London</h2>  <p>London is the capital city of England.</p>  <p>London has over 9 million inhabitants.</p></div>
```

* * *

* * *

## Center align a <div> element

If you have a `<div>` element that is not 100% wide, and you want to center-align it, set the CSS `margin` property to `auto`.

```javascript
<style>div {  width:300px;  margin:auto;}</style>
```

* * *

## Multiple <div> elements

You can have many `<div>` containers on the same page.

```javascript
<div>  <h2>London</h2>  <p>London is the capital city of England.</p>  <p>London has over 9 million inhabitants.</p></div><div>  <h2>Oslo</h2>  <p>Oslo is the capital city of Norway.</p>  <p>Oslo has over 700,000 inhabitants.</p></div><div>  <h2>Rome</h2>  <p>Rome is the capital city of Italy.</p>  <p>Rome has over 4 million inhabitants.</p></div>
```

* * *

## Aligning <div> elements side by side

When building web pages, you often want to have two or more `<div>` elements side by side, like this:

## London

London is the capital city of England.

London has over 9 million inhabitants.

## Oslo

Oslo is the capital city of Norway.

Oslo has over 700,000 inhabitants.

## Rome

Rome is the capital city of Italy.

Rome has over 4 million inhabitants.

There are different methods for aligning elements side by side, all include some CSS styling. We will look at the most common methods:

* * *

## Float

The CSS `float` property was not originally meant to align `<div>` elements side-by-side, but has been used for this purpose for many years.

The CSS `float` property is used for positioning and formatting content and allows elements to be positioned horizontally, rather than vertically.

```javascript
<style>.mycontainer {  width:100%;  overflow:auto;}.mycontainer div {  width:33%;  float:left;}</style>
```

Learn more about float in our [CSS float tutorial](../css/css_float.asp.html).

* * *

## Inline-block

If you change the `<div>` element's `display` property from `block` to `inline-block`, the `<div>` elements will no longer add a line break before and after, and will be displayed side by side instead of on top of each other.

```javascript
<style>div {  width: 30%;  display: inline-block;}</style>
```

* * *

## Flex

The CSS Flexbox Layout Module was introduced to make it easier to design flexible responsive layout structure without using float or positioning.

To make the CSS flex method work, surround the `<div>` elements with another `<div>` element and give it the status as a flex container.

```javascript
<style>.mycontainer {  display: flex;}.mycontainer > div {  width:33%;}</style>
```

Learn more about flex in our [CSS flexbox tutorial](../css/css3_flexbox.asp.html).

* * *

## Grid

The CSS Grid Layout Module offers a grid-based layout system, with rows and columns, making it easier to design web pages without having to use floats and positioning.

Sounds almost the same as flex, but has the ability to define more than one row and position each row individually.

The CSS grid method requires that you surround the `<div>` elements with another `<div>` element and give the status as a grid container, and you must specify the width of each column.

```javascript
<style>.grid-container {  display: grid;  grid-template-columns: 33% 33% 33%;}</style>
```

Learn more about grid in our [CSS grid tutorial](../css/css_grid.asp.html).

* * *

* * *

## HTML Tags

Tag

Description

[<div>](https://www.w3schools.com/tags/tag_div.asp)

Defines a section in a document (block-level)

For a complete list of all available HTML tags, visit our [HTML Tag Reference](https://www.w3schools.com/tags/default.asp).