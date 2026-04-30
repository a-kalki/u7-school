# How TO - Responsive Floats

* * *

Learn how to create responsive floating elements with CSS.

* * *

## Responsive floats

Use media queries and set the specified screen width (in pixels) for when the element should float:

```javascript
/* Float to the right on screens that are equal to or less than 768px wide */@media (max-width: 768px) {  .float-right-sm {    float: right;  }}/* Float to the right on screens that are equal to or greater than 769px wide */@media (min-width: 769px) {  .float-right-lg {    float: right;  }}
```

**Tip:** Learn more about floats in our [CSS Float](https://www.w3schools.com/css/css_float.asp) Tutorial.

* * *

* * *