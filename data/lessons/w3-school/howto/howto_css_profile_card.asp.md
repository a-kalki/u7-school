# How TO - Profile Card

* * *

Learn how to create a profile card with CSS.

* * *

![Jane](https://www.w3schools.com/w3images/team2.jpg)

# John Doe

CEO & Founder, Example

Harvard University

[](javascript:void\(0\))[](javascript:void\(0\))[](javascript:void\(0\))[](javascript:void\(0\))

Contact

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_profile_card)

* * *

## How To Create a Profile Card

##### Step 1) Add HTML:

```javascript
<!-- Add icon library --><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"><div class="card">  <img src="img.jpg" alt="John" style="width:100%">  <h1>John Doe</h1>  <p class="title">CEO & Founder, Example</p>  <p>Harvard University</p>  <a href="#"><i class="fa fa-dribbble"></i></a>  <a href="#"><i class="fa fa-twitter"></i></a>  <a href="#"><i class="fa fa-linkedin"></i></a>  <a href="#"><i class="fa fa-facebook"></i></a>  <p><button>Contact</button></p></div>
```

* * *

* * *

##### Step 2) Add CSS:

```javascript
.card {  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);  max-width: 300px;  margin: auto;  text-align: center;}.title {  color: grey;  font-size: 18px;}button {  border: none;  outline: 0;  display: inline-block;  padding: 8px;  color: white;  background-color: #000;  text-align: center;  cursor: pointer;  width: 100%;  font-size: 18px;}a {  text-decoration: none;  font-size: 22px;  color: black;}button:hover, a:hover {  opacity: 0.7;}
```