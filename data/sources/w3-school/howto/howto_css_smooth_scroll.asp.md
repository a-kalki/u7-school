# How TO - Smooth Scroll

* * *

Learn how to create a smooth scrolling effect with CSS.

* * *

## Smooth Scrolling

## Section 1

Click on the link to see the "smooth" scrolling effect.

[Click Me to Smooth Scroll to Section 2 Below](howto_css_smooth_scroll.asp.html#section2)

Note: Remove the scroll-behavior property to remove smooth scrolling.

## Section 2

[Click Me to Smooth Scroll to Section 1 Above](howto_css_smooth_scroll.asp.html#section1)

* * *

## Smooth Scrolling

Add `scroll-behavior: smooth` to the <html> element to enable smooth scrolling for the whole page (note: it is also possible to add it to a specific element/scroll container):

```javascript
html {  scroll-behavior: smooth;}
```

* * *

## Browser Support

The numbers in the table specify the first browser version that fully supports the scroll-behavior property.

Property

scroll-behavior

61.0

79.0

36.0

14.0

48.0

* * *

* * *

## Cross-browser Solution

For browsers that do not support the `scroll-behavior` property, you could use JavaScript or a JavaScript library, like [jQuery](https://www.w3schools.com/jquery/default.asp), to create a solution that will work for all browsers:

```javascript
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script><script>$(document).ready(function(){  // Add smooth scrolling to all links  $("a").on('click', function(event) {    // Make sure this.hash has a value before overriding default behavior    if (this.hash !== "") {      // Prevent default anchor click behavior      event.preventDefault();      // Store hash      var hash = this.hash;      // Using jQuery's animate() method to add smooth page scroll      // The optional number (800) specifies the number of milliseconds it takes to scroll to the specified area      $('html, body').animate({        scrollTop: $(hash).offset().top      }, 800, function(){        // Add hash (#) to URL when done scrolling (default click behavior)        window.location.hash = hash;      });    } // End if  });});</script>
```

**Tip:** Read more about the scroll-behavior property in our CSS Reference: [CSS scroll-behavior Property](https://www.w3schools.com/cssref/pr_scroll-behavior.asp).