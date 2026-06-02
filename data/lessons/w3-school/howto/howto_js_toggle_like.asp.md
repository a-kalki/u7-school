# How TO - Toggle Like and Dislike

* * *

Toggle between a like/dislike button with CSS and JavaScript.

* * *

Click on the icon to toggle between thumbs-up and thumbs-down (like/dislike):

* * *

## Toggle (Hide/Show) an Element

##### Step 1) Add HTML:

```javascript
<!-- Add icon library --><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"><!-- Use an element to toggle between a like/dislike icon --><i onclick="myFunction(this)" class="fa fa-thumbs-up"></i>
```

* * *

##### Step 2) Add JavaScript:

```javascript
function myFunction(x) {  x.classList.toggle("fa-thumbs-down");}
```

* * *

* * *