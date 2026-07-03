# How TO - Sticky Social Bar

* * *

Learn how to create a fixed/sticky social media icon bar with CSS.

* * *

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_sticky_social_bar)

* * *

## How To Create a Fixed Social Bar

##### Step 1) Add HTML:

```javascript
<!-- Load font awesome icons --><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"><!-- The social media icon bar --><div class="icon-bar">  <a href="#" class="facebook"><i class="fa fa-facebook"></i></a>  <a href="#" class="twitter"><i class="fa fa-twitter"></i></a>  <a href="#" class="google"><i class="fa fa-google"></i></a>  <a href="#" class="linkedin"><i class="fa fa-linkedin"></i></a>  <a href="#" class="youtube"><i class="fa fa-youtube"></i></a></div>
```

* * *

##### Step 2) Add CSS:

```javascript
/* Fixed/sticky icon bar (vertically aligned 50% from the top of the screen) */.icon-bar {  position: fixed;  top: 50%;  transform: translateY(-50%);}/* Style the icon bar links */.icon-bar a {  display: block;  text-align: center;  padding: 16px;  transition: all 0.3s ease;  color: white;  font-size: 20px;}/* Style the social media icons with color, if you want */.icon-bar a:hover {  background-color: #000;}.facebook {  background: #3B5998;  color: white;}.twitter {  background: #55ACEE;  color: white;}.google {  background: #dd4b39;  color: white;}.linkedin {  background: #007bb5;  color: white;}.youtube {  background: #bb0000;  color: white;}
```

**Tip:** [Go to our CSS Position Tutorial](https://www.w3schools.com/css/css_positioning.asp) to learn more about positioning.

* * *

* * *