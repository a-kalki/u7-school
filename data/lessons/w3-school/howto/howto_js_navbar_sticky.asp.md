# How TO - Sticky/Affix Navbar

* * *

Learn how to create a "sticky" navbar with CSS.

* * *

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_navbar_sticky)

* * *

## How To Create a Sticky Navbar

##### Step 1) Add HTML:

Create a navigation bar:

```javascript
<div id="navbar">  <a href="#home">Home</a>  <a href="#news">News</a>  <a href="#contact">Contact</a></div>
```

* * *

##### Step 2) Add CSS:

Style the navigation bar; add `position:sticky` and `top:0` to make the navbar stick when you reach its scroll position:

```javascript
/* Style the navbar */#navbar {  position: sticky;  top: 0;  overflow: hidden;  background-color: #333;}/* Navbar links */#navbar a {  float: left;  display: block;  color: #f2f2f2;  text-align: center;  padding: 14px;  text-decoration: none;}/* Page content */.content {  padding: 16px;}
```

An element with `position: sticky;` is positioned based on the user's scroll position.

A sticky element toggles between `relative` and `fixed`, depending on the scroll position. It is positioned relative until a given offset position is met in the viewport - then it "sticks" in place (like position:fixed).

**Note:** You must specify at least one of `top`, `right`, `bottom` or `left` for sticky positioning to work.

To learn more about CSS positoning, read our [CSS Position](https://www.w3schools.com/css/css_positioning.asp) tutorial.

* * *

* * *