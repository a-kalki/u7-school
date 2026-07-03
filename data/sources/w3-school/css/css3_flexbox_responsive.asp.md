# CSS Responsive Flexbox

* * *

## Responsive Flexbox

You learned from the [CSS Media Queries](css3_mediaqueries.asp.html) chapter that you can use media queries to create different layouts for different screen sizes and devices.

For example, if you want to create a three-column layout for large screen sizes, and a one-column layout for small screen sizes (such as phones), you can change the `[flex-direction](https://www.w3schools.com/cssref/css3_pr_flex-direction.php)` from `row` to `column` at a specific breakpoint (600px in the example below):

```javascript
.flex-container {  display: flex;  flex-direction: row;}.flex-item {  background-color: #f1f1f1;  padding: 10px;  font-size: 30px;  text-align: center;  width: 100%;}/* Make a one column-layout instead of three-column layout */@media (max-width: 600px) {  .flex-container {    flex-direction: column;  }}
```

Another way is to change the percentage of the `[flex](https://www.w3schools.com/cssref/css3_pr_flex.php)` property of the flex items to create different layouts for different screen sizes. Note that we also have to include `flex-wrap: wrap;` on the flex container for this example to work:

```javascript
.flex-container {  display: flex;  flex-wrap: wrap;}.flex-item {  background-color: #f1f1f1;  padding: 10px;  text-align: center;  font-size: 30px;  flex: 33.3%;}/* Make a one column-layout instead of a three-column layout */@media (max-width: 600px) {  .flex-item {    flex: 100%;  }}
```

* * *

* * *

## Responsive Image Gallery using Flexbox

Here, we use media queries together with flexbox to create a responsive image gallery:

[Try it Yourself »](https://www.w3schools.com/css/tryit.asp?filename=trycss3_flexbox_image_gallery)

* * *

## Responsive Website using Flexbox

Use flexbox to create a responsive website, containing a flexible navigation bar and flexible content:

[Try it Yourself »](https://www.w3schools.com/css/tryit.asp?filename=trycss3_flexbox_website)