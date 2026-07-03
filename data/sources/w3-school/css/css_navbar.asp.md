# CSS Navigation Bars

* * *

## CSS Navigation Bars

A navigation bar is an important component of web design.

Navigation bars helps users to easily navigate between different sections of a website.

Navigation bars are typically built with HTML list elements ( <ul> and <li>), and then styled with CSS to get a great look.

A navigation bar is typically located at the top or at the side of a webpage.

A vertical navbar:

*   [Home](javascript:void\(0\))
*   [News](javascript:void\(0\))
*   [Contact](javascript:void\(0\))
*   [About](javascript:void\(0\))

A horizontal navbar:

*   [Home](javascript:void\(0\))
*   [News](javascript:void\(0\))
*   [Contact](javascript:void\(0\))
*   [About](javascript:void\(0\))

* * *

## Navigation Bar = List of Links

A navigation bar is basically a list of links, so using the HTML <ul> and <li> elements makes perfect sense:

```javascript
<ul>  <li><a href="default.asp">Home</a></li>  <li><a href="news.asp">News</a></li>  <li><a href="contact.asp">Contact</a></li>  <li><a href="about.asp">About</a></li></ul>
```

Now let's remove the bullets and the margins and padding from the <ul> element:

```javascript
ul {  list-style-type: none;  margin: 0;  padding: 0;}
```

Example explained:

*   Set `[list-style-type: none;](https://www.w3schools.com/cssref/pr_list-style-type.php)` - Removes the bullet points from list
*   Set `[margin: 0;](https://www.w3schools.com/cssref/pr_margin.php)` - Resets default browser margins
*   Set `[padding: 0;](https://www.w3schools.com/cssref/pr_padding.php)` - Resets default browser paddings

**Note:** The HTML and CSS code in the example above is the base code used for both vertical and horizontal navigation bars, which you will learn more about in the next chapters.

* * *

* * *