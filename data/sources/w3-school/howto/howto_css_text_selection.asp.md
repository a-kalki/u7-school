# How TO - Change Text Selection Color

* * *

Learn how to override the default text selection color with CSS.

* * *

## Text Selection Color

Select the following text:

Default text selection color

Custom text selection color

* * *

## How To Change Text Selection Color

Use the `::selection` selector to override the default text selection color:

```javascript
::-moz-selection { /* Code for Firefox */  color: red;  background: yellow;}::selection {  color: red;  background: yellow;}
```

**Tip:** Read more about the ::selection selector in our CSS Reference: [CSS ::selection Property](https://www.w3schools.com/cssref/sel_selection.asp).

* * *

* * *