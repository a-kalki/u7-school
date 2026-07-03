# CSS Text Effects

* * *

## CSS Text Effects

CSS has some properties to handle text overflow, word wrapping, line breaking rules and writing modes.

In this chapter you will learn about the following properties:

*   `[text-overflow](https://www.w3schools.com/cssref/css3_pr_text-overflow.php)` - Specifies how to handle overflowed content
*   `[word-wrap](https://www.w3schools.com/cssref/css3_pr_word-wrap.php)` - Allows long words to be able to be broken and wrap onto the next line
*   `[word-break](https://www.w3schools.com/cssref/css3_pr_word-break.php)` - Specifies line breaking rules
*   `[writing-mode](https://www.w3schools.com/cssref/css3_pr_writing-mode.php)` - Specifies whether lines of text are laid out horizontally or vertically

* * *

## CSS text-overflow Property

The CSS `[text-overflow](https://www.w3schools.com/cssref/css3_pr_text-overflow.php)` property specifies how overflowed content that is not displayed should be signaled to the user. It can be clipped or rendered with ellipsis (...).

Both of the following properties are required for `text-overflow` to take effect:

*   `[white-space: nowrap;](https://www.w3schools.com/cssref/pr_text_white-space.php)`
*   `[overflow: hidden;](https://www.w3schools.com/cssref/pr_pos_overflow.php)`

Here, the overflowed content is clipped:

This is some long text that will not fit in the box

Here, the overflowed content is rendered with ellipsis (...):

This is some long text that will not fit in the box

The CSS code is as follows:

```javascript
p.test1 {  width: 200px;  border: 1px solid #000000;  white-space: nowrap;  overflow: hidden;  text-overflow: clip;}p.test2 {  width: 200px;  border: 1px solid #000000;  white-space: nowrap;  overflow: hidden;  text-overflow: ellipsis;}
```

The following example shows how you can display the overflowed content when hovering over the element:

```javascript
p:hover {  overflow: visible;}
```

* * *

* * *

## CSS word-wrap Property

The CSS `[word-wrap](https://www.w3schools.com/cssref/css3_pr_word-wrap.php)` property allows long words to be able to be broken and wrap onto the next line. 

If a word is too long to fit within an area, it expands outside:

This paragraph contains a very long word: thisisaveryveryveryveryveryverylongword. The long word will break and wrap to the next line.

The `[word-wrap](https://www.w3schools.com/cssref/css3_pr_word-wrap.php)` property allows you to force the text to wrap - even if it means splitting it in the middle of a word:

This paragraph contains a very long word: thisisaveryveryveryveryveryverylongword. The long word will break and wrap to the next line.

The CSS code is as follows:

```javascript
p {  word-wrap: break-word;}
```

* * *

## CSS word-break Property

The CSS `[word-break](https://www.w3schools.com/cssref/css3_pr_word-break.php)` property specifies how words should break when reaching the end of a line.

This property can take one of the following values:

*   `normal` - This is default. Uses the default line breaking rules of the language
*   `break-all` - Allows words to be broken at any character to prevent overflow
*   `keep-all` - Prevents words from breaking

Here, we use `normal`:

This paragraph contains some text. This line will-break-at-hyphens.

Here, we use `break-all`:

This paragraph contains some text. The lines will break at any character.

The CSS code is as follows:

```javascript
p.test1 {  word-break: normal;}p.test2 {  word-break: break-all;}
```

* * *

## CSS writing-mode Property

The CSS `[writing-mode](https://www.w3schools.com/cssref/css3_pr_writing-mode.php)` property specifies whether lines of text are laid out horizontally or vertically.

This property can take one of the following values:

*   `horizontal-tb` - Default. The text flows horizontally from left to right, vertically from top to bottom
*   `vertical-rl` - The text flows vertically from top to bottom, horizontally from right to left
*   `vertical-lr` - The text flows vertically from top to bottom, horizontally from left to right

Here is a text with a span element with a vertical-rl writing-mode.

The following example shows some different writing modes:

```javascript
p.test1 {  writing-mode: horizontal-tb;}span {  writing-mode: vertical-rl;}p.test2 {  writing-mode: vertical-rl;}
```

* * *

* * *

## CSS Text Effect Properties

The following table lists the CSS text effect properties:

Property

Description

[text-justify](https://www.w3schools.com/cssref/css3_pr_text-justify.php)

Specifies how justified text should be aligned and spaced

[text-overflow](https://www.w3schools.com/cssref/css3_pr_text-overflow.php)

Specifies how overflowed content that is not displayed should be signaled to the user

[word-break](https://www.w3schools.com/cssref/css3_pr_word-break.php)

Specifies line breaking rules for non-CJK scripts

[word-wrap](https://www.w3schools.com/cssref/css3_pr_word-wrap.php)

Allows long words to be able to be broken and wrap onto the next line

[writing-mode](https://www.w3schools.com/cssref/css3_pr_writing-mode.php)

Specifies whether lines of text are laid out horizontally or vertically