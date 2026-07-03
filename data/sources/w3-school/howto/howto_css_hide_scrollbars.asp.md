# How TO - Hide Scrollbar

* * *

Learn how to hide scrollbars with CSS.

* * *

## How To Hide Scrollbars

Add `overflow: hidden;` to hide both the horizontal and vertical scrollbar.

```javascript
body {  overflow: hidden; /* Hide scrollbars */}
```

To only hide the vertical scrollbar, or only the horizontal scrollbar, use `overflow-y` or `overflow-x`:

```javascript
body {  overflow-y: hidden; /* Hide vertical scrollbar */  overflow-x: hidden; /* Hide horizontal scrollbar */}
```

Note that `overflow: hidden` will also remove the functionality of the scrollbar. It is not possible to scroll inside the page.

**Tip:** To learn more about the `overflow` property, go to our [CSS Overflow Tutorial](https://www.w3schools.com/css/css_overflow.asp) or [CSS overflow Property Reference](https://www.w3schools.com/cssref/pr_pos_overflow.asp).

* * *

* * *

## Hide Scrollbars But Keep Functionality

To hide the scrollbars, but still be able to keep scrolling, you can use the following code:

```javascript
/* Hide scrollbar for Chrome, Safari and Opera */.example::-webkit-scrollbar {  display: none;}/* Hide scrollbar for IE, Edge and Firefox */.example {  -ms-overflow-style: none;  /* IE and Edge */  scrollbar-width: none;  /* Firefox */}
```

Webkit browsers, such as Chrome, Safari and Opera, supports the non-standard `::-webkit-scrollbar` pseudo element, which allows us to modify the look of the browser's scrollbar. IE and Edge supports the `-ms-overflow-style:` property, and Firefox supports the `scrollbar-width` property, which allows us to hide the scrollbar, but keep functionality.