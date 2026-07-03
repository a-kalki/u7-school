# How TO - Media Queries with JavaScript

* * *

```javascript
function myFunction(x) {  if (x.matches) { // If media query matches    document.body.style.backgroundColor = "yellow";  } else {    document.body.style.backgroundColor = "pink";  }}// Create a MediaQueryList objectvar x = window.matchMedia("(max-width: 700px)")// Call listener function at run timemyFunction(x);// Attach listener function on state changesx.addEventListener("change", function() {  myFunction(x);});
```

* * *

## Using Media Queries With JavaScript

Media queries was introduced in CSS3, and is one of the key ingredients for responsive web design. Media queries are used to determine the width and height of a viewport to make web pages look good on all devices (desktops, laptops, tablets, phones, etc).

The [window.matchMedia()](https://www.w3schools.com/jsref/met_win_matchmedia.asp) method returns a MediaQueryList object representing the results of the specified CSS media query string. The value of the matchMedia() method can be any of the media features of the [CSS @media rule](https://www.w3schools.com/cssref/css3_pr_mediaquery.asp), like min-height, min-width, orientation, etc.

Learn more about media queries in our [CSS Media Queries](https://www.w3schools.com/css/css3_mediaqueries.asp) Tutorial

Learn more about responsive design in our [Responsive Web Design](https://www.w3schools.com/css/css_rwd_intro.asp) Tutorial

Learn more about the [window.matchMedia()](https://www.w3schools.com/jsref/met_win_matchmedia.asp) method in our JavaScript Reference.

* * *

* * *