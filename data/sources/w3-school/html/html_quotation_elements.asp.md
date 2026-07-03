# HTML Quotation and Citation Elements

* * *

In this chapter we will go through the `<blockquote>`,`<q>`, `<abbr>`, `<address>`, `<cite>`, and `<bdo>` HTML elements.

* * *

```javascript

```

* * *

## HTML <blockquote> for Quotations

The HTML `<blockquote>` element defines a section that is quoted from another source.

Browsers usually indent `<blockquote>` elements.

```javascript
<p>Here is a quote from WWF's website:</p><blockquote cite="http://www.worldwildlife.org/who/index.html">For 60 years, WWF has worked to help people and nature thrive. As the world's leading conservation organization, WWF works in nearly 100 countries. At every level, we collaborate with people around the world to develop and deliver innovative solutions that protect communities, wildlife, and the places in which they live.</blockquote>
```

* * *

## HTML <q> for Short Quotations

The HTML `<q>` tag defines a short quotation.

Browsers normally insert quotation marks around the quotation.

```javascript
<p>WWF's goal is to: <q>Build a future where people live in harmony with nature.</q></p>
```

* * *

* * *

## HTML <abbr> for Abbreviations

The HTML `<abbr>` tag defines an abbreviation or an acronym, like "HTML", "CSS", "Mr.", "Dr.", "ASAP", "ATM".

Marking abbreviations can give useful information to browsers, translation systems and search-engines.

**Tip:** Use the global title attribute to show the description for the abbreviation/acronym when you mouse over the element. 

```javascript
<p>The <abbr title="World Health Organization">WHO</abbr> was founded in 1948.</p>
```

* * *

## HTML <address> for Contact Information

The HTML `<address>` tag defines the contact information for the author/owner of a document or an article.

The contact information can be an email address, URL, physical address, phone number, social media handle, etc.

The text in the `<address>` element usually renders in _italic,_ and browsers will always add a line break before and after the `<address>` element.

```javascript
<address>Written by John Doe.<br>Visit us at:<br>Example.com<br>Box 564, Disneyland<br>USA</address>
```

* * *

## HTML <cite> for Work Title

The HTML `<cite>` tag defines the title of a creative work (e.g. a book, a poem, a song, a movie, a painting, a sculpture, etc.).

**Note:** A person's name is not the title of a work.

The text in the `<cite>` element usually renders in _italic_.

```javascript
<p><cite>The Scream</cite> by Edvard Munch. Painted in 1893.</p>
```

* * *

## HTML <bdo> for Bi-Directional Override

BDO stands for Bi-Directional Override.

The HTML `<bdo>` tag is used to override the current text direction:

```javascript
<bdo dir="rtl">This text will be written from right to left</bdo>
```

* * *

* * *

## HTML Quotation and Citation Elements

Tag

Description

[<abbr>](https://www.w3schools.com/tags/tag_abbr.asp)

Defines an abbreviation or acronym

[<address>](https://www.w3schools.com/tags/tag_address.asp)

Defines contact information for the author/owner of a document

[<bdo>](https://www.w3schools.com/tags/tag_bdo.asp)

Defines the text direction

[<blockquote>](https://www.w3schools.com/tags/tag_blockquote.asp)

Defines a section that is quoted from another source

[<cite>](https://www.w3schools.com/tags/tag_cite.asp)

Defines the title of a work

[<q>](https://www.w3schools.com/tags/tag_q.asp)

Defines a short inline quotation

For a complete list of all available HTML tags, visit our [HTML Tag Reference](https://www.w3schools.com/tags/default.asp).