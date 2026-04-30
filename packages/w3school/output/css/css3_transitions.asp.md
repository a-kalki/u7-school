# CSS Transitions

* * *

## CSS Transitions

CSS transitions allows you to change property values smoothly, over a given duration.

**Mouse over the element below to see a CSS transition effect:**

CSS

* * *

## The CSS transition Property

To create a transition effect, you must specify the CSS property you want to add a transition to, and the duration of the transition.

The CSS `[transition](https://www.w3schools.com/cssref/css3_pr_transition.php)` property is a shorthand property for:

*   `[transition-property](https://www.w3schools.com/cssref/css3_pr_transition-property.php)`
*   `[transition-duration](https://www.w3schools.com/cssref/css3_pr_transition-duration.php)`
*   `[transition-timing-function](https://www.w3schools.com/cssref/css3_pr_transition-timing-function.php)`
*   `[transition-delay](https://www.w3schools.com/cssref/css3_pr_transition-delay.php)`

### CSS Transition Example

The following example shows a 100px \* 100px <div> element. The <div> element has specified a transition effect for the width property, with a duration of 2 seconds:

```javascript
div {  width: 100px;  height: 100px;  background-color: red;  transition: width 2s;}
```

### How to Trigger the Transition

The transition is triggered when there is a change in the element's properties. This often happens within pseudo-classes (:hover, :active, :focus, or :checked).

So, from the code above, the transition effect will start when the width property changes value.

Now, we add a div:hover class that specifies a new value for the width property when a user mouses over the <div> element:

```javascript
div:hover {  width: 300px;}
```

Notice that when the cursor mouses out of the element, it will gradually change back to its original style.

* * *

* * *

## Change Multiple Property Values

You can change multiple properties by separating them by commas.

The following example adds a transition effect for the width, height, and background-color properties, with a duration of 2 seconds for the width, 4 seconds for the height, and 3 seconds for the background-color:

```javascript
div {  transition: width 2s, height 4s, background-color 3s;}
```

* * *

* * *

## CSS Transition Properties

The following table lists all the CSS transition properties:

Property

Description

[transition](https://www.w3schools.com/cssref/css3_pr_transition.php)

A shorthand property for setting the four transition properties into a single property

[transition-delay](https://www.w3schools.com/cssref/css3_pr_transition-delay.php)

Specifies a delay (in seconds) for the transition effect

[transition-duration](https://www.w3schools.com/cssref/css3_pr_transition-duration.php)

Specifies how many seconds or milliseconds a transition effect takes to complete

[transition-property](https://www.w3schools.com/cssref/css3_pr_transition-property.php)

Specifies the name of the CSS property the transition effect is for

[transition-timing-function](https://www.w3schools.com/cssref/css3_pr_transition-timing-function.php)

Specifies the speed curve of the transition effect