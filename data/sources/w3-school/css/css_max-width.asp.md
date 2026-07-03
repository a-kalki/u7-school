# CSS The max-width Property

* * *

## The CSS max-width Property

The `[max-width](https://www.w3schools.com/cssref/pr_dim_max-width.php)` property defines the maximum width of an element.

This property prevents the element's width from being larger than the specified value (it can be smaller, but not larger).

This property is useful for creating responsive layouts and to ensure content readability across various screen sizes.

### Problem with width:

Here we have a horizontally centered <div> element with a specific `[width](https://www.w3schools.com/cssref/pr_dim_width.php)` (600px):

This <div> element has a width of 600px, and margin set to auto. This <div> element has a width of 600px, and margin set to auto.

  

What happens to the <div> above if the browser window is smaller than the width of the element? Some of the content will not show, and the browser might add a horizontal scrollbar to the page.

### Using max-width instead:

Now, we use the `[max-width](https://www.w3schools.com/cssref/pr_dim_max-width.php)` property instead. This will improve the browser's handling of small windows:

This <div> element has a max-width of 600px, and margin set to auto. This <div> element has a max-width of 600px, and margin set to auto.

  

**Tip:** Resize the browser window to less than 600px wide, to see the difference between the two <div>s!

Here is the CSS code for the two <div>s above:

```javascript
div.ex1 {  width: 500px;  margin: auto;  border: 3px solid #73AD21;}div.ex2 {  max-width: 500px;  margin: auto;  border: 3px solid #73AD21;}
```

* * *

* * *

* * *

## CSS Properties

Property

Description

[max-width](https://www.w3schools.com/cssref/pr_dim_max-width.php)

Defines the maximum width of an element

[width](https://www.w3schools.com/cssref/pr_dim_width.php)

Sets the width of an element