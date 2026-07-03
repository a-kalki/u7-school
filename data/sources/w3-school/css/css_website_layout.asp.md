# CSS Website Layout

* * *

## CSS Website Layout

A website is often divided into multiple sections, like a top header, navigation menu, main content, and a footer:

Header

Navigation Menu

Content

Main Content

Content

Footer

There are tons of different layout designs to choose from. However, the structure above, is one of the most common, and we will take a closer look at it in this tutorial.

* * *

## CSS Header

A header is usually located at the top of the website, and often contains a logo or the website name:

```javascript
header {  background-color: #f1f1f1;  text-align: center;  padding: 10px;}
```

* * *

## CSS Navigation Bar

A navigation bar contains a list of links to help visitors navigate through your website:

```javascript
/* Style the topnav */ul.topnav {  display: flex;  list-style-type: none;  margin: 0;  padding: 0;  background-color: #333333;}/* Style links in topnav */ul.topnav li a {  display: block;  color: #f1f1f1;  padding: 14px 16px;  text-decoration: none;}/* Change color on hover */ul.topnav li a:hover {  background-color: #dddddd;  color: black;}
```

* * *

* * *

## CSS Layout Content

How the content of a website should be shown, often depends on the device of the users. The most common layouts are:

*   **1-column layout** (often used for mobile browsers)
*   **2-columns layout** (often used for tablets and laptops)
*   **3-columns layout** (only used for desktops)

1-column:

2-column:

3-column:

Here we will create a 3-column layout, and change it to a 1-column layout when the width of the screen is less than 600px:

```javascript
div.flex-container {  display: flex;  /* Show the flex items horizontally */  flex-direction: row;}div.flex-container > div {  margin: 10px;}/* Use media query and show the flex items vertically if screen width is less than 600px */@media screen and (max-width:600px) {  div.flex-container {    flex-direction: column;  }}
```

**Tip:** Learn more about the CSS `@media` rule in our [CSS Media Queries](css3_mediaqueries.asp.html) chapter.

**Tip:** Learn more about CSS Flexbox in our [CSS Flexbox](css3_flexbox.asp.html) chapter.

* * *

## CSS Basic and Fixed Footer

The footer is placed at the bottom of a webpage. It often contains information like copyright and contact info.

The following example shows a basic footer styling:

```javascript
footer {  background-color: #f1f1f1;  text-align: center;  padding: 8px;}
```

The following example shows a fixed footer that is always visible at the bottom of the page, regardless of scrolling:

```javascript
footer {  position: fixed;  bottom: 0;  left: 0;  width: 100%;  background-color: #f1f1f1;  padding: 8px;  text-align: center;  z-index: 1000;}
```

* * *

## CSS Responsive Website

In this example, we use [media queries](css3_mediaqueries.asp.html) together with [flexbox](css3_flexbox.asp.html) to create a responsive website, containing a flexible navigation bar and flexible content.

```javascript

```

Ever heard about **W3Schools Spaces**? Here you can create your website from scratch or use a template.

[Get started for free ❯](https://www.w3spaces.com "Get Started With W3Schools Spaces")

_\* no credit card required_