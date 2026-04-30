# CSS Float

* * *

## The CSS float Property

The `[float](https://www.w3schools.com/cssref/pr_class_float.php)` property specifies how an element should float within its container.

It places an element on the left or right side of its container, allowing text and inline elements to wrap around it.

The `float` property can have one of the following values:

*   `left` - The element floats to the left of its container
*   `right` - The element floats to the right of its container
*   `none` - Default. The element does not float and is displayed just where it occurs in the text
*   `inherit` - The element inherits the float value of its parent

**Tip:** The `float` property is often used to wrap text around images!

* * *

## CSS float: right Example

The `float: right` value indicates that an element should float to the right within its container.

The following example specifies that the image should float to the **right**.

**Tip:** If you make the screen smaller, you will see that the text wraps around the image.

![Pineapple](pineapple.jpg)Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus imperdiet, nulla et dictum interdum, nisi lorem egestas odio, vitae scelerisque enim ligula venenatis dolor. Maecenas nisl est, ultrices nec congue eget, auctor vitae massa. Fusce luctus vestibulum augue ut aliquet. Mauris ante ligula, facilisis sed ornare eu, lobortis in odio. Praesent convallis urna a lacus interdum ut hendrerit risus congue. Nunc sagittis dictum nisi, sed ullamcorper ipsum dignissim ac...

```javascript
img {  float: right;}
```

* * *

* * *

## CSS float: left Example

The `float: left` value indicates that an element should float to the left within its container.

The following example specifies that the image should float to the **left**:

![Pineapple](pineapple.jpg)Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus imperdiet, nulla et dictum interdum, nisi lorem egestas odio, vitae scelerisque enim ligula venenatis dolor. Maecenas nisl est, ultrices nec congue eget, auctor vitae massa. Fusce luctus vestibulum augue ut aliquet. Mauris ante ligula, facilisis sed ornare eu, lobortis in odio. Praesent convallis urna a lacus interdum ut hendrerit risus congue. Nunc sagittis dictum nisi, sed ullamcorper ipsum dignissim ac...

```javascript
img {  float: left;}
```

* * *

## CSS float: none Example

The `float: none` value is the default value for `float`, and the element is displayed just where it occurs in its container.

In the following example the image will be displayed just where it occurs in the container:

![Pineapple](pineapple.jpg) Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus imperdiet, nulla et dictum interdum, nisi lorem egestas odio, vitae scelerisque enim ligula venenatis dolor. Maecenas nisl est, ultrices nec congue eget, auctor vitae massa. Fusce luctus vestibulum augue ut aliquet. Mauris ante ligula, facilisis sed ornare eu, lobortis in odio. Praesent convallis urna a lacus interdum ut hendrerit risus congue. Nunc sagittis dictum nisi, sed ullamcorper ipsum dignissim ac...

```javascript
img {  float: none;}
```

* * *

## CSS Float Next To Each Other

HTML <div> elements are block elements, and will start on a new line and take up the full width available. However, if we use `float: left` we can make the <div> elements to float next to each other:

```javascript
div {  float: left;  padding: 15px;}.div1 {  background: red;}.div2 {  background: yellow;}.div3 {  background: green;}
```

* * *

* * *

## CSS Float Property

Property

Description

[float](https://www.w3schools.com/cssref/pr_class_float.php)

Specifies whether an element should float to the left, right, or not at all