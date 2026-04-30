# CSS Counters

* * *

## CSS Counters

With CSS counters, you can create dynamic numbering of elements (like headings, sections, or list items) without using JavaScript.

CSS counters are "variables" maintained by CSS, and their values can be incremented (or decremented) by CSS rules.

### Pizza

### Hamburger

### Hotdogs

* * *

## CSS Automatic Numbering With Counters

CSS counters are like "variables". The variable values can be incremented (or decremented) by CSS rules.

To work with CSS counters we will use the following properties:

*   `[counter-reset](https://www.w3schools.com/cssref/pr_gen_counter-reset.php)` - Creates or resets a counter
*   `[counter-increment](https://www.w3schools.com/cssref/pr_gen_counter-increment.php)` - Increments or decrements a counter
*   `[content](https://www.w3schools.com/cssref/pr_gen_content.php)` - Inserts generated content
*   `[counter()](https://www.w3schools.com/cssref/func_counter.php)` - Adds the value of a counter to an element

To use a CSS counter, it must first be created with the `[counter-reset](https://www.w3schools.com/cssref/pr_gen_counter-reset.php)` property.

* * *

## CSS Increase and Decrease Counter

The following example creates a counter for the page (in the body selector), then it increments the counter value by 1 for each <h2> element:

```javascript
body {  counter-reset: section;}h2::before {  counter-increment: section;  content: "Section " counter(section) ": ";}
```

* * *

## Decrementing a Counter

The `[counter-increment](https://www.w3schools.com/cssref/pr_gen_counter-increment.php)` property has a second parameter. The default value is 1. To decrease the counter value, you can set it to -1.

```javascript
body {  counter-reset: section;}h2::before {  counter-increment: section -1;  content: "Section " counter(section) ": ";}
```

* * *

* * *

## Incrementing by Custom Values

You can increment the counter by any value. Here we increment by 2:

```javascript
body {  counter-reset: section;}h2::before {  counter-increment: section 2;  content: "Section " counter(section) ": ";}
```

* * *

* * *