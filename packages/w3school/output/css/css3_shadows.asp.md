# CSS Shadow Effects

* * *

With CSS you can create shadow effects!

* * *

## CSS Text Shadow

The CSS `[text-shadow](https://www.w3schools.com/cssref/css3_pr_text-shadow.php)` property applies a shadow to text.

In its simplest use, you only specify the horizontal and the vertical shadow.

In addition, you can add a shadow color and blur effect.

## Text shadow effect!

```javascript
h1 {  text-shadow: 2px 2px;}
```

Next, add a color to the shadow:

## Text shadow effect!

```javascript
h1 {  text-shadow: 2px 2px red;}
```

Then, add a blur effect to the shadow:

## Text shadow effect!

```javascript
h1 {  text-shadow: 2px 2px 5px red;}
```

The following example shows a white text with black shadow:

## Text shadow effect!

```javascript
h1 {  color: white;  text-shadow: 2px 2px 4px #000000;}
```

The following example shows a red neon glow shadow:

## Text shadow effect!

```javascript
h1 {  text-shadow: 0 0 3px #ff0000;}
```

* * *

* * *

## Multiple Shadows

To add more than one shadow to the text, you can add a comma-separated list of shadows.

The following example shows a red and blue neon glow shadow:

## Text shadow effect!

```javascript
h1 {  text-shadow: 0 0 3px #ff0000, 0 0 5px #0000ff;}
```

The following example shows a white text with black, blue, and darkblue shadow:

## Text shadow effect!

```javascript
h1 {  color: white;  text-shadow: 1px 1px 2px black, 0 0 25px blue, 0 0 5px darkblue;}
```

You can also use the text-shadow property to create a plain border around some text (without shadows):

## Border around text!

```javascript
h1 {  color: coral;  text-shadow: -1px 0 black, 0 1px black, 1px 0 black, 0 -1px black;}
```

* * *

* * *