# How TO - Make an HTML Book

* * *

Learn how to create an HTML Book that will work on all devices, PC, laptop, tablet, and phone.

* * *

## First, Create a Basic HTML Page

HTML is the standard markup language for creating websites and CSS is the language that describes the style of an HTML document.

We will combine HTML and CSS to create a basic HTML Book.

First start with an HTML skeleton:

```javascript
<!DOCTYPE html><html><head><title>My Book</title><meta charset="UTF-8"></head><body><h1>My Book</h1><p>HTML book created by me.</p></body></html>
```

### Example Explained

*   `<!DOCTYPE html>` The document type is HTML
*   `<html> </html>` The beginning and the end of the document
*   `<head> </head>` The beginning and the end of document information
*   `<title>` The title of the book ("My Book")
*   `<meta charset="UTF-8">` The character set used (UTF-8)
*   `<body> </body>` The beginning and the end of the visible content
*   `<h1> </h1>` The beginning and the end of a heading
*   `<p> </p>` The beginning and the end of a paragraph

The code explained above are HTML tags.

HTML tags are used to define the content of an HTML dokument.

The tags start with a `<` (less-than sign) and end witn a `>` (greater-than sign).

This way `<p>` and `</p>` are used to mark up the beginning and the end of a paragraph.

**Note:** If you want to study HTML in detail, please read [our HTML Tutorial](https://www.w3schools.com/html/default.asp).

To be fully correct, there should be a language attribute added to the `<html>` tag to define the language used in the book:

```javascript
<html lang="en">
```

Adding the following meta information will make your book display correctly on all devices, PC, laptop, tablet, and phone:

```javascript
<meta name="viewport" content="width=device-width, initial-scale=1">
```
```javascript
<!DOCTYPE html><html lang="en"><head><title>My Book</title><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><h1>My Book</h1><p>HTML book created by me.</p></body></html>
```

* * *

## Create a Table of Content

Inside the `<body> </body>` elements, add a table of content:

```javascript
<body><h1>Philosopy</h1><h3>Table of Contents</h3><p>1. Metaphysics</p><p>2. Epistemology</p><p>3. Logics</p><p>4. Ethics</p><p>5. Aesthetics</p></body>
```

* * *

## Add a Some Style

Add a styleheet to your book:

```javascript
<link rel="stylesheet" href="https://www.w3schools.com/w3css/4/w3.css">
```

**Note:** If you want to study CSS in detail, please read [Our CSS Tutorial](https://www.w3schools.com/css/default.asp).

* * *

* * *

## Create an HTML page for Chapter 1

```javascript
<body class="w3-content"><div class="w3-container"><h1>1. Metaphysics</h1><h3>The nature of reality.</h3><p>Metaphysics is the part of philosophy that studies the nature of reality.</p><p>When we look around, we can see:</p><ul><li>Nature</li><li>Animals</li><li>People</li><li>Houses</li><li>Cars</li><li>and much more</li></ul><p>Is this Virtual Reality real?</p><p>In Metaphysics, the questions is:</p><ul><li>What is real?</li><li>Is what we see real?</li><li>Is there more than we see?</li><li>Is there more than we sence?</li><li>Is there something else?</li><li>Is there something more?</li><li>Is there another dimension?</li></ul></div></body>
```

* * *

## Add a Link to Chapter 1

```javascript
<body><h1>Philosopy</h1><h3>Table of Contents</h3><p><a href="philosophy_chapter1.htm">1. Metaphysics</a></p><p>2. Epistemology</p><p>3. Logics</p><p>4. Ethics</p><p>5. Aesthetics</p></body>
```

In the example above, we named the first chapter of the book:

"**philosophy\_chapter1.htm**".

The name to use is up to you. Maybe it should be called "Metaphysics".

Anyway, continue as above and create the other chapters:

"philosophy\_chaper2.htm"  
"philosophy\_chaper3.htm"  
"philosophy\_chaper4.htm"  
"philosophy\_chaper5.htm"  

* * *

## Add a Link to Each Chapter

```javascript
<body><h1>Philosopy</h1><h3>Table of Contents</h3><p><a href="philosophy_chapter1.htm">1. Metaphysics</a></p><p><a href="philosophy_chapter2.htm">2. Epistemology</a></p><p><a href="philosophy_chapter3.htm">3. Logics</a></p><p><a href="philosophy_chapter5.htm">4. Ethics</a></p><p><a href="philosophy_chapter4.htm">5. Aesthetics</a></p></body>
```