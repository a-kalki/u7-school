# CSS Flex Container

* * *

## CSS Flex Container Properties

The flex container element can have the following properties:

*   `display` - Must be set to `flex` or `inline-flex`
*   `flex-direction` - Sets the display-direction of flex items
*   `flex-wrap` - Specifies whether the flex items should wrap or not
*   `flex-flow` - Shorthand property for `flex-direction` and `flex-wrap`
*   `justify-content` - Aligns the flex items when they do not use all available space on the main-axis (horizontally)
*   `align-items` - Aligns the flex items when they do not use all available space on the cross-axis (vertically)
*   `align-content` - Aligns the flex lines when there is extra space in the cross axis and flex items wrap

* * *

## CSS flex-direction Property

The `[flex-direction](https://www.w3schools.com/cssref/css3_pr_flex-direction.php)` property specifies the display-direction of flex items in the flex container.

This property can have one of the following values:

*   `row` (default)
*   `column`
*   `row-reverse`
*   `column-reverse`

```javascript
.flex-container {  display: flex;  flex-direction: row;}
```
```javascript
.flex-container {  display: flex;  flex-direction: column;}
```
```javascript
.flex-container {  display: flex;  flex-direction: row-reverse;}
```
```javascript
.flex-container {  display: flex;  flex-direction: column-reverse;}
```

* * *

* * *

## CSS flex-wrap Property

The `[flex-wrap](https://www.w3schools.com/cssref/css3_pr_flex-wrap.php)` property specifies whether the flex items should wrap or not, if there is not enough room for them on one flex line.

This property can have one of the following values:

*   `nowrap` (default)
*   `wrap`
*   `wrap-reverse`

```javascript
.flex-container {  display: flex;  flex-wrap: nowrap;}
```
```javascript
.flex-container {  display: flex;  flex-wrap: wrap;}
```
```javascript
.flex-container {  display: flex;  flex-wrap: wrap-reverse;}
```

* * *

## CSS flex-flow Property

The `[flex-flow](https://www.w3schools.com/cssref/css3_pr_flex-flow.php)` property is a shorthand property for setting both the `[flex-direction](https://www.w3schools.com/cssref/css3_pr_flex-direction.php)` and `[flex-wrap](https://www.w3schools.com/cssref/css3_pr_flex-wrap.php)` properties.

```javascript
.flex-container {  display: flex;  flex-flow: row wrap;}
```

* * *

## Flex Container Subpages

Continue learning about flex container properties:

*   [justify-content](css3_flexbox_container_justify.asp.html) - horizontal alignment of flex items
*   [align-items & align-content](css3_flexbox_container_align.asp.html) - vertical alignment and true centering

* * *

* * *