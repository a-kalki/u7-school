# HTML - The Head Element

* * *

The HTML `<head>` element is a container for the following elements: `<title>`, `<style>`, `<meta>`, `<link>`, `<script>`, and `<base>`.

* * *

## The HTML <head> Element

The `<head>` element is a container for metadata (data about data) and is placed between the `<html>` tag and the `<body>` tag.

HTML metadata is data about the HTML document. Metadata is not displayed on the page.

Metadata typically define the document title, character set, styles, scripts, and other meta information.

* * *

## The HTML <title> Element

The `<title>` element defines the title of the document. The title must be text-only, and it is shown in the browser's title bar or in the page's tab.

The `<title>` element is required in HTML documents!

The content of a page title is very important for search engine optimization (SEO)! The page title is used by search engine algorithms to decide the order when listing pages in search results.

The `<title>` element:

*   defines a title in the browser toolbar
*   provides a title for the page when it is added to favorites
*   displays a title for the page in search engine-results

So, try to make the title as accurate and meaningful as possible!

A simple HTML document:

```javascript
<!DOCTYPE html><html><head>  <title>A Meaningful Page Title</title></head><body>The content of the document......</body></html>
```

* * *

## The HTML <style> Element

The `<style>` element is used to define style information for a single HTML page:

```javascript
<style>  body {background-color: powderblue;}  h1 {color: red;}  p {color: blue;}</style>
```

* * *

* * *

## The HTML <link> Element

The `<link>` element defines the relationship between the current document and an external resource.  
  
The `<link>` tag is most often used to link to external style sheets:

```javascript
<link rel="stylesheet" href="mystyle.css">
```

**Tip:** To learn all about CSS, visit our [CSS Tutorial](../css/default.asp.html).

* * *

## The HTML <meta> Element

The `<meta>` element is typically used to specify the character set, page description, keywords, author of the document, and viewport settings.

The metadata will not be displayed on the page, but is used by browsers (how to display content or reload page), by search engines (keywords), and other web services.

## Examples

**Define the character set used:**

<meta charset="UTF-8">

**Define keywords for search engines:**

<meta name="keywords" content="HTML, CSS, JavaScript">

**Define a description of your web page:**

<meta name="description" content="Free Web tutorials">

**Define the author of a page:**

<meta name="author" content="John Doe">

**Refresh document every 30 seconds:**

<meta http-equiv="refresh" content="30">

**Setting the viewport to make your website look good on all devices:**

<meta name="viewport" content="width=device-width, initial-scale=1.0">

Example of `<meta>` tags:

```javascript
<meta charset="UTF-8"><meta name="description" content="Free Web tutorials"><meta name="keywords" content="HTML, CSS, JavaScript"><meta name="author" content="John Doe">
```

* * *

## Setting The Viewport

The viewport is the user's visible area of a web page. It varies with the device - it will be smaller on a mobile phone than on a computer screen.

You should include the following `<meta>` element in all your web pages:

<meta name="viewport" content="width=device-width, initial-scale=1.0">

This gives the browser instructions on how to control the page's dimensions and scaling.

The `width=device-width` part sets the width of the page to follow the screen-width of the device (which will vary depending on the device).

The `initial-scale=1.0` part sets the initial zoom level when the page is first loaded by the browser.

Here is an example of a web page _without_ the viewport meta tag, and the same web page _with_ the viewport meta tag:

**Tip:** If you are browsing this page with a phone or a tablet, you can click on the two links below to see the difference.

  

[![](../css/img_viewport1.png)  
  
**Without the viewport meta tag**](https://www.w3schools.com/html/example_withoutviewport.htm)  
  

[![](../css/img_viewport2.png)  
  
**With the viewport meta tag**](https://www.w3schools.com/html/example_withviewport.htm)  
  

* * *

## The HTML <script> Element

The `<script>` element is used to define client-side JavaScripts.

The following JavaScript writes "Hello JavaScript!" into an HTML element with id="demo":

```javascript
<script>function myFunction() {  document.getElementById("demo").innerHTML = "Hello JavaScript!";}</script>
```

**Tip:** To learn all about JavaScript, visit our [JavaScript Tutorial](https://www.w3schools.com/js/default.asp).

* * *

## The HTML <base> Element

The `<base>` element specifies the base URL and/or target for all relative URLs in a page.

The `<base>` tag must have either an href or a target attribute present, or both.

There can only be one single `<base>` element in a document!

```javascript
<head><base href="https://www.w3schools.com/" target="_blank"></head><body><img src="images/stickman.gif" width="24" height="39" alt="Stickman"><a href="tags/tag_base.asp">HTML base Tag</a></body>
```

* * *

## Chapter Summary

*   The `<head>` element is a container for metadata (data about data)
*   The `<head>` element is placed between the `<html>` tag and the `<body>` tag
*   The `<title>` element is required and it defines the title of the document
*   The `<style>` element is used to define style information for a single document
*   The `<link>` tag is most often used to link to external style sheets
*   The `<meta>` element is typically used to specify the character set, page description, keywords, author of the document, and viewport settings
*   The `<script>` element is used to define client-side JavaScripts
*   The `<base>` element specifies the base URL and/or target for all relative URLs in a page

* * *

* * *

## HTML head Elements

Tag

Description

[<head>](https://www.w3schools.com/tags/tag_head.asp)

Defines information about the document

[<title>](https://www.w3schools.com/tags/tag_title.asp)

Defines the title of a document

[<base>](https://www.w3schools.com/tags/tag_base.asp)

Defines a default address or a default target for all links on a page

[<link>](https://www.w3schools.com/tags/tag_link.asp)

Defines the relationship between a document and an external resource

[<meta>](https://www.w3schools.com/tags/tag_meta.asp)

Defines metadata about an HTML document

[<script>](https://www.w3schools.com/tags/tag_script.asp)

Defines a client-side script

[<style>](https://www.w3schools.com/tags/tag_style.asp)

Defines style information for a document

For a complete list of all available HTML tags, visit our [HTML Tag Reference](https://www.w3schools.com/tags/default.asp).

* * *

## Video: HTML Head

  [![Tutorial on YouTube](images/yt_logo_rgb_dark.png)

 ![Tutorial on YouTube](images/21_html_head.png)](https://youtu.be/WeuVX5x2MJE&list=PLP9IO4UYNF0VdAajP_5pYG-jG2JRrG72s)

* * *