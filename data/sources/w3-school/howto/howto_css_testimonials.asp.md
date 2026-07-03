# How TO - Testimonials

* * *

Learn how to create responsive testimonials with CSS.

* * *

A testimonial is often used to let people know what other people think of you or your product.

![Avatar](https://www.w3schools.com/w3images/bandmember.jpg)

Chris Fox. CEO at Mighty Schools.

John Doe saved us from a web disaster.

![Avatar](https://www.w3schools.com/w3images/avatar_g2.jpg)

Rebecca Flex. CEO at Company.

No one is better than John Doe.

![Avatar](img_avatar2.png)

Julia Roberts. Actor.

Simply love Johnny Boy.

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_testimonials)

* * *

## How To Style Testimonials

##### Step 1) Add HTML:

```javascript
<div class="container">  <img src="bandmember.jpg" alt="Avatar" style="width:90px">  <p><span>Chris Fox.</span> CEO at Mighty Schools.</p>  <p>John Doe saved us from a web disaster.</p></div><div class="container">  <img src="avatar_g2.jpg" alt="Avatar" style="width:90px">  <p><span >Rebecca Flex.</span> CEO at Company.</p>  <p>No one is better than John Doe.</p></div>
```

* * *

* * *

##### Step 2) Add CSS:

```javascript
/* Style the container with a rounded border, grey background and some padding and margin */.container {  border: 2px solid #ccc;  background-color: #eee;  border-radius: 5px;  padding: 16px;  margin: 16px 0;}/* Clear floats after containers */.container::after {  content: "";  clear: both;  display: table;}/* Float images inside the container to the left. Add a right margin, and style the image as a circle */.container img {  float: left;  margin-right: 20px;  border-radius: 50%;}/* Increase the font-size of a span element */.container span {  font-size: 20px;  margin-right: 15px;}/* Add media queries for responsiveness. This will center both the text and the image inside the container */@media (max-width: 500px) {  .container {    text-align: center;  }  .container img {    margin: auto;    float: none;    display: block;  }}
```