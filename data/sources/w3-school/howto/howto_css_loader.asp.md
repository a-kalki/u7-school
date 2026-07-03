# How TO - CSS Loader

* * *

Learn how to create a preloader with CSS.

* * *

## How To Create a Loader

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_loader)

* * *

##### Step 1) Add HTML:

```javascript
<div class="loader"></div>
```

##### Step 2) Add CSS:

```javascript
.loader {  border: 16px solid #f3f3f3; /* Light grey */  border-top: 16px solid #3498db; /* Blue */  border-radius: 50%;  width: 120px;  height: 120px;  animation: spin 2s linear infinite;}@keyframes spin {  0% { transform: rotate(0deg); }  100% { transform: rotate(360deg); }}
```

### Example Explained

The `border` property specifies the border size and the border color of the loader. The `border-radius` property transforms the loader into a circle.

The blue thing that spins around inside the border is specified with the `border-top` property. You can also include `border-bottom`, `border-left` and/or `border-right` if you want more "spinners" (see example below).

The size of the loader is specified with the `width` and `height` properties.

At last, we add an `animation` that makes the blue thing spin forever with a 2 second animation speed.

**Note:** You should also include a -webkit- prefix for browsers that do not support animation and transform properties. Click on the example to see how.

* * *

* * *

## Add more spinners

```javascript
.loader {  border-top: 16px solid blue;  border-bottom: 16px solid blue;}
```

```javascript
.loader {  border-top: 16px solid blue;  border-right: 16px solid green;  border-bottom: 16px solid red;}
```

```javascript
.loader {  border-top: 16px solid blue;  border-right: 16px solid green;  border-bottom: 16px solid red;  border-left: 16px solid pink;}
```

* * *

## Another Example

An example of how to place the loader in the middle of the page and show "page content" when loading is complete:

```javascript

```