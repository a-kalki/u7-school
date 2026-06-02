# CSS Flex Items

* * *

## CSS Flex Items

The direct child elements of a flex container automatically becomes flex items.

Flex items can have the following properties:

*   `order` - Specifies the display order of the flex items inside the flex container
*   `flex-grow` - Specifies how much a flex item will grow relative to the rest of the flex items
*   `flex-shrink` - Specifies how much a flex item will shrink relative to the rest of the flex items
*   `flex-basis` - Specifies the initial length of a flex item
*   `flex` - Shorthand property for `flex-grow`, `flex-shrink`, and `flex-basis`
*   `align-self` - Specifies the alignment for the flex item inside the flex container

* * *

## CSS order Property

The `[order](https://www.w3schools.com/cssref/css3_pr_order.php)` property specifies the display order of the flex items inside the flex container.

The first flex item in the source code does not have to appear as the first item in the layout.

The order value must be a number, and the default value is 0.

```javascript
<div class="flex-container">  <div style="order: 3">1</div>  <div style="order: 2">2</div>  <div style="order: 4">3</div>  <div style="order: 1">4</div></div>
```

* * *

## CSS flex-grow Property

The `[flex-grow](https://www.w3schools.com/cssref/css3_pr_flex-grow.php)` property specifies how much a flex item will grow relative to the rest of the flex items.

The value must be a number, and the default value is 0.

```javascript
<div class="flex-container">  <div style="flex-grow: 1">1</div>  <div style="flex-grow: 1">2</div>  <div style="flex-grow: 4">3</div></div>
```

* * *

* * *

## CSS flex-shrink Property

The `[flex-shrink](https://www.w3schools.com/cssref/css3_pr_flex-shrink.php)` property specifies how much a flex item will shrink relative to the rest of the flex items.

The value must be a number, and the default value is 1.

```javascript
<div class="flex-container">  <div>1</div>  <div>2</div>  <div style="flex-shrink: 2">3</div>  <div>4</div>  <div>5</div>  <div>6</div></div>
```

* * *

## CSS flex-basis Property

The `[flex-basis](https://www.w3schools.com/cssref/css3_pr_flex-basis.php)` property specifies the initial length of a flex item.

```javascript
<div class="flex-container">  <div>1</div>  <div>2</div>  <div style="flex-basis: 250px">3</div>  <div>4</div></div>
```

* * *

## CSS flex Property

The `[flex](https://www.w3schools.com/cssref/css3_pr_flex.php)` property is a shorthand property for the `[flex-grow](https://www.w3schools.com/cssref/css3_pr_flex-grow.php)`, `[flex-shrink](https://www.w3schools.com/cssref/css3_pr_flex-shrink.php)`, and `[flex-basis](https://www.w3schools.com/cssref/css3_pr_flex-basis.php)` properties.

```javascript
<div class="flex-container">  <div>1</div>  <div>2</div>  <div style="flex: 1 0 150px">3</div>  <div>4</div></div>
```

* * *

## CSS align-self Property

The `[align-self](https://www.w3schools.com/cssref/css3_pr_align-self.php)` property specifies the alignment for the selected item inside the flexible container.

This property overrides the default alignment set by the container's `[align-items](https://www.w3schools.com/cssref/css3_pr_align-items.php)` property.

In these examples we use a 200 pixels high container, to better demonstrate the `[align-self](https://www.w3schools.com/cssref/css3_pr_align-self.php)` property:

```javascript
<div class="flex-container">  <div>1</div>  <div>2</div>  <div style="align-self: center">3</div>  <div>4</div></div>
```
```javascript
<div class="flex-container">  <div>1</div>  <div style="align-self: flex-start">2</div>  <div style="align-self: flex-end">3</div>  <div>4</div></div>
```

* * *

* * *

## The CSS Flex Items Properties

The following table lists all the CSS Flex Items properties:

Property

Description

[align-self](https://www.w3schools.com/cssref/css3_pr_align-self.php)

Specifies the alignment for a flex item (overrides the flex container's align-items property)

[flex](https://www.w3schools.com/cssref/css3_pr_flex.php)

A shorthand property for the flex-grow, flex-shrink, and the flex-basis properties

[flex-basis](https://www.w3schools.com/cssref/css3_pr_flex-basis.php)

Specifies the initial length of a flex item

[flex-grow](https://www.w3schools.com/cssref/css3_pr_flex-grow.php)

Specifies how much a flex item will grow relative to the rest of the flex items inside the container

[flex-shrink](https://www.w3schools.com/cssref/css3_pr_flex-shrink.php)

Specifies how much a flex item will shrink relative to the rest of the flex items inside the container

[order](https://www.w3schools.com/cssref/css3_pr_order.php)

Specifies the order of the flex items inside the container