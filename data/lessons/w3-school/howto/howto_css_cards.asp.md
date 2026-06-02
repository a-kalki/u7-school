# How TO - Cards

* * *

Learn how to create a "card" with CSS.

* * *

![Avatar](img_avatar.png)

##### **John Doe**

Architect & Engineer

![Avatar](img_avatar2.png)

##### **Jane Doe**

Interior Designer

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_cards)

* * *

## How To Create a Card

##### Step 1) Add HTML:

```javascript
<div class="card">  <img src="img_avatar.png" alt="Avatar" style="width:100%">  <div class="container">    <h4><b>John Doe</b></h4>    <p>Architect & Engineer</p>  </div></div>
```

* * *

* * *

##### Step 2) Add CSS:

```javascript
.card {  /* Add shadows to create the "card" effect */  box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2);  transition: 0.3s;}/* On mouse-over, add a deeper shadow */.card:hover {  box-shadow: 0 8px 16px 0 rgba(0,0,0,0.2);}/* Add some padding inside the card container */.container {  padding: 2px 16px;}
```

##### With rounded corners:

```javascript
.card {  box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2);  transition: 0.3s;  border-radius: 5px; /* 5px rounded corners */}/* Add rounded corners to the top left and the top right corner of the image */img {  border-radius: 5px 5px 0 0;}
```

**Tip:** Go to our [CSS Shadow Effects Tutorial](https://www.w3schools.com/css/css3_shadows.asp) to learn more about shadows.