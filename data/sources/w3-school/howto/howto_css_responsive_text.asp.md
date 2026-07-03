# How TO - Responsive Text

* * *

Learn how to create responsive typography with CSS.

* * *

# Hello World

Resize the browser window to see how the font size scales.

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_responsive_text)

* * *

## Responsive Font Size

The text size can be set with a `vw` unit, which means the "viewport width".

That way the text size will follow the size of the browser window:

```javascript
<h1 style="font-size:8vw;">Hello World</h1><p style="font-size:2vw;">Resize the browser window to see how the font size scales.</p>
```

Viewport is the browser window size. 1vw = 1% of viewport width. If the viewport is 50cm wide, 1vw is 0.5cm.

* * *

* * *

## Change Font Size With Media Queries

You could also use media queries to change the font size of an element on specific screen sizes:

# Variable Font Size.

```javascript
/* If the screen size is 601px wide or more, set the font-size of <div> to 80px */@media screen and (min-width: 601px) {  div.example {    font-size: 80px;  }}/* If the screen size is 600px wide or less, set the font-size of <div> to 30px */@media screen and (max-width: 600px) {  div.example {    font-size: 30px;  }}
```

**Tip:** [Go to our CSS Font Tutorial](https://www.w3schools.com/css/css_font.asp) to learn more about fonts.

To learn more about media queries, read our [CSS Media Queries Tutorial](https://www.w3schools.com/css/css3_mediaqueries.asp).