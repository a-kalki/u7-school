# CSS Specificity

* * *

## CSS Specificity

CSS specificity is an algorithm that determines which style declaration is ultimately applied to an element.

If two or more CSS rules point to the same element, the declaration with the highest specificity will "win", and that style will be applied to the HTML element.

Look at the following examples:

```javascript
<html><head>  <style>    p {color: red;}  </style></head><body><p>Hello World!</p></body></html>
```

Now, look at next example:

```javascript
<html><head>  <style>    .test {color: green;}    p {color: red;}  </style></head><body><p class="test">Hello World!</p></body></html>
```

Now, look at next example:

```javascript
<html><head>  <style>    #demo {color: blue;}    .test {color: green;}    p {color: red;}  </style></head><body><p id="demo" class="test">Hello World!</p></body></html>
```

Now, look at next example:

```javascript
<html><head>  <style>    #demo {color: blue;}    .test {color: green;}    p {color: red;}  </style></head><body><p id="demo" class="test" style="color: pink;">Hello World!</p></body></html>
```

* * *

* * *

* * *