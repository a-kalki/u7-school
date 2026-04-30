# How TO - Loading Buttons

* * *

Learn how to create loading buttons with CSS.

* * *

Loading Loading Loading  

* * *

## How To Style Loading Buttons

##### Step 1) Add HTML:

Add an icon library, such as Font Awesome, and append icons to HTML buttons:

```javascript
<!-- Add icon library --><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"><!-- Add font awesome icons to buttons (note that the fa-spin class rotates the icon) --><button class="buttonload">  <i class="fa fa-spinner fa-spin"></i>Loading</button><button class="buttonload">  <i class="fa fa-circle-o-notch fa-spin"></i>Loading</button><button class="buttonload">  <i class="fa fa-refresh fa-spin"></i>Loading</button>
```

* * *

##### Step 2) Add CSS:

```javascript
/* Style buttons */.buttonload {  background-color: #04AA6D; /* Green background */  border: none; /* Remove borders */  color: white; /* White text */  padding: 12px 16px; /* Some padding */  font-size: 16px /* Set a font size */}
```

**Tip:** Go to our [Icons Tutorial](https://www.w3schools.com/icons/default.asp) to learn more about icons.

**Tip:** Go to our [How To - CSS Loader](howto_css_loader.asp.html) to learn how to create a loader with CSS (without an icon library).

Go to our [CSS Buttons Tutorial](https://www.w3schools.com/css/css3_buttons.asp) to learn more about how to style buttons.

* * *

* * *