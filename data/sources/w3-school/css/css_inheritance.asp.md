# CSS Inheritance

* * *

## CSS Inheritance

CSS inheritance is about what happens if no value is specified for a property on an element.

If no value is specified for a property, the value can either be inherited from the parent element, or be set to its initial (default) value.

For CSS inheritance, properties are categorized in two types:

*   **inherited properties**
*   **non-inherited properties**

* * *

## Inherited Properties

Inherited properties are, by default, set to the computed value of the parent element.

Properties related to text, such as `[color](https://www.w3schools.com/cssref/pr_text_color.php)`, `[font-family](https://www.w3schools.com/cssref/pr_font_font-family.php)`, `[font-size](https://www.w3schools.com/cssref/pr_font_font-size.php)`, `[line-height](https://www.w3schools.com/cssref/pr_dim_line-height.php)`, and `[text-align](https://www.w3schools.com/cssref/pr_text_text-align.php)`, are typically inherited. This ensures consistent text styling throughout a document.

In the following example, the text inside the <strong> element will appear in 20px and in blue, since the <strong> element inherits the `color` and the `font-size` value from the parent (<p>) element.

```javascript
<style>p {  color: blue;  font-size: 20px;}</style><body><p>This is a paragraph with some <strong>important</strong> text.</p></body>
```

* * *

* * *

## Non-inherited Properties

If there is not set a value for a non-inherited property, the value is set to the initial (default) value of that property.

Properties related to the box model or layout, like `[border](https://www.w3schools.com/cssref/pr_border.php)`, `[background](https://www.w3schools.com/cssref/css3_pr_background.php)`, `[margin](https://www.w3schools.com/cssref/pr_margin.php)`, `[padding](https://www.w3schools.com/cssref/pr_padding.php)`, `[width](https://www.w3schools.com/cssref/pr_dim_width.php)`, and `[height](https://www.w3schools.com/cssref/pr_dim_height.php)`, are typically not inherited.

In the following example, the <strong> element, inside the <p> element, will not have an additional border (since the initial value of `[border-style](https://www.w3schools.com/cssref/pr_border-style.php)` is none).

```javascript
<style>p {  border: 1px solid red;}</style><body><p>This is a paragraph with some <strong>important</strong> text.</p></body>
```

* * *

## The inherit Keyword

The `[inherit](https://www.w3schools.com/cssref/css_inherit.php)` keyword is used to explicitly specify inheritance. It works on both inherited and non-inherited properties.

In the following example, the <strong> element, inside the <p> element, will have an additional border, since we have used the `inherit` keyword to explicitly specify that the border value should be inherit.

```javascript
<style>p {  border: 1px solid red;}strong {  border: inherit;}</style><body><p>This is a paragraph with some <strong>strong</strong> text.</p></body>
```