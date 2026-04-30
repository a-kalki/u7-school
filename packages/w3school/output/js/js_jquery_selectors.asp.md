# JavaScript / jQuery DOM Selectors

* * *

## jQuery vs JavaScript

[jQuery](https://www.w3schools.com/jquery/default.asp) was created in 2006 by John Resig. It was designed to handle Browser Incompatibilities and to simplify HTML DOM Manipulation, Event Handling, Animations, and Ajax.

For more than 10 years, jQuery has been the most popular JavaScript library in the world.

However, after JavaScript [Version 5](js_es5.asp.html) (2009), most of the jQuery utilities can be solved with a few lines of standard JavaScript:

* * *

## Finding HTML Element by Id

Return the element with id="id01":

```javascript
myElement = $("#id01");
```
```javascript
myElement = document.getElementById("id01");
```

* * *

## Finding HTML Elements by Tag Name

Return all <p> elements:

```javascript
myElements = $("p");
```
```javascript
myElements = document.getElementsByTagName("p");
```

* * *

* * *

## Finding HTML Elements by Class Name

Return all elements with class="intro".

```javascript
myElements = $(".intro");
```
```javascript
myElements = document.getElementsByClassName("intro");
```

* * *

## Finding HTML Elements by CSS Selectors

Return a list of all <p> elements with class="intro".

```javascript
myElements = $("p.intro");
```
```javascript
myElements = document.querySelectorAll("p.intro");
```