# CSS Image Sprites

* * *

## CSS Image Sprites

An image sprite is a collection of various small images put into one larger image file, called a "sprite image".

A sprite image is typically arranged in a grid-like way, like this:

![Navigation Images](img_navsprites.gif)

A web page with multiple images takes a longer time to load, and generates multiple server requests.

So, instead of downloading each image separately, the browser downloads the single sprite image file, which will reduce the number of server requests and reduce bandwidth usage.

* * *

## CSS Image Sprites Example

The CSS key properties used for image sprites are:

*   `[background-image](https://www.w3schools.com/cssref/pr_background-image.php)`
*   `[background-position](https://www.w3schools.com/cssref/pr_background-position.php)`

Here, the CSS code specifies which part of the sprite image ("img\_navsprites.gif") to show for the different navigation items (home, next, and previous):

```javascript
<html><head><style>#home {  width: 46px;  height: 44px;  background-image: url(img_navsprites.gif);  background-position: 0 0; /* Top-left corner of the sprite */}#prev {  width: 43px;  height: 44px;  background-image: url('img_navsprites.gif');  background-position: -47px 0; /* 47px to the left of the sprite's top-left */}#next {  width: 43px;  height: 44px;  background-image: url('img_navsprites.gif');  background-position: -91px 0; /* 91px to the left of the sprite's top-left */}</style></head><body><img id="home" src="img_trans.gif" width="1" height="1"><img id="prev" src="img_trans.gif" width="1" height="1"><img id="next" src="img_trans.gif" width="1" height="1"></body></html>
```

#### Example explained:

*   `width`, `height` - Defines the width and height of each image-parts
*   `background-image: url(img_navsprites.gif);` - Defines the url of the image sprite
*   `background-position` - Shifts the background image within each element, to display only the desired portion of the sprite image
*   `<img id="home" src="img_trans.gif">` - Each image just start with a small transparent image because the src attribute cannot be empty (the displayed image will be the background image we specify in CSS)

* * *

## Image Sprites in a Navigation List

Here, we use the sprite image ("img\_navsprites.gif") inside a navigation list. We will use an HTML list (<ul> and <li>) for the navigation list:

```javascript
#navlist {  position: relative;}#navlist li {  margin: 0;  padding: 0;  list-style: none;  position: absolute;  top: 0;}#navlist li, #navlist a {  height: 44px;  display: block;}#home {  left: 0px;  width: 46px;  background: url('img_navsprites.gif') 0 0;}#prev {  left: 60px;  width: 43px;  background: url('img_navsprites.gif') -47px 0;}#next {  left: 120px;  width: 43px;  background: url('img_navsprites.gif') -91px 0;}
```

#### Example explained:

*   `#navlist {position:relative;}` - position is set to relative to allow absolute positioning inside it
*   `#navlist li` - set margin and padding to 0, remove bullets, and all <li> are absolute positioned
*   `#navlist li, #navlist a` - set the height of all images to 44px and display as block

Now position and style each navigation item:

*   `#home {left:0px;width:46px;}` - Positioned all the way to the left, and the width of the image is 46px
*   `#home {background:url(img_navsprites.gif) 0 0;}` - Defines the background image and its position (left 0px, top 0px)
*   `#prev {left:60px;}` - Positioned 60px to the right (#home width 46px + some extra space between items)
*   `#prev {background:url('img_navsprites.gif') -47px 0;}` - Defines the background image 47px to the right (#home width 46px + 1px line divider)
*   `#next {left:120px;}` - Positioned 120px to the right (start of #prev is 60px + #prev width 43px + extra space)
*   `#next {background:url('img_navsprites.gif') -91px 0;}` - Defines the background image 91px to the right (#home width 46px + 1px line divider + #prev width 43px + 1px line divider)

* * *

* * *

## Image Sprites - Hover Effect

Now we want to add a hover effect to our navigation list.

Our new image ("img\_navsprites\_hover.gif") contains three navigation images and three images to use for hover effects:

![Navigation Image with hover](img_navsprites_hover.gif)

Because this is one single image, and not six separate files, there will be no loading delay when a user hovers over the image.

We only add three lines of code to add the hover effect:

```javascript
#home a:hover {  background: url('img_navsprites_hover.gif') 0 -45px;}#prev a:hover {  background: url('img_navsprites_hover.gif') -47px -45px;}#next a:hover {  background: url('img_navsprites_hover.gif') -91px -45px;}
```

#### Example explained:

*   `#home a:hover {background: url('img_navsprites_hover.gif') 0 -45px;}` - For all three hover images we specify the same background position, only 45px further down