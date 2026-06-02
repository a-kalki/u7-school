# How TO - Center a List

* * *

Learn how to center a list with CSS.

* * *

## Centered List

*   Coffee
*   Tea
*   Coca Cola

* * *

## Center an HTML List

##### Step 1) HTML:

Wrap the `<ul>` element inside a container element, like `<div>`:

```javascript
<div class="container">  <ul class="myUL">    <li>Coffee</li>    <li>Tea</li>    <li>Coca Cola</li>  </ul></div>
```

* * *

##### Step 2) Add CSS:

Center-align the `<div>` element, and change the display of `<ul>` to `inline-block`.

Optionally, you can left-align the list items for a more tidy view:

```javascript
div.container {  text-align: center;}ul.myUL {  display: inline-block;  text-align: left;}
```

* * *

**Tip:** Go to our [CSS Align Tutorial](https://www.w3schools.com/css/css_align.asp) to learn more about aligning elements.

* * *

* * *