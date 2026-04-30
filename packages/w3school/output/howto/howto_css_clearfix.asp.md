# How TO - Clear Floats (Clearfix)

* * *

Learn how to clear floats with the "clearfix" hack.

* * *

## How To Clear Floats (Clearfix)

Elements after a floating element will flow around it. Use the "clearfix" hack to fix the problem:

### Without Clearfix

![](clearfix_prob.jpg)

### With Clearfix

![](clearfix_solution.jpg)

* * *

## The clearfix Hack

If an element is taller than the element containing it, and it is floated, it will overflow outside of its container.

Then we can add `overflow: auto;` to the containing element to fix this problem:

```javascript
.clearfix {  overflow: auto;}
```

The overflow:auto clearfix works well as long as you are able to keep control of your margins and padding (else you might see scrollbars). The **new, modern clearfix hack** however, is safer to use, and the following code is used for most webpages:

```javascript
.clearfix::after {  content: "";  clear: both;  display: table;}
```

**Tip:** Learn more about floats in our [CSS Float](https://www.w3schools.com/css/css_float.asp) Tutorial.

* * *

* * *