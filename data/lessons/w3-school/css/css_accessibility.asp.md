# CSS Accessibility Styling

* * *

## CSS Accessibility Styling

A website should be designed to ensure good accessibility for all users, including those with disabilities.

CSS accessibility styling is about using good styling technics to improve the visual clarity, navigation, and overall user experience. 

* * *

## CSS Accessibility Styling Technics

Here are some tips and technics on how to improve the accessibility of your web site:

### 1\. Provide High Color Contrast

Always use a good color contrast between the text and the background for readability. This is especially important for users with visual impairments or color blindness.

```javascript
body {  background-color: #ffffff;  color: #000000;}
```
```javascript
body {  background-color: #eeeeee;  color: #cccccc;}
```

* * *

### 2\. Provide Good Font, Font Size and Line Height

Always provide a font that is easily readable. In addition, use a proper font size and line height. Use relative units (like `rem`) for `font-size`, to allow the user to scale the text size in the browser settings.

```javascript
body {  font-family: Arial, sans-serif;  font-size: 1rem;  line-height: 1.6;}
```
```javascript
body {  font-family: Georgia, serif;  font-size: 12px;  font-style: italic;  font-variant: small-caps;  line-height: 90%;}
```

* * *

### 3\. Have Visible Focus Indicators

Always use the `[:focus](https://www.w3schools.com/cssref/sel_focus.php)` pseudo-class to ensure that interactive elements (like links, buttons, input fields) have a clear visual focus style.

Using `:focus` will ensure that keyboard users and screen-readers understand which element is currently active.

```javascript
a:focus, button:focus, input:focus {  outline: 2px solid orange;}
```

* * *

* * *

### 4\. Avoid Hiding Focus

Never remove the default focus outlines, without replacing them with another visible focus style.

```javascript
button:focus {  outline: none;}
```
```javascript
button:focus {  outline: 2px solid orange;}
```

* * *

### 5\. Use CSS + Semantic HTML

Use CSS for visual styling, and structure content with semantic HTML elements (instead of non-semantic elements, like `<div>` for everything).

```javascript
nav {  background-color: #333333;  color: white;}aside {  background-color: #333333;  color: white;}
```

* * *

### 6\. Respect User Preferences

The CSS `prefers-reduced-motion` `[@media](https://www.w3schools.com/cssref/atrule_media.php)` feature lets you check if a user has asked to reduce motion, such as animations or transitions.

Some users have motion sensitivity and prefer websites with less animation. You can use this media query to turn off, or tone down animations and transitions for the users who has activated this setting on their computer:

```javascript
@media (prefers-reduced-motion: reduce) {  * {    animation: none !important;    transition: none !important;  }}
```

You will learn more about [media queries](css3_mediaqueries.asp.html) in a later chapter.

* * *

## Summary

*   Provide high color contrast
*   Provide easily readable fonts
*   Keep focus outlines visible
*   Use semantic HTML elements
*   Respect user preferences