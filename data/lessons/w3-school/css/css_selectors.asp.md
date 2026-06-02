# CSS Selectors

* * *

## CSS Selectors

CSS selectors are used to "find" (or select) the HTML elements you want to style.

We can divide CSS selectors into five categories:

*   Simple selectors (select elements based on name, id, class)
*   [Combinator selectors](css_combinators.asp.html) (select elements based on a specific relationship between them)
*   [Pseudo-class selectors](css_pseudo_classes.asp.html) (select elements based on a certain state)
*   [Pseudo-elements selectors](css_pseudo_elements.asp.html) (select and style a part of an element)
*   [Attribute selectors](css_attribute_selectors.asp.html) (select elements based on an attribute or attribute value)

This page will explain the most basic CSS selectors.

* * *

## The CSS element Selector

The `[element](https://www.w3schools.com/cssref/sel_element.php)` selector selects HTML elements based on the element name.

```javascript
p {  text-align: center;  color: red;}
```

* * *

## The CSS id Selector

The `[id](https://www.w3schools.com/cssref/sel_id.php)` selector uses the id attribute of an HTML element to select a specific element.

The id of an element is unique within a page, so the id selector is used to select one unique element!

To select an element with a specific id, write a hash (#) character, followed by the id of the element.

```javascript
#para1 {  text-align: center;  color: red;}
```

**Note:** An id name cannot start with a number!

* * *

* * *

## The CSS class Selector

The `[class](https://www.w3schools.com/cssref/sel_class.php)` selector selects HTML elements with a specific class attribute.

To select elements with a specific class, write a period (.) character, followed by the class name.

```javascript
.center {  text-align: center;  color: red;}
```

You can also specify that only specific HTML elements should be affected by a class.

```javascript
p.center {  text-align: center;  color: red;}
```

HTML elements can also refer to more than one class.

```javascript
<p class="center large">This paragraph refers to two classes.</p>
```

**Note:** A class name cannot start with a number!

* * *

* * *