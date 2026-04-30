# How TO - Remove Contenteditable Border

* * *

Learn how to remove the border from an editable element.

* * *

## Remove Contenteditable Border

By default, when you write inside an element that has `contenteditable` set to `true`, that element gets a border around on focus. However, you can use CSS to remove the border:

##### Step 1) Add HTML:

```javascript
<p contenteditable="true">This is an editable paragraph.</p>
```

##### Step 2) Add CSS:

Use the `[_attribute_]` selector to select all elements that are contenteditable, and remove the border with the `outline` property:

```javascript
[contenteditable] {  outline: 0px solid transparent;}
```

**Tip:** Go to our [HTML contenteditable Attribute Reference](https://www.w3schools.com/tags/att_global_contenteditable.asp) to learn more about the global contenteditable attribute.

**Tip:** Go to our [CSS \[_attribute_\] Selector](https://www.w3schools.com/cssref/sel_attribute.asp) to learn more about the \[_attribute_\] selector.

* * *

* * *