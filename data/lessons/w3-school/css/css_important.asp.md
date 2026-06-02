# CSS The !important Rule

* * *

## CSS !important Rule

The `!important` rule is used to give the value of a specific property the highest priority.

The `!important` rule will override ALL previous styling rules for that specific property on that element!

The `!important` keyword is added to the end of a CSS declaration, before the semicolon.

### Syntax

selector {  
  property: value !important;  
}

* * *

## CSS !important Rule Example

In the following example, all three paragraphs will get a yellow background color, even though the inline style, id selector, and the class selector have a higher [specificity](css_specificity.asp.html). The `!important` rule overrides ALL styling rules for that specific property on that element!

```javascript
<html><head><style>p {  background-color: yellow !important;}#myid {  background-color: blue;}.myclass {  background-color: gray;}</style></head><body><p style="background-color:orange;">This is a paragraph.</p><p class="myclass">This is a paragraph.</p><p id="myid">This is a paragraph.</p></body></html>
```

* * *

* * *

## Use !important Sparingly

The only way to override an `!important` rule is to include another `!important` rule on a declaration with the same (or higher) specificity in the source code - and here the problem starts!

The CSS code will be confusing and the debugging will be hard! Especially if you have a large style sheet!

In the following example, it is not very clear which color is considered most important:

```javascript
p {  background-color: red !important;}#myid {  background-color: blue !important;}.myclass {  background-color: gray !important;}
```

* * *

## A Few Fair Uses of !important

The `!important` rule can be useful in some cases, like:

**1\. To override a style that cannot be overridden in any other way.** This could be if you are working in a Content Management System (CMS) and cannot edit the CSS code. Then you can set some custom styles to override some of the CMS styles.

**2\. To respect user preferences.** Some users have motion sensitivity and prefer websites with less animation. CSS has a `[@media](https://www.w3schools.com/cssref/atrule_media.php)` feature called `prefers-reduced-motion` that lets you check if a user has asked to reduce motion, such as animations or transitions. You can use `!important` to turn off, or tone down animations and transitions for the users who has activated this setting on their computer:

```javascript
@media (prefers-reduced-motion: reduce) {  * {    animation: none !important;    transition: none !important;  }}
```

You will learn more about [media queries](css3_mediaqueries.asp.html) in a later chapter.

**3\. To create a highly specific, unchangeable style for a specific element.** Assume we want a special look for all link buttons on a page:

```javascript
a.button {  background-color: #8c8c8c;  color: white;  padding: 5px;  border: 1px solid black;  text-decoration: none;}
```

Now, if we put a link button inside another element with higher specificity, the properties might get in conflict. Here is an example of this:

```javascript
a.button {  background-color: #8c8c8c;  color: white;  padding: 5px;  border: 1px solid black;  text-decoration: none;}#myDiv a {  color: red;  background-color: yellow;}
```

To "force" all buttons to have the same look, no matter what, we can add the `!important` rule to the properties of the button, like this:

```javascript
a.button {  background-color: #8c8c8c !important;  color: white !important;  padding: 5px !important;  border: 1px solid black !important;  text-decoration: none !important;}#myDiv a {  color: red;  background-color: yellow;}
```

* * *

* * *