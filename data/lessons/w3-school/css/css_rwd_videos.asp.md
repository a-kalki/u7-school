# Responsive Web Design - Videos

* * *

## Using The width Property

If the `[width](https://www.w3schools.com/cssref/pr_dim_width.php)` property is set to 100%, the video player will be responsive and scale up and down:

```javascript
video {  width: 100%;  height: auto;}
```

Notice that in the example above, the video player can be scaled up to be larger than its original size. A better solution, in many cases, will be to use the `[max-width](https://www.w3schools.com/cssref/pr_dim_max-width.php)` property instead.

* * *

## Using The max-width Property

If the `[max-width](https://www.w3schools.com/cssref/pr_dim_max-width.php)` property is set to 100%, the video player will scale down if it has to, but never scale up to be larger than its original size:

```javascript
video {  max-width: 100%;  height: auto;}
```

* * *

## Add a Video to the Example Web Page

We want to add a video in our example web page. The video will be resized to always take up all the available space:

```javascript
video {  width: 100%;  height: auto;}
```

* * *

* * *

* * *