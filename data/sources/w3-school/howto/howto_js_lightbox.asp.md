# How TO - Lightbox

* * *

Learn how to create a modal image gallery (lightbox) with CSS and JavaScript.

* * *

## Lightbox (Modal Image Gallery)

Click on one of the images to open the lightbox:

![](img_nature.jpg)

![](img_snow.jpg)

![](img_mountains.jpg)

![](img_lights.jpg)

×

1 / 4

![](img_nature_wide.jpg)

2 / 4

![](img_snow_wide.jpg)

3 / 4

![](img_mountains_wide.jpg)

4 / 4

![](img_lights_wide.jpg)

❮ ❯

![Nature and sunrise](img_nature_wide.jpg)

![Snow](img_snow_wide.jpg)

![Mountains and fjords](img_mountains_wide.jpg)

![Northern Lights](img_lights_wide.jpg)

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_js_lightbox)

* * *

## Create A Lightbox

The following example combines code from [Modals](howto_css_modals.asp.html) and [Slideshows](howto_js_slideshow.asp.html) to create the lightbox.

##### Step 1) Add HTML:

```javascript
<!-- Images used to open the lightbox --><div class="row">  <div class="column">    <img src="img1.jpg" onclick="openModal();currentSlide(1)" class="hover-shadow">  </div>  <div class="column">    <img src="img2.jpg" onclick="openModal();currentSlide(2)" class="hover-shadow">  </div>  <div class="column">    <img src="img3.jpg" onclick="openModal();currentSlide(3)" class="hover-shadow">  </div>  <div class="column">    <img src="img4.jpg" onclick="openModal();currentSlide(4)" class="hover-shadow">  </div></div><!-- The Modal/Lightbox --><div id="myModal" class="modal">  <span class="close cursor" onclick="closeModal()">&times;</span>  <div class="modal-content">    <div class="mySlides">      <div class="numbertext">1 / 4</div>      <img src="img1_wide.jpg" style="width:100%">    </div>    <div class="mySlides">      <div class="numbertext">2 / 4</div>      <img src="img2_wide.jpg" style="width:100%">    </div>    <div class="mySlides">      <div class="numbertext">3 / 4</div>      <img src="img3_wide.jpg" style="width:100%">    </div>    <div class="mySlides">      <div class="numbertext">4 / 4</div>      <img src="img4_wide.jpg" style="width:100%">    </div>    <!-- Next/previous controls -->    <a class="prev" onclick="plusSlides(-1)">&#10094;</a>    <a class="next" onclick="plusSlides(1)">&#10095;</a>    <!-- Caption text -->    <div class="caption-container">      <p id="caption"></p>    </div>    <!-- Thumbnail image controls -->    <div class="column">      <img class="demo" src="img1.jpg" onclick="currentSlide(1)" alt="Nature">    </div>    <div class="column">      <img class="demo" src="img2.jpg" onclick="currentSlide(2)" alt="Snow">    </div>    <div class="column">      <img class="demo" src="img3.jpg" onclick="currentSlide(3)" alt="Mountains">    </div>    <div class="column">      <img class="demo" src="img4.jpg" onclick="currentSlide(4)" alt="Lights">    </div>  </div></div>
```

* * *

##### Step 2) Add CSS:

```javascript
.row > .column {  padding: 0 8px;}.row:after {  content: "";  display: table;  clear: both;}/* Create four equal columns that floats next to eachother */.column {  float: left;  width: 25%;}/* The Modal (background) */.modal {  display: none;  position: fixed;  z-index: 1;  padding-top: 100px;  left: 0;  top: 0;  width: 100%;  height: 100%;  overflow: auto;  background-color: black;}/* Modal Content */.modal-content {  position: relative;  background-color: #fefefe;  margin: auto;  padding: 0;  width: 90%;  max-width: 1200px;}/* The Close Button */.close {  color: white;  position: absolute;  top: 10px;  right: 25px;  font-size: 35px;  font-weight: bold;}.close:hover,.close:focus {  color: #999;  text-decoration: none;  cursor: pointer;}/* Hide the slides by default */.mySlides {  display: none;}/* Next & previous buttons */.prev,.next {  cursor: pointer;  position: absolute;  top: 50%;  width: auto;  padding: 16px;  margin-top: -50px;  color: white;  font-weight: bold;  font-size: 20px;  transition: 0.6s ease;  border-radius: 0 3px 3px 0;  user-select: none;  -webkit-user-select: none;}/* Position the "next button" to the right */.next {  right: 0;  border-radius: 3px 0 0 3px;}/* On hover, add a black background color with a little bit see-through */.prev:hover,.next:hover {  background-color: rgba(0, 0, 0, 0.8);}/* Number text (1/3 etc) */.numbertext {  color: #f2f2f2;  font-size: 12px;  padding: 8px 12px;  position: absolute;  top: 0;}/* Caption text */.caption-container {  text-align: center;  background-color: black;  padding: 2px 16px;  color: white;}img.demo {  opacity: 0.6;}.active,.demo:hover {  opacity: 1;}img.hover-shadow {  transition: 0.3s;}.hover-shadow:hover {  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);}
```

* * *

* * *

##### Step 3) Add JavaScript:

```javascript
<script>// Open the Modalfunction openModal() {  document.getElementById("myModal").style.display = "block";}// Close the Modalfunction closeModal() {  document.getElementById("myModal").style.display = "none";}var slideIndex = 1;showSlides(slideIndex);// Next/previous controlsfunction plusSlides(n) {  showSlides(slideIndex += n);}// Thumbnail image controlsfunction currentSlide(n) {  showSlides(slideIndex = n);}function showSlides(n) {  var i;  var slides = document.getElementsByClassName("mySlides");  var dots = document.getElementsByClassName("demo");  var captionText = document.getElementById("caption");  if (n > slides.length) {slideIndex = 1}  if (n < 1) {slideIndex = slides.length}  for (i = 0; i < slides.length; i++) {    slides[i].style.display = "none";  }  for (i = 0; i < dots.length; i++) {    dots[i].className = dots[i].className.replace(" active", "");  }  slides[slideIndex-1].style.display = "block";  dots[slideIndex-1].className += " active";  captionText.innerHTML = dots[slideIndex-1].alt;}</script>
```

**Tip:** Also check out [Modals](howto_css_modals.asp.html) and [Slideshows](howto_js_slideshow.asp.html).