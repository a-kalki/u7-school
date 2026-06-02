# CSS Custom Fonts

* * *

## The CSS @font-face Rule

The CSS `[@font-face](https://www.w3schools.com/cssref/atrule_font-face.php)` rule allows you to define and load custom fonts for use on a webpage.

The font does not have to be installed on the user's computer.

When you have found/bought the font you want to use, just include the font file on your web server, and it will be automatically downloaded to the user when needed.

* * *

## Common Font Formats

The most widely used font formats are WOFF/WOFF2 for web pages and TTF/OTF for desktop.

### WOFF/WOFF2 (Web Open Font Format)

WOFF/WOFF2 are optimized to reduce file size and are the ideal font format for use in web pages. It was developed in 2009, and is now a W3C Recommendation. WOFF/WOFF2 are supported by all major browsers.

### TTF (TrueType Fonts) and OTF (OpenType Fonts)

TTF was developed in the late 1980s, by Apple. OTF was developed by Apple and Microsoft. TTF is the most common font format for both the Mac OS and Microsoft Windows operating systems. OTF is built on TTF, as a more advanced, scalable format that supports rich typesetting features. Both types are popular because of their accessibility and quality, but they are not optimized for web use.

* * *

## Use Your Custom Font

In the `[@font-face](https://www.w3schools.com/cssref/atrule_font-face.php)` rule; first specify a name for the custom font (e.g. "myFont") in the font-family descriptor, then point to the font file in the src descriptor.

Then, to use the custom font in an HTML element, refer to the name of the font ("myFont") through the `[font-family](https://www.w3schools.com/cssref/pr_font_font-family.php)` property:

```javascript
@font-face {  font-family: myFont; /* set name */  src: url(sansation_light.woff); /* url of the font */}p {  font-family: myFont; /* use font */}
```

* * *

* * *

## Bold Custom Font

You must add another `[@font-face](https://www.w3schools.com/cssref/atrule_font-face.php)` rule containing descriptors for bold text:

```javascript
@font-face {  font-family: myFont;  src: url(sansation_bold.woff);  font-weight: bold;}
```

The file "sansation\_bold.woff" is another font file, that contains the bold characters for the Sansation font.

Browsers will use this file whenever a piece of text with the font-family "myFont" should render as bold.

**Tip:** This way you can have many `[@font-face](https://www.w3schools.com/cssref/atrule_font-face.php)` rules for the same font.

* * *

## CSS @font-face Descriptors

The following table lists the font descriptors that can be defined inside the `[@font-face](https://www.w3schools.com/cssref/atrule_font-face.php)` rule:

Descriptor

Description

font-family

Required. Defines a name for the font

src

Required. Defines the URL of the font file

font-stretch

Optional. Defines how the font should be stretched. Default is "normal"

font-style

Optional. Defines how the font should be styled. Default is "normal"

font-weight

Optional. Defines the weight of the font. Default is "normal"

font-display

Optional. Defines how the font loads and displays. Default is "auto"

unicode-range

Optional. Defines the range of UNICODE characters the font supports. Default is "U+0-10FFFF"

* * *

* * *