# How TO - Custom Scrollbar

* * *

Learn how to create a custom scrollbar with CSS.

* * *

## Custom Scrollbars

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_custom_scrollbar)

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_custom_scrollbar2)

**Note:** Custom scrollbars are not supported in Firefox or in Edge, prior version 79.

* * *

## How To Create Custom Scrollbars

Chrome, Edge, Safari and Opera support the non-standard `::-webkit-scrollbar` pseudo element, which allows us to modify the look of the browser's scrollbar.

The following example creates a thin (10px wide) scrollbar, which has a grey track/bar color and a dark-grey (#888) handle:

```javascript
/* width */::-webkit-scrollbar {  width: 10px;}/* Track */::-webkit-scrollbar-track {  background: #f1f1f1;}/* Handle */::-webkit-scrollbar-thumb {  background: #888;}/* Handle on hover */::-webkit-scrollbar-thumb:hover {  background: #555;}
```

This example creates a scrollbar with box shadow:

```javascript
/* width */::-webkit-scrollbar {  width: 20px;}/* Track */::-webkit-scrollbar-track {  box-shadow: inset 0 0 5px grey;  border-radius: 10px;}/* Handle */::-webkit-scrollbar-thumb {  background: red;  border-radius: 10px;}
```

* * *

## Scrollbar Selectors

For webkit browsers, you can use the following pseudo elements to customize the browser's scrollbar:

*   `::-webkit-scrollbar` the scrollbar.
*   `::-webkit-scrollbar-button` the buttons on the scrollbar (arrows pointing upwards and downwards).
*   `::-webkit-scrollbar-thumb` the draggable scrolling handle.
*   `::-webkit-scrollbar-track` the track (progress bar) of the scrollbar.
*   `::-webkit-scrollbar-track-piece` the track (progress bar) NOT covered by the handle.
*   `::-webkit-scrollbar-corner` the bottom corner of the scrollbar, where both horizontal and vertical scrollbars meet.
*   `::-webkit-resizer` the draggable resizing handle that appears at the bottom corner of some elements.

* * *

* * *