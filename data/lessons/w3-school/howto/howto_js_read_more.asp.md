# How TO - Read More Read Less Button

* * *

Learn how to create a "read more - read less" button with JavaScript.

* * *

## Example Text

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus imperdiet, nulla et dictum interdum, nisi lorem egestas vitae scel...erisque enim ligula venenatis dolor. Maecenas nisl est, ultrices nec congue eget, auctor vitae massa. Fusce luctus vestibulum augue ut aliquet. Nunc sagittis dictum nisi, sed ullamcorper ipsum dignissim ac. In at libero sed nunc venenatis imperdiet sed ornare turpis. Donec vitae dui eget tellus gravida venenatis. Integer fringilla congue eros non fermentum. Sed dapibus pulvinar nibh tempor porta.

Read more

* * *

## Read More Read Less Button

##### Step 1) Add HTML:

```javascript
<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus imperdiet, nulla et dictum interdum, nisi lorem egestas vitae scel<span id="dots">...</span><span id="more">erisque enim ligula venenatis dolor. Maecenas nisl est, ultrices nec congue eget, auctor vitae massa. Fusce luctus vestibulum augue ut aliquet. Nunc sagittis dictum nisi, sed ullamcorper ipsum dignissim ac. In at libero sed nunc venenatis imperdiet sed ornare turpis. Donec vitae dui eget tellus gravida venenatis. Integer fringilla congue eros non fermentum. Sed dapibus pulvinar nibh tempor porta.</span></p><button onclick="myFunction()" id="myBtn">Read more</button>
```

* * *

##### Step 2) Add CSS:

```javascript
#more {display: none;}
```

* * *

##### Step 3) Add JavaScript:

```javascript
function myFunction() {  var dots = document.getElementById("dots");  var moreText = document.getElementById("more");  var btnText = document.getElementById("myBtn");  if (dots.style.display === "none") {    dots.style.display = "inline";    btnText.innerHTML = "Read more";    moreText.style.display = "none";  } else {    dots.style.display = "none";    btnText.innerHTML = "Read less";    moreText.style.display = "inline";  }}
```

* * *

* * *