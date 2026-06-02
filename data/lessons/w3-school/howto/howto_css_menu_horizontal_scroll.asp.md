# How TO - Horizontal Scroll Menu

* * *

Learn how to create a horizontal scrollable menu with CSS.

* * *

[Home](howto_css_menu_horizontal_scroll.asp.html#home) [News](howto_css_menu_horizontal_scroll.asp.html#news) [Contact](howto_css_menu_horizontal_scroll.asp.html#contact) [About](howto_css_menu_horizontal_scroll.asp.html#about) [Support](howto_css_menu_horizontal_scroll.asp.html#support) [Blog](howto_css_menu_horizontal_scroll.asp.html#blog) [Tools](howto_css_menu_horizontal_scroll.asp.html#tools) [Base](howto_css_menu_horizontal_scroll.asp.html#base) [Custom](howto_css_menu_horizontal_scroll.asp.html#custom) [More](howto_css_menu_horizontal_scroll.asp.html#more) [Logo](howto_css_menu_horizontal_scroll.asp.html#logo) [Friends](howto_css_menu_horizontal_scroll.asp.html#friends) [Partners](howto_css_menu_horizontal_scroll.asp.html#partners) [People](howto_css_menu_horizontal_scroll.asp.html#people) [Work](howto_css_menu_horizontal_scroll.asp.html#work)

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_menu_hor_scroll)

* * *

## How To Create a Horizontal Scrollable Menu

##### Step 1) Add HTML:

```javascript
<div class="scrollmenu">  <a href="#home">Home</a>  <a href="#news">News</a>  <a href="#contact">Contact</a>  <a href="#about">About</a>  ...</div>
```

* * *

##### Step 2) Add CSS:

The trick to make the navbar scrollable is by using `overflow:auto` and `white-space: nowrap`:

```javascript
div.scrollmenu {  background-color: #333;  overflow: auto;  white-space: nowrap;}div.scrollmenu a {  display: inline-block;  color: white;  text-align: center;  padding: 14px;  text-decoration: none;}div.scrollmenu a:hover {  background-color: #777;}
```

**Tip:** Go to our [CSS Navbar Tutorial](https://www.w3schools.com/css/css_navbar.asp) to learn more about navigation bars.

* * *

* * *