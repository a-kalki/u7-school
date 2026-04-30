# How TO - Display an Element on Hover

* * *

Learn how to display an element on hover.

* * *

Hover over me.

I am shown when someone hovers over the div above.

* * *

## How To Display an Element on Hover

##### Step 1) Add HTML:

```javascript
<div class="myDIV">Hover over me.</div><div class="hide">I am shown when someone hovers over the div above.</div>
```

* * *

##### Step 2) Add CSS:

```javascript
.hide {  display: none;}.myDIV:hover + .hide {  display: block;  color: red;}
```

### Example Explained

The adjacent sibling selector (`+`) selects all elements that are the adjacent siblings of a specified element.

The word "adjacent" means "immediately following", and the example above selects all elements with `class=".hide"`, that are placed immediately after elements with `class=".myDIV`", on hover.

Go to our [CSS Combinators Tutorial](https://www.w3schools.com/css/css_combinators.asp) to learn more about adjacent selectors.

* * *

* * *