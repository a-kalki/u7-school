# How TO - Change Placeholder Color

* * *

Learn how to change the color of the placeholder attribute with CSS.

* * *

## Placeholder Color

 [Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_placeholder)

* * *

##### Step 1) Add HTML:

Use an input element and add the placeholder attribute:

```javascript
<input type="text" placeholder="A red placeholder text..">
```

##### Step 2) Add CSS:

In most browsers, the placeholder text is grey. To change this, style the placeholder with the `::placeholder` selector. Note that Firefox adds a lower opacity to the placeholder, so we use `opacity: 1` to fix this.

```javascript
::placeholder {  color: red;  opacity: 1; /* Firefox */}::-ms-input-placeholder { /* Edge 12 -18 */  color: red;}
```

**Tip:** Read more about the ::placeholder selector in our CSS Reference: [CSS ::placeholder selector](https://www.w3schools.com/cssref/sel_placeholder.asp).

* * *

* * *