# How TO - Fullscreen

* * *

Learn how to make a fullscreen window with JavaScript.

* * *

## Fullscreen Window

How to use JavaScript to view an element in fullscreen mode.

Click on the button to open the video in fullscreen mode:

  Your browser does not support the video tag.  
  
Open Video in Fullscreen

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_fullscreen)

* * *

## Fullscreen Video

To open an element in fullscreen, we use the `_element_.requestFullscreen()` method:

```javascript
<script>/* Get the element you want displayed in fullscreen mode (a video in this example): */var elem = document.getElementById("myvideo");/* When the openFullscreen() function is executed, open the video in fullscreen.Note that we must include prefixes for different browsers, as they don't support the requestFullscreen method yet */function openFullscreen() {  if (elem.requestFullscreen) {    elem.requestFullscreen();  } else if (elem.webkitRequestFullscreen) { /* Safari */    elem.webkitRequestFullscreen();  } else if (elem.msRequestFullscreen) { /* IE11 */    elem.msRequestFullscreen();  }}</script>
```

* * *

* * *

## Fullscreen Document

To open the whole page in fullscreen, use the `document.documentElement` instead of `document.getElementById("_element_")`. In this example, we also use a close function to close the fullscreen:

```javascript
<script>/* Get the documentElement (<html>) to display the page in fullscreen */var elem = document.documentElement;/* View in fullscreen */function openFullscreen() {  if (elem.requestFullscreen) {    elem.requestFullscreen();  } else if (elem.webkitRequestFullscreen) { /* Safari */    elem.webkitRequestFullscreen();  } else if (elem.msRequestFullscreen) { /* IE11 */    elem.msRequestFullscreen();  }}/* Close fullscreen */function closeFullscreen() {  if (document.exitFullscreen) {    document.exitFullscreen();  } else if (document.webkitExitFullscreen) { /* Safari */    document.webkitExitFullscreen();  } else if (document.msExitFullscreen) { /* IE11 */    document.msExitFullscreen();  }}</script>
```

You can also use CSS to style the page when it is in fullscreen mode:

```javascript
/* Safari */:-webkit-full-screen {  background-color: yellow;}/* IE11 */:-ms-fullscreen {  background-color: yellow;}/* Standard syntax */:fullscreen {  background-color: yellow;}
```

* * *

## Related Pages

HTML DOM Reference: [The requestFullscreen() method](https://www.w3schools.com/jsref/met_element_requestfullscreen.asp).

HTML DOM Reference: [The exitFullscreen() method](https://www.w3schools.com/jsref/met_element_exitfullscreen.asp).

HTML DOM Reference: [The documentElement property](https://www.w3schools.com/jsref/prop_document_documentelement.asp).