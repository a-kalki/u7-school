# HTML Accessibility

* * *

## HTML Accessibility

Always write HTML code with accessibility in mind!

Provide the user a good way to navigate and interact with your site. Make your HTML code as **semantic** as possible.

* * *

## Semantic HTML

Semantic HTML means using correct HTML elements for their correct purpose as much as possible. Semantic elements are elements with a meaning; if you need a button, use the `<button>` element (and not a `<div>` element).

```javascript
<button>Report an Error</button>
```

```javascript
<div>Report an Error</div>
```

Semantic HTML gives context to screen readers, which read the contents of a page out loud.

With the button example in mind:

*   buttons have more suitable styling by default
*   a screen reader identifies it as a button
*   focusable
*   clickable

A button is also accessible for people relying on keyboard-only navigation; it can be clickable with both mouse and keys, and it can be tabbed between (using the tab key on the keyboard).

Examples of **non-semantic** elements: `<div>` and `<span>` - Tells nothing about its content.

Examples of **semantic** elements: `<form>`, `<table>`, and `<article>` - Clearly defines its content.

* * *

## Headings Are Important

Headings are defined with the `<h1>` to `<h6>` tags:

```javascript
<h1>Heading 1</h1><h2>Heading 2</h2><h3>Heading 3</h3><h4>Heading 4</h4><h5>Heading 5</h5><h6>Heading 6</h6>
```

Search engines use the headings to index the structure and content of your web pages.

Users skim your pages by its headings. It is important to use headings to show the document structure and the relationships between different sections.

Screen readers also use headings as a navigational tool. The different types of heading specify the outline of the page. `<h1>` headings should be used for main headings, followed by `<h2>` headings, then the less important `<h3>`, and so on.

**Note:** Use HTML headings for headings only. Don't use headings to make text **BIG** or **bold**.

* * *

* * *

## Alternative Text

The `alt` attribute provides an alternate text for an image, if the user for some reason cannot view it (because of slow connection, an error in the `src` attribute, or if the user uses a screen reader).

The value of the `alt` attribute should describe the image:

```javascript
<img src="img_chania.jpg" alt="A narrow city street with flowers in Chania">
```

If a browser cannot find an image, it will display the value of the `alt` attribute:

```javascript
<img src="wrongname.gif" alt="A narrow city street with flowers in Chania">
```

* * *

## Declare the Language

You should always include the `lang` attribute inside the `<html>` tag, to declare the language of the Web page. This is meant to assist search engines and browsers.

The following example specifies English as the language:

```javascript
<!DOCTYPE html><html lang="en"><body>...</body></html>
```

* * *

## Use Clear Language

Always use a clear language, that is easy to understand. Also try to avoid characters that cannot be read clearly by a screen reader. For example:

*   Keep sentences as short as possible
*   Avoid dashes. Instead of writing 1-3, write 1 to 3
*   Avoid abbreviations. Instead of writing Feb, write February
*   Avoid slang words

* * *

## Create Good Link Text

A link text should explain clearly what information the reader will get by clicking on that link.

Examples of good and bad links:

```javascript
Find out more about the HTML languageRead more about how to eat healthyBuy tickets to Mars here
```

```javascript
Click hereRead more..Buy tickets to Mars here
```

**Note:** This page is an introduction in web accessibility. Visit our [Accessibility Tutorial](https://www.w3schools.com/accessibility/) for more details.