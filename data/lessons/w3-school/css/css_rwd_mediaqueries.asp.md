# Responsive Web Design - Media Queries

* * *

## CSS Media Queries

CSS media queries allow you to apply styles based on the characteristics of a device or the environment displaying the web page.

CSS media queries are essential for creating responsive web pages.

The CSS `[@media](https://www.w3schools.com/cssref/atrule_media.php)` rule is used to add media queries to your style sheet.

* * *

## Use Mediaqueries to Add a Breakpoint

On the previous page we made a grid layout web page. Now we want to add a breakpoint with mediaqueries to rearrange the grid items on bigger screens.

![](rwd_phone.png)  
Mobile phone

![](rwd_desktop.png)  
Desktop

  
```javascript
@media (min-width: 600px) {  .header {grid-area: 1 / span 6;}  .menu {grid-area: 2 / span 1;}  .content {grid-area: 2 / span 4;}  .facts {grid-area: 2 / span 1;}  .footer {grid-area: 3 / span 6;}}
```

* * *

* * *

## Another Breakpoint

You can add as many breakpoints as you like.

![](rwd_desktop.png)  
Desktop

![](rwd_tablet.png)  
Tablet

![](rwd_phone.png)  
Phone

  
```javascript
@media (min-width: 600px) {  .header {grid-area: 1 / span 6;}  .menu {grid-area: 2 / span 1;}  .content {grid-area: 2 / span 4;}  .facts {grid-area: 3 / span 6;}  .footer {grid-area: 4 / span 6;}}@media (min-width: 768px) {  .header {grid-area: 1 / span 6;}  .menu {grid-area: 2 / span 1;}  .content {grid-area: 2 / span 4;}  .facts {grid-area: 2 / span 1;}  .footer {grid-area: 3 / span 6;}}
```

* * *

## Typical Device Breakpoints

There are tons of screens and devices with different heights and widths, so it is hard to create an exact breakpoint for each device. To keep things simple you could target five groups:

```javascript
/* Extra small devices (phones, 600px and down) */@media only screen and (max-width: 600px) {...}/* Small devices (portrait tablets and large phones, 600px and up) */@media only screen and (min-width: 600px) {...}/* Medium devices (landscape tablets, 768px and up) */@media only screen and (min-width: 768px) {...}/* Large devices (laptops/desktops, 992px and up) */@media only screen and (min-width: 992px) {...}/* Extra large devices (large laptops and desktops, 1200px and up) */@media only screen and (min-width: 1200px) {...}
```

* * *

## Media Queries for Screen Orientation

Media queries can also be used to change the layout of a page depending on the orientation of the screen.

Here, we change the background-color of the body, if the screen orientation is in landscape mode:

```javascript
@media only screen and (orientation: landscape) {  body {    background-color: lightblue;  }}
```

* * *

## Hide Elements With Media Queries

Here, we use media queries to hide an element on small screens:

I will be hidden on small screens.

```javascript
/* Hide element if the viewport width is 600px or less */@media screen and (max-width: 600px) {  #div1 {    display: none;  }}
```

* * *

## Change Font Size With Media Queries

Here, we use media queries to change the font size of an element on different viewport widths:

```javascript
/* If viewport width is 600px or more, set font-size to 80px */@media screen and (min-width: 600px) {  #div1 {    font-size: 80px;  }}
```

* * *

## Media Queries for User Preferences

Some users have motion sensitivity and prefer websites with less animation.

The `prefers-reduced-motion` media feature lets you check if a user has asked to reduce motion, such as animations or transitions. Use this feature to turn off animations and transitions for the users who has activated this setting on their computer:

```javascript
@media (prefers-reduced-motion: reduce) {  * {    animation: none !important;    transition: none !important;  }}
```

* * *

* * *

## CSS @media Reference

For a full overview of all the media types and features/expressions, please look at the [@media rule in our CSS reference](https://www.w3schools.com/cssref/atrule_media.php).