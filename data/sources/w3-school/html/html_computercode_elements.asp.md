# HTML Computer Code Elements

* * *

HTML contains several elements for defining user input and computer code.

* * *

```javascript
<code>x = 5;y = 6;z = x + y;</code>
```

* * *

## HTML <kbd> For Keyboard Input

The HTML `<kbd>` element is used to define keyboard input. The content inside is displayed in the browser's default monospace font.

```javascript
<p>Save the document by pressing <kbd>Ctrl + S</kbd></p>
```

* * *

## HTML <samp> For Program Output

The HTML `<samp>` element is used to define sample output from a computer program. The content inside is displayed in the browser's default monospace font.

```javascript
<p>Message from my computer:</p><p><samp>File not found.<br>Press F1 to continue</samp></p>
```

* * *

* * *

## HTML <code> For Computer Code

The HTML `<code>` element  is used to define a piece of computer code. The content inside is displayed in the browser's default monospace font.

```javascript
<code>x = 5;y = 6;z = x + y;</code>
```

* * *

## Preserve Line-Breaks

Notice that the `<code>` element does NOT preserve extra whitespace and line-breaks.

To preserve extra whitespace and line-breaks, you can put the `<code>` element inside a `<pre>` element:

```javascript
<pre><code>x = 5;y = 6;z = x + y;</code></pre>
```

* * *

## HTML <var> For Variables

The HTML `<var>` element  is used to define a variable in programming or in a mathematical expression. The content inside is typically displayed in italic.

```javascript
<p>The area of a triangle is: 1/2 x <var>b</var> x <var>h</var>, where <var>b</var> is the base, and <var>h</var> is the vertical height.</p>
```

* * *

## Chapter Summary

*   The `<kbd>` element defines keyboard input
*   The `<samp>` element defines sample output from a computer program
*   The `<code>` element defines a piece of computer code
*   The `<var>` element defines a variable in programming or in a mathematical expression
*   The `<pre>` element defines preformatted text

* * *

* * *

## HTML Computer Code Elements

Tag

Description

[<code>](https://www.w3schools.com/tags/tag_code.asp)

Defines programming code

[<kbd>](https://www.w3schools.com/tags/tag_kbd.asp)

Defines keyboard input 

[<samp>](https://www.w3schools.com/tags/tag_samp.asp)

Defines computer output

[<var>](https://www.w3schools.com/tags/tag_var.asp)

Defines a variable

[<pre>](https://www.w3schools.com/tags/tag_pre.asp)

Defines preformatted text

For a complete list of all available HTML tags, visit our [HTML Tag Reference](https://www.w3schools.com/tags/default.asp).