# How TO - Social Media Buttons

* * *

Learn how to style social media buttons with CSS.

* * *

[](javascript:void\(0\))[](javascript:void\(0\))[](javascript:void\(0\))[](javascript:void\(0\))[](javascript:void\(0\))[](javascript:void\(0\))[](javascript:void\(0\))[](javascript:void\(0\))[](javascript:void\(0\))[](javascript:void\(0\))[](javascript:void\(0\))[](javascript:void\(0\))[](javascript:void\(0\))[](javascript:void\(0\))[](javascript:void\(0\))[](javascript:void\(0\))[](javascript:void\(0\))[](javascript:void\(0\))[](javascript:void\(0\))[](javascript:void\(0\))

  

[](javascript:void\(0\))[](javascript:void\(0\))[](javascript:void\(0\))[](javascript:void\(0\))[](javascript:void\(0\))[](javascript:void\(0\))[](javascript:void\(0\))[](javascript:void\(0\))[](javascript:void\(0\))[](javascript:void\(0\))[](javascript:void\(0\))[](javascript:void\(0\))[](javascript:void\(0\))[](javascript:void\(0\))[](javascript:void\(0\))[](javascript:void\(0\))[](javascript:void\(0\))[](javascript:void\(0\))[](javascript:void\(0\))[](javascript:void\(0\))

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_social_media_buttons)

* * *

## How To Style Social Media Buttons

##### Step 1) Add HTML:

```javascript
<!-- Add icon library --><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"><!-- Add font awesome icons --><a href="#" class="fa fa-facebook"></a><a href="#" class="fa fa-twitter"></a>...
```

* * *

##### Step 2) Add CSS:

```javascript
/* Style all font awesome icons */.fa {  padding: 20px;  font-size: 30px;  width: 50px;  text-align: center;  text-decoration: none;}/* Add a hover effect if you want */.fa:hover {  opacity: 0.7;}/* Set a specific color for each brand *//* Facebook */.fa-facebook {  background: #3B5998;  color: white;}/* Twitter */.fa-twitter {  background: #55ACEE;  color: white;}
```

* * *

* * *

## Round Buttons

**Tip:** Add `border-radius:50%` to create round buttons, and reduce the `width`:

```javascript
.fa {  padding: 20px;  font-size: 30px;  width: 30px;  text-align: center;  text-decoration: none;  border-radius: 50%;}
```

**Tip:** Go to our [Icons Tutorial](https://www.w3schools.com/icons/default.asp) to learn more about icons.

Go to our [CSS Buttons Tutorial](https://www.w3schools.com/css/css3_buttons.asp) to learn more about how to style buttons.