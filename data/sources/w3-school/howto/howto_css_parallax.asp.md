# How TO - Parallax Scrolling

* * *

Learn how to create a "parallax" scrolling effect with CSS.

* * *

## Parallax

Parallax scrolling is a web site trend where the background content (i.e. an image) is moved at a different speed than the foreground content while scrolling. Click on the links below to see the difference between a website with and without parallax scrolling.

[Demo with parallax scrolling](https://www.w3schools.com/howto/tryhow_css_parallax_demo.htm)

[Demo without parallax scrolling](https://www.w3schools.com/howto/tryhow_css_parallax_demo_none.htm)

**Note:** Parallax scrolling does not always work on mobile devices/smart phones. However, you can use media queries to turn off the effect on mobile devices (see last example on this page).

* * *

## How To Create a Parallax Scrolling Effect

Use a container element and add a background image to the container with a specific height. Then use the `background-attachment: fixed` to create the actual parallax effect. The other background properties are used to center and scale the image perfectly:

```javascript
<style>.parallax {  /* The image used */  background-image: url("img_parallax.jpg");  /* Set a specific height */  min-height: 500px;  /* Create the parallax scrolling effect */  background-attachment: fixed;  background-position: center;  background-repeat: no-repeat;  background-size: cover;}</style><!-- Container element --><div class="parallax"></div>
```

The example above used pixels to set the height of the image. If you want to use percent, for example 100%, to make the image fit the whole screen, set the height of the parallax container to 100%. **Note:** You must also apply `height: 100%` to both <html> and <body>:

```javascript
body, html {  height: 100%;}.parallax {  /* The image used */  background-image: url("img_parallax.jpg");  /* Full height */  height: 100%;  /* Create the parallax scrolling effect */  background-attachment: fixed;  background-position: center;  background-repeat: no-repeat;  background-size: cover;}
```

Some mobile devices have a problem with `background-attachment: fixed`. However, you can use media queries to turn off the parallax effect for mobile devices:

```javascript
/* Turn off parallax scrolling for all tablets and phones. Increase/decrease the pixels if needed */@media only screen and (max-device-width: 1366px) {  .parallax {    background-attachment: scroll;  }}
```

* * *

* * *