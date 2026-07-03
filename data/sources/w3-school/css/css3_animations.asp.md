# CSS Animations

* * *

## CSS Animations

CSS allows animation of HTML elements without using JavaScript!

CSS

* * *

## What are CSS Animations?

An animation lets an element gradually change from one style to another.

You can change as many CSS properties you want, as many times as you want.

To use CSS animation, you must specify some keyframes for the animation.

Keyframes hold what styles the element will have at certain times.

* * *

## CSS animation-name and animation-duration

The `[animation-name](https://www.w3schools.com/cssref/css3_pr_animation-name.php)` property specifies a name for the animation.

The `[animation-duration](https://www.w3schools.com/cssref/css3_pr_animation-duration.php)` property defines how long an animation should take to complete. If this property is not specified, no animation will occur, because the default value is 0s (0 seconds).

* * *

## CSS @keyframes Rule

When you specify CSS styles inside the `[@keyframes](https://www.w3schools.com/cssref/atrule_keyframes.php)` rule, the animation will gradually change from the current style to the new style at certain times.

To get an animation to work, you must bind the animation to an element.

The following example binds the "myAnimation" animation to the <div> element. The animation will last for 4 seconds, and it will gradually change the background-color of the <div> element from "red" to "yellow":

```javascript
/* The animation code */@keyframes myAnimation {  from {background-color: red;}  to {background-color: yellow;}}/* The element to apply the animation to */div {  width: 100px;  height: 100px;  background-color: red;  animation-name: myAnimation;  animation-duration: 4s;}
```

In the example above we have used the keywords "from" and "to" in the `@keyframes` rule, which represents 0% (start) and 100% (complete).

It is also possible to use percent. By using percent, you can add as many style changes as you like.

The following example will change the background-color of the <div> element when the animation is 25% complete, 50% complete, and again when the animation is 100% complete:

```javascript
@keyframes myAnimation {  0%   {background-color: red;}  25%  {background-color: yellow;}  50%  {background-color: blue;}  100% {background-color: green;}}div {  width: 100px;  height: 100px;  background-color: red;  animation-name: myAnimation;  animation-duration: 4s;}
```

The following example will change both the background-color and the position of the <div> element when the animation is 25% complete, 50% complete, and again when the animation is 100% complete:

```javascript
@keyframes myAnimation {  0%   {background-color:red; left:0px; top:0px;}  25%  {background-color:yellow; left:200px; top:0px;}  50%  {background-color:blue; left:200px; top:200px;}  75%  {background-color:green; left:0px; top:200px;}  100% {background-color:red; left:0px; top:0px;}}div {  width: 100px;  height: 100px;  position: relative;  background-color: red;  animation-name: myAnimation;  animation-duration: 4s;}
```

* * *

* * *

* * *