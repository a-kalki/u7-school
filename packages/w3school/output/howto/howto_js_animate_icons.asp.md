# How TO - Animate Icons

* * *

Learn how to use icons to make an animated effect.

* * *

## Battery Charging

  
[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_animate_charging)

* * *

##### Step 1) Add HTML:

```javascript
<div id="charging" class="fa"></div>
```

##### Step 2) Include the Font Awesome Icon Library:

```javascript
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
```

Read more about Font Awesome in our [Font Awesome Tutorial](https://www.w3schools.com/icons/fontawesome_icons_intro.asp).

##### Step 3) Add a JavaScript:

```javascript
<script>function chargebattery() {  var a;  a = document.getElementById("charging");  a.innerHTML = "&#xf244;";  setTimeout(function () {    a.innerHTML = "&#xf243;";  }, 1000);  setTimeout(function () {    a.innerHTML = "&#xf242;";  }, 2000);  setTimeout(function () {    a.innerHTML = "&#xf241;";  }, 3000);  setTimeout(function () {    a.innerHTML = "&#xf240;";  }, 4000);}chargebattery();setInterval(chargebattery, 5000);</script>
```

### Example Explained

The example gives an impression of a battery getting charged, but instead it is five different icons being displayed.

A function called `chargebattery()` does all the replacing and displaying of icons.

The function starts by displaying an empty battery icon:

__

After one second, the icon is replaced by a new icon:

__

The icon is replaced by a new icon each second, until "the battery is fully charged":

__  
__  
__

This process is repeated every 5 second, making it seems like the battery is charging.

* * *

* * *

## More Animated Icons

```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
  

* * *