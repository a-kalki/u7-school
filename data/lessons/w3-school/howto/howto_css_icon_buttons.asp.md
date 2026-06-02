# How TO - Icon Buttons

* * *

Learn how to create icon buttons with CSS.

* * *

Icon buttons:

Icon buttons with text:

Home Menu Trash Close Folder

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_icon_buttons)

* * *

## How To Create Icon Buttons

##### Step 1) Add HTML:

Add an icon library, such as font awesome, and append icons to HTML buttons:

```javascript
<!-- Add icon library --><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"><!-- Add font awesome icons to buttons  --><p>Icon buttons:</p><button class="btn"><i class="fa fa-home"></i></button><button class="btn"><i class="fa fa-bars"></i></button><button class="btn"><i class="fa fa-trash"></i></button><button class="btn"><i class="fa fa-close"></i></button><button class="btn"><i class="fa fa-folder"></i></button><p>Icon buttons with text:</p><button class="btn"><i class="fa fa-home"></i> Home</button><button class="btn"><i class="fa fa-bars"></i> Menu</button><button class="btn"><i class="fa fa-trash"></i> Trash</button><button class="btn"><i class="fa fa-close"></i> Close</button><button class="btn"><i class="fa fa-folder"></i> Folder</button>
```

* * *

##### Step 2) Add CSS:

```javascript
/* Style buttons */.btn {  background-color: DodgerBlue; /* Blue background */  border: none; /* Remove borders */  color: white; /* White text */  padding: 12px 16px; /* Some padding */  font-size: 16px; /* Set a font size */  cursor: pointer; /* Mouse pointer on hover */}/* Darker background on mouse-over */.btn:hover {  background-color: RoyalBlue;}
```

**Tip:** Go to our [Icons Tutorial](https://www.w3schools.com/icons/default.asp) to learn more about icons.

Go to our [CSS Buttons Tutorial](https://www.w3schools.com/css/css3_buttons.asp) to learn more about how to style buttons.

* * *

* * *