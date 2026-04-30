# How TO - Glowing Text

* * *

Learn how to create a glowing text with CSS.

* * *

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_glowing_text)

* * *

## How To Create a Glowing Text

Use the `text-shadow` property to create the neon light effect, and then use `animation` together with `keyframes` to add the repeatedly glowing effect:

```javascript
.glow {  font-size: 80px;  color: #fff;  text-align: center;  -webkit-animation: glow 1s ease-in-out infinite alternate;  -moz-animation: glow 1s ease-in-out infinite alternate;  animation: glow 1s ease-in-out infinite alternate;}@-webkit-keyframes glow {  from {    text-shadow: 0 0 10px #fff, 0 0 20px #fff, 0 0 30px #e60073, 0 0 40px #e60073, 0 0 50px #e60073, 0 0 60px #e60073, 0 0 70px #e60073;  }  to {    text-shadow: 0 0 20px #fff, 0 0 30px #ff4da6, 0 0 40px #ff4da6, 0 0 50px #ff4da6, 0 0 60px #ff4da6, 0 0 70px #ff4da6, 0 0 80px #ff4da6;  }}
```

* * *

* * *