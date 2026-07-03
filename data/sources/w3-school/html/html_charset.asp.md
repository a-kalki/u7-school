# HTML Encoding (Character Sets)

## The HTML charset Attribute

To display an HTML page correctly, a web browser must know which character set to use.

The character set is specified in the `<meta>` tag:

```javascript
<meta charset="UTF-8">
```

The HTML specification encourages web developers to use the UTF-8 character set.

UTF-8 covers almost all of the characters and symbols in the world!

[![Unicode Web growth](https://www.w3schools.com/images/unicode_web.jpg)](https://commons.wikimedia.org/wiki/File:Unicode_Web_growth.svg "Chris55, CC BY-SA 4.0 <https://creativecommons.org/licenses/by-sa/4.0>, via Wikimedia Commons")

## Learn More:

[Full UTF-8 Reference](https://www.w3schools.com/charsets/default.asp)

* * *

## The ASCII Character Set

**ASCII was the first** character encoding standard for the web.

It defined **128 different latin characters** that could be used on the internet:

*   English letters (a-z and A-Z)
*   Numbers (0-9)
*   Some special characters: ! $ + - ( ) @ < > . # ?

* * *

## The ANSI Character Set

ANSI (Windows-1252) was the **first Windows character set**:

*   Identical to ASCII for the first 127 characters
*   Special characters from 128 to 159
*   Identical to UTF-8 from 160 to 255

```javascript
<meta charset="Windows-1252">
```

* * *

## The ISO-8859-1 Character Set

The default character set for **HTML 4 was ISO-8859-1**.

It **supported 256 characters**:

*   Identical to ASCII for the first 127 characters
*   Does not use the characters from 128 to 159
*   Identical to ANSI and UTF-8 from 160 to 255

```javascript
<meta http-equiv="Content-Type" content="text/html;charset=ISO-8859-1">
```

* * *

## The UTF-8 Character Set

*   Identical to ASCII for the values from 0 to 127
*   Does not use the characters from 128 to 159
*   Identical to ANSI and 8859-1 from 160 to 255
*   Continues from the value 256 to 10 000 characters

```javascript
<meta charset="UTF-8">
```

## Learn More:

[Full UTF-8 Reference](https://www.w3schools.com/charsets/default.asp)

* * *

* * *

## HTML UTF-8 Characters

[Basic Latin](https://www.w3schools.com/charsets/ref_utf_basic_latin.asp)

ABCD abcd 0123 ?#$%

[Latin Extended A](https://www.w3schools.com/charsets/ref_utf_latin_extended_a.asp)

ĀĂĄ ĆĈĊ ĒĔĖĘ

[Latin Extended B](https://www.w3schools.com/charsets/ref_utf_latin_extended_b.asp)

ƀƁƂƃƄƅ ƆƇƈ ƉƊƋƌ

[Latin Extended C](https://www.w3schools.com/charsets/ref_utf_latin_extended_c.asp)

ⱠⱡⱢ ⱣⱤ ⱥⱦ ⱧⱨⱩ

[Latin Extended D](https://www.w3schools.com/charsets/ref_utf_latin_extended_d.asp)

Ꜧꜧ ꜨꜩꜪꜫ ꜬꜭꜮꜯ

[Latin Extended E](https://www.w3schools.com/charsets/ref_utf_latin_extended_e.asp)

ꬰꬱ ꬲꬳꬴ ꬵꬶ ꬷꬸꬹ

  

[IPA Extentions](https://www.w3schools.com/charsets/ref_utf_latin_ipa.asp)

ɖɜɣ ɘɫɛ ɱɷɞ

[Spacing Modifiers](https://www.w3schools.com/charsets/ref_utf_modifiers.asp)

pʰ pʱ pʲ pʳ

[Diacritical Marks](https://www.w3schools.com/charsets/ref_utf_diacritical.asp)

àáâã èéêẽ òóôõ

[General Punctuation](https://www.w3schools.com/charsets/ref_utf_punctuation.asp)

‰ ‱ ⁒ ‼ ⁇ ⁈ ⁉ ⁎ ⁑ ⁂

[Super and Subscript](https://www.w3schools.com/charsets/ref_utf_supsub.asp)

C⁰ Cⁱ C⁴ C⁵ C₆ C₇ C₈

[Braille](https://www.w3schools.com/charsets/ref_utf_braille.asp)

⠓⠑⠇⠇⠕ ⠺⠕⠗⠇⠙

  

* * *