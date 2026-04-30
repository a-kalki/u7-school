# CSS Performance Optimization

* * *

## Optimizing CSS

Optimizing CSS makes your website load faster and run more smoothly; which also results in a better user experience.

Here are some tips for optimizing CSS:

### 1\. Use Simple Selectors

Use simple selectors when possible. Complex selectors increase the parsing time.

```javascript
body #navlist ul li a.button:hover {  background-color: blue;}
```
```javascript
.button:hover {  background-color: blue;}
```

* * *

### 2\. Avoid Universal Selector for Styling

Avoid the universal selector (\*) when not strictly necessary. The universal selector (\*) affects every element and can slow down page rendering.

```javascript
* {  margin: 0;  padding: 0;  font-size: 16px;}
```

* * *

### 3\. Avoid Inline Styles

Avoid inline styles when not necessary. Inline styles make your HTML heavier and are harder to manage.

```javascript
<div style="color: red; font-size: 18px;">Hello</div><p style="color: blue; font-size: 16px;">Test</p>
```

* * *

* * *

### 4\. Avoid @import

Avoid using `[@import](https://www.w3schools.com/cssref/atrule_import.php)` for loading external CSS, as it delays stylesheet loading.

Add external CSS with the `<link>` tag in the head section, so it loads before the page is rendered.

```javascript
<link rel="stylesheet" href="style.css">
```

* * *

### 5\. Use Shorthand Properties

Use shorthand properties when possible. It saves space and is faster to parse.

```javascript
/* Long version */margin-top: 10px;margin-right: 20px;margin-bottom: 10px;margin-left: 20px;/* Shorthand version */margin: 10px 20px;
```

* * *

### 6\. Cut Down Unnecessary Animations

A high number of animations and large animations require more processing power to handle, which degrades performance. So, remove unnecessary animations.

* * *

### 7\. Use Properties that Not Cause Repaint of Animations

Animation performance relies also on what properties you are animating.

Some properties (like width, height, left, top), trigger a layout recalculation when animated, and should be avoided.

If possible, use animation properties that do not cause repaint, like transforms, opacity and filter.

* * *

### 8\. Combine and Minify CSS

Use one CSS file when possible, and remove spaces and comments to reduce file size.

You can use tools like:

*   CSS Minifier
*   PostCSS
*   Online compressors

* * *

### 9\. Cache Your CSS

Make sure your CSS file is cached by the browser by giving it a long expiration time in your server settings. This reduces how often users need to re-load it.

* * *

## Summary

*   Keep selectors short and simple
*   Avoid layout-thrashing operations
*   Use efficient animation techniques
*   Use external, minified, and cached stylesheets