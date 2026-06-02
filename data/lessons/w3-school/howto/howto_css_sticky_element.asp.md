# How TO - Sticky Element

* * *

Learn how to create a sticky element with CSS.

* * *

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_sticky_element)

**Note:** This example does not work in Internet Explorer or Edge 15 and earlier versions.

* * *

## Sticky Element

```javascript
div.sticky {  position: sticky;  top: 0;}
```

An element with `position: sticky;` is positioned based on the user's scroll position.

A sticky element toggles between `relative` and `fixed`, depending on the scroll position. It is positioned relative until a given offset position is met in the viewport - then it "sticks" in place (like position:fixed).

**Note:** You must specify at least one of `top`, `right`, `bottom` or `left` for sticky positioning to work.

To learn more about CSS positoning, read our [CSS Position](https://www.w3schools.com/css/css_positioning.asp) tutorial.

* * *

* * *