# HTML Entities

* * *

Reserved characters in HTML must be replaced with entities:

*   < (less than) = **&lt;**
*   \> (greater than) = **&gt;**

* * *

## HTML Character Entities

Some characters are reserved in HTML.

If you use the less than (<) or greater than (>) signs in your HTML text, the browser might mix them with tags.

Entity names or entity numbers can be used to display reserved HTML characters.

Entity names look like this:

```javascript
&entity_name;
```

Entity numbers look like this:

```javascript
&#entity_number;
```

To display a less than sign (<) we must write: **&lt;** or **&#60;**

**Entity names** are easier to remember than entity numbers.

* * *

## Non-breaking Space

A commonly used HTML entity is the non-breaking space: **&nbsp;**

A non-breaking space is a space that will not break into a new line.

Two words separated by a non-breaking space will stick together (not break into a new line). This is handy when breaking the words might be disruptive.

Examples:

*   § 10
*   10 km/h
*   10 PM

Another common use of the non-breaking space is to prevent browsers from truncating spaces in HTML pages.

If you write 10 spaces in your text, the browser will remove 9 of them. To add real spaces to your text, you can use the **&nbsp;** character entity.

The non-breaking hyphen ([&#8209;](https://www.w3schools.com/charsets/ref_utf_punctuation.asp)) is used to define a hyphen character (‑) that does not break into a new line.

* * *

* * *

## Some Useful HTML Character Entities

Result

Description

Name

Number

non-breaking space

&nbsp;

&#160;

[Try it »](https://www.w3schools.com/html/tryit.asp?filename=tryhtml_ent_nbsp)

<

less than

&lt;

&#60;

[Try it »](https://www.w3schools.com/html/tryit.asp?filename=tryhtml_ent_lt)

\>

greater than

&gt;

&#62;

[Try it »](https://www.w3schools.com/html/tryit.asp?filename=tryhtml_ent_gt)

&

ampersand

&amp;

&#38;

[Try it »](https://www.w3schools.com/html/tryit.asp?filename=tryhtml_ent_amp)

"

double quotation mark

&quot;

&#34;

[Try it »](https://www.w3schools.com/html/tryit.asp?filename=tryhtml_ent_quot)

'

single quotation mark

&apos;

&#39;

[Try it »](https://www.w3schools.com/html/tryit.asp?filename=tryhtml_ent_apos)

¢

cent

&cent;

&#162;

[Try it »](https://www.w3schools.com/html/tryit.asp?filename=tryhtml_ent_cent)

£

pound

&pound;

&#163;

[Try it »](https://www.w3schools.com/html/tryit.asp?filename=tryhtml_ent_pound)

¥

yen

&yen;

&#165;

[Try it »](https://www.w3schools.com/html/tryit.asp?filename=tryhtml_ent_yen)

€

euro

&euro;

&#8364;

[Try it »](https://www.w3schools.com/html/tryit.asp?filename=tryhtml_ent_euro)

©

copyright

&copy;

&#169;

[Try it »](https://www.w3schools.com/html/tryit.asp?filename=tryhtml_ent_copy)

®

registered trademark

&reg;

&#174;

[Try it »](https://www.w3schools.com/html/tryit.asp?filename=tryhtml_ent_reg)

™

trademark

&trade;

&#8482;

[Try it »](https://www.w3schools.com/html/tryit.asp?filename=tryhtml_ent_trad)

## Note

Entity names are case sensitive.

* * *

## Combining Diacritical Marks

A diacritical mark is a "glyph" added to a letter.

Some diacritical marks, like grave (  ̀) and acute (  ́) are called accents.

Diacritical marks can be used in combination with alphanumeric characters to produce a character that is not present in the character set (encoding) used in the page.

Here are some examples:

Mark

Character

Construct

Result

 ̀

a

a&#768;

à

[Try it »](https://www.w3schools.com/html/tryit.asp?filename=tryhtml_ent_a768)

 ́

a

a&#769;

á

[Try it »](https://www.w3schools.com/html/tryit.asp?filename=tryhtml_ent_a769)

̂

a

a&#770;

â

[Try it »](https://www.w3schools.com/html/tryit.asp?filename=tryhtml_ent_a770)

 ̃

a

a&#771;

ã

[Try it »](https://www.w3schools.com/html/tryit.asp?filename=tryhtml_ent_a771)

 ̀

O

O&#768;

Ò

[Try it »](https://www.w3schools.com/html/tryit.asp?filename=tryhtml_ent_o768)

 ́

O

O&#769;

Ó

[Try it »](https://www.w3schools.com/html/tryit.asp?filename=tryhtml_ent_o769)

̂

O

O&#770;

Ô

[Try it »](https://www.w3schools.com/html/tryit.asp?filename=tryhtml_ent_o770)

 ̃

O

O&#771;

Õ

[Try it »](https://www.w3schools.com/html/tryit.asp?filename=tryhtml_ent_o771)

There are more examples in the next chapter.

* * *

* * *