# CSS Tooltip

* * *

## CSS Tooltip

A CSS tooltip is used to specify extra information about something when the user moves the mouse pointer over an element:

Top Tooltip text

Right Tooltip text

Bottom Tooltip text

Left Tooltip text

* * *

## CSS Create a Basic Tooltip

Create a tooltip that appears when the user moves the mouse over an element:

```javascript
<style>/* Tooltip container */.tooltip {  position: relative;  display: inline-block;  border-bottom: 1px dotted black; /* Add dots under the hoverable text */  cursor: pointer;}/* Tooltip text */.tooltiptext {  visibility: hidden; /* Hidden by default */  width: 130px;  background-color: black;  color: #ffffff;  text-align: center;  padding: 5px 0;  border-radius: 6px;  position: absolute;  z-index: 1; /* Ensure tooltip is displayed above content */}/* Show the tooltip text on hover */.tooltip:hover .tooltiptext {  visibility: visible;}</style><div class="tooltip">Hover over me  <span class="tooltiptext">Some tooltip text</span></div>
```

### Example Explained

**HTML:**

*   Use a container element (like <div>) and add the `"tooltip"` class to it. When the user mouse over this <div>, it will show the tooltip text.
*   The tooltip text is placed inside an inline element (like <span>) with `class="tooltiptext"`.

**CSS:**

*   The `tooltip` class use `position:relative`, which is needed to position the tooltip text (`position:absolute`). **Tip:** See examples below on how to position the tooltip.
*   The `tooltiptext` class holds the actual tooltip text. It is hidden by default, and will be visible on hover.
*   The `:hover` selector is used to show the tooltip text when the user moves the mouse over the <div> with `class="tooltip"`.

* * *

* * *

## Positioning the Tooltip

You can position the tooltip as you like. Here we will show how to position the tooltip to the left, right, top and bottom.

### Right- and Left-aligned Tooltip

In this example, the tooltip is placed to the right (`left:105%`) of the "hoverable" text (<div>). Also note that `top:-5px` is used to place it in the middle of its container element. We use the number **5** because the tooltip text has a top and bottom padding of 5px. If you increase its padding, also increase the value of the `top` property to ensure that it stays in the middle (if this is something you want). The same applies if you want the tooltip placed to the left.

```javascript
.tooltiptext {  top: -5px;  left: 105%;}
```
```javascript
.tooltiptext {  top: -5px;  right: 105%;}
```

### Top- and Bottom-aligned Tooltip

If you want the tooltip to appear on top or on the bottom, see examples below. Note that we use the `margin-left` property with a value of minus 65 pixels. This is to center the tooltip above/below the hoverable text. It is set to the half of the tooltip's width (130/2 = 65).

```javascript
.tooltiptext {  width: 130px;  bottom: 100%;  left: 65%;  margin-left: -65px; /* Use half of the width (130/2 = 65), to center the tooltip */}
```
```javascript
.tooltiptext {  width: 130px;  top: 100%;  left: 50%;  margin-left: -65px; /* Use half of the width (130/2 = 65), to center the tooltip */}
```

* * *

## Fade-in Tooltip

If you want a tooltip that fades in, use the CSS `transition` property and the `opacity` property, and go from being completely invisible to 100% visible, in a number of specified seconds (2 second in our example):

```javascript
.tooltiptext {  opacity: 0;  transition: opacity 2s;}.tooltip:hover .tooltiptext {  opacity: 1;}
```

* * *

* * *