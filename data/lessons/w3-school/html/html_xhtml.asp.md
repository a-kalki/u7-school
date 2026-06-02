# HTML Versus XHTML

* * *

XHTML is a stricter, more XML-based version of HTML.

* * *

## What is XHTML?

*   XHTML stands for E**X**tensible **H**yper**T**ext **M**arkup **L**anguage
*   XHTML is a stricter, more XML-based version of HTML
*   XHTML is HTML defined as an XML application
*   XHTML is supported by all major browsers

* * *

## Why XHTML?

XML is a markup language where all documents must be marked up correctly (be "well-formed").

XHTML was developed to make HTML more extensible and flexible to work with other data formats (such as XML). In addition, browsers ignore errors in HTML pages, and try to display the website even if it has some errors in the markup. So XHTML comes with a much stricter error handling.

If you want to study XML, please read our [XML Tutorial](https://www.w3schools.com/xml/default.asp).

* * *

## The Most Important Differences from HTML

*   <!DOCTYPE> is **mandatory**
*   The xmlns attribute in <html> is **mandatory**
*   <html>, <head>, <title>, and <body> are **mandatory**
*   Elements must always be **properly nested**
*   Elements must always be **closed**
*   Elements must always be in **lowercase**
*   Attribute names must always be in **lowercase**
*   Attribute values must always be **quoted**
*   Attribute minimization is **forbidden**

* * *

* * *

## XHTML - <!DOCTYPE ....> Is Mandatory

An XHTML document must have an XHTML <!DOCTYPE> declaration.

The <html>, <head>, <title>, and <body> elements must also be present, and the xmlns attribute in <html> must specify the xml namespace for the document.

```javascript
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN""http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd"><html xmlns="http://www.w3.org/1999/xhtml"><head>  <title>Title of document</title></head><body>  some content here...</body></html>
```

* * *

## XHTML Elements Must be Properly Nested

In XHTML, elements must always be properly nested within each other, like this:

```javascript
<b><i>Some text</i></b>
```
```javascript
<b><i>Some text</b></i>
```

* * *

## XHTML Elements Must Always be Closed

In XHTML, elements must always be closed, like this:

```javascript
<p>This is a paragraph</p><p>This is another paragraph</p>
```
```javascript
<p>This is a paragraph<p>This is another paragraph
```

* * *

## XHTML Empty Elements Must Always be Closed

In XHTML, empty elements must always be closed, like this:

```javascript
A break: <br />A horizontal rule: <hr />An image: <img src="happy.gif" alt="Happy face" />
```
```javascript
A break: <br>A horizontal rule: <hr>An image: <img src="happy.gif" alt="Happy face">
```

* * *

## XHTML Elements Must be in Lowercase

In XHTML, element names must always be in lowercase, like this:

```javascript
<body><p>This is a paragraph</p></body>
```
```javascript
<BODY><P>This is a paragraph</P></BODY>
```

* * *

## XHTML Attribute Names Must be in Lowercase

In XHTML, attribute names must always be in lowercase, like this:

```javascript
<a href="https://www.w3schools.com/html/">Visit our HTML tutorial</a>
```
```javascript
<a HREF="https://www.w3schools.com/html/">Visit our HTML tutorial</a>
```

* * *

## XHTML Attribute Values Must be Quoted

In XHTML, attribute values must always be quoted, like this:

```javascript
<a href="https://www.w3schools.com/html/">Visit our HTML tutorial</a>
```
```javascript
<a href=https://www.w3schools.com/html/>Visit our HTML tutorial</a>
```

* * *

## XHTML Attribute Minimization is Forbidden

In XHTML, attribute minimization is forbidden:

```javascript
<input type="checkbox" name="vehicle" value="car" checked="checked" /><input type="text" name="lastname" disabled="disabled" />
```
```javascript
<input type="checkbox" name="vehicle" value="car" checked /><input type="text" name="lastname" disabled />
```

* * *

## Validate HTML With The W3C Validator

Put your web address in the box below: