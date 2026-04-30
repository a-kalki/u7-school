# How TO - Full Page Image

* * *

Learn how to create a full page background image with CSS.

* * *

## Full Page Image

Learn how to create a background image that covers the entire browser window. The following example shows a full-screen (and a half-screen) responsive background image:

[Demo - Full page background image](https://www.w3schools.com/howto/tryhow_css_fullpage_demo.htm)

[Demo - Half page background image](https://www.w3schools.com/howto/tryhow_css_halfpage_demo.htm)

* * *

## How To Create a Full Height Image

Use a container element and add a background image to the container with `height: 100%`. **Tip:** Use 50% to create a half page background image. Then use the following background properties to center and scale the image perfectly:

**Note:** To make sure that the image covers the whole screen, you must also apply `height: 100%` to both <html> and <body>:

```javascript
body, html {  height: 100%;}.bg {  /* The image used */  background-image: url("img_girl.jpg");  /* Full height */  height: 100%;  /* Center and scale the image nicely */  background-position: center;  background-repeat: no-repeat;  background-size: cover;}
```

Half page background image:

```javascript
.bg {    height: 50%;}
```

* * *

* * *