# CSS Combinators

* * *

## CSS Combinators

A combinator is something that defines the relationship between two or more selectors.

A CSS selector can contain more than one selector. Between the selectors, we can include a combinator, to create a more specific selection.

There are four different combinators in CSS:

*   Descendant combinator (space)
*   Child combinator (>)
*   Next sibling combinator (+)
*   Subsequent-sibling combinator (~)

* * *

## Descendant Combinator (space)

The [descendant combinator](https://www.w3schools.com/cssref/sel_element_element.php) matches all elements that are descendants (children, grandchildren, etc.) of a specified element.

The following example selects all <p> elements inside <div> elements: 

```javascript
div p {  background-color: yellow;}
```

* * *

## Child Combinator (>)

The [child combinator](https://www.w3schools.com/cssref/sel_element_gt.php) selects all elements that are direct children of a specified element.

The following example selects all <p> elements that are direct children of <div>:

```javascript
div > p {  background-color: yellow;}
```

* * *

* * *

## Next Sibling Combinator (+)

The [next sibling combinator](https://www.w3schools.com/cssref/sel_element_pluss.php) is used to select an element that is directly after a specific element.

Sibling elements must have the same parent element.

The following example selects the first <p> element that immediately follows a <div>, and share the same parent:

```javascript
div + p {  background-color: yellow;}
```

* * *

## Subsequent-sibling Combinator (~)

The [subsequent-sibling combinator](https://www.w3schools.com/cssref/sel_gen_sibling.php) selects all elements that are next siblings of a specified element.

The following example selects all <p> elements that are next siblings of <div>, and share the same parent: 

```javascript
div ~ p {  background-color: yellow;}
```

* * *

* * *

## CSS Combinators Reference

For a complete list of all CSS combinators, visit our [CSS Combinators Reference](https://www.w3schools.com/cssref/css_ref_combinators.php).