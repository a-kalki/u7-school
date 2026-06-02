# How TO - On Scroll Header

* * *

Learn how to create a fixed/sticky header on scroll with CSS.

* * *

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_sticky_header)

* * *

## How To Create a Fixed Header on Scroll

##### Step 1) Add HTML:

```javascript
<div class="header" id="myHeader">  <h2>My Header</h2></div>
```

* * *

##### Step 2) Add CSS:

Style the header; add `position:sticky` and `top:0` to make the header stick when you reach its scroll position:

```javascript
.header {  position: sticky;  top: 0;  padding: 10px 16px;  background: #555;  color: #f1f1f1;}
```

An element with `position: sticky;` is positioned based on the user's scroll position.

A sticky element toggles between `relative` and `fixed`, depending on the scroll position. It is positioned relative until a given offset position is met in the viewport - then it "sticks" in place (like position:fixed).

**Note:** You must specify at least one of `top`, `right`, `bottom` or `left` for sticky positioning to work.

To learn more about CSS positoning, read our [CSS Position](https://www.w3schools.com/css/css_positioning.asp) tutorial.

* * *

* * *