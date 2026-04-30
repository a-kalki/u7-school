# CSS Links

* * *

## CSS Styling Links

HTML links can be styled with many CSS properties, like `[color](https://www.w3schools.com/cssref/pr_text_color.php)`, `[text-decoration](https://www.w3schools.com/cssref/pr_text_text-decoration.php)`, `[background-color](https://www.w3schools.com/cssref/pr_background-color.php)`, `[font-size](https://www.w3schools.com/cssref/pr_font_font-size.php)`, `[font-weight](https://www.w3schools.com/cssref/pr_font_weight.php)`, `[font-family](https://www.w3schools.com/cssref/pr_font_font-family.php)`, etc.).

```javascript
a {  color: hotpink;  background-color: yellow;  font-weight: bold;}
```

* * *

## Styling Links Depending on State

In addition, links can be styled differently depending on what **state** they are in.

The four link states are:

*   `[:link](https://www.w3schools.com/cssref/sel_link.php)` - a normal, unvisited link
*   `[:visited](https://www.w3schools.com/cssref/sel_visited.php)` - a link the user has visited
*   `[:hover](https://www.w3schools.com/cssref/sel_hover.php)` - a link when the user mouses over it
*   `[:active](https://www.w3schools.com/cssref/sel_active.php)` - a link the moment it is clicked

When setting the style for link states, there are some order rules:

*   :hover must come after :link and :visited
*   :active must come after :hover

```javascript
/* unvisited link */a:link {  color: red;}/* visited link */a:visited {  color: green;}/* mouse over link */a:hover {  color: hotpink;}/* selected link */a:active {  color: blue;}
```

* * *

* * *

## CSS Links - Text Decoration

The `[text-decoration](https://www.w3schools.com/cssref/pr_text_text-decoration.php)` property is mostly used to remove underlines from links:

```javascript
a:link {  text-decoration: none;}a:visited {  text-decoration: none;}a:hover {  text-decoration: underline;}a:active {  text-decoration: underline;}
```

* * *

## CSS Links - Background Color

The `[background-color](https://www.w3schools.com/cssref/pr_background-color.php)` property can be used to specify a background color for links:

```javascript
a:link {  background-color: yellow;}a:visited {  background-color: cyan;}a:hover {  background-color: lightgreen;}a:active {  background-color: hotpink;}
```

* * *

## More Examples

```javascript
a.one:link {color:red;}a.one:visited {color:blue;}a.one:hover {color:orange;}a.two:link {color:red;}a.two:visited {color:blue;}a.two:hover {font-size:150%;}a.three:link {color:red;}a.three:visited {color:blue;}a.three:hover {background:lightgreen;}a.four:link {color:red;}a.four:visited {color:blue;}a.four:hover {font-family:monospace;}a.five:link {color:red;text-decoration:none;}a.five:visited {color:blue;text-decoration:none;}a.five:hover {text-decoration:underline;}
```
```javascript
<span style="cursor: auto">auto</span><br><span style="cursor: crosshair">crosshair</span><br><span style="cursor: default">default</span><br><span style="cursor: e-resize">e-resize</span><br><span style="cursor: help">help</span><br><span style="cursor: move">move</span><br><span style="cursor: n-resize">n-resize</span><br><span style="cursor: ne-resize">ne-resize</span><br><span style="cursor: nw-resize">nw-resize</span><br><span style="cursor: pointer">pointer</span><br><span style="cursor: progress">progress</span><br><span style="cursor: s-resize">s-resize</span><br><span style="cursor: se-resize">se-resize</span><br><span style="cursor: sw-resize">sw-resize</span><br><span style="cursor: text">text</span><br><span style="cursor: w-resize">w-resize</span><br><span style="cursor: wait">wait</span>
```

* * *

* * *