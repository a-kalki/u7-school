# CSS Fonts

* * *

## Font Selection is Important

Choosing the right font has a huge impact on how the readers experience a website.

The right font can create a strong identity for your brand.

Choosing a font that is easy to read is important. It is also important to choose a good color and size for your font.

* * *

## The CSS font-family Property

The CSS `[font-family](https://www.w3schools.com/cssref/pr_font_font-family.php)` property specifies the font for an element.

**Tip:** The `[font-family](https://www.w3schools.com/cssref/pr_font_font-family.php)` property should hold several font names as a "fallback" system. If the browser does not support the first font, it tries the next font. The font names should be separated with a comma.

Always start with the font you want, and always end with a generic family, to let the browser pick a similar font in the generic family, if no other fonts are available.

**Note**: If the font name is more than one word, it must be in quotation marks, like: "Times New Roman".

**Tip:** Read more about fallback fonts in [CSS Web Safe Fonts](css_font_websafe.asp.html).

```javascript
.p1 {  font-family: "Times New Roman", Times, serif;}.p2 {  font-family: Arial, Helvetica, sans-serif;}.p3 {  font-family: "Lucida Console", "Courier New", monospace;}
```

* * *

* * *

## CSS Generic Font Families

In CSS, there are five generic font families:

1.  **Serif fonts** - have a small stroke at the edges of each letter. They create a sense of formality and elegance.
2.  **Sans-serif fonts** - have clean lines (no small strokes attached). They create a modern and minimalistic look.
3.  **Monospace fonts** - here all the letters have the same fixed width. They create a mechanical look.
4.  **Cursive fonts** - imitate human handwriting.
5.  **Fantasy fonts** - are decorative/playful fonts.

All the different font names belong to one of the generic font families.

* * *

## Difference Between Serif and Sans-serif Fonts

![Serif vs. Sans-serif](serif.gif)

**Note:** On computer screens, **sans-serif fonts** are considered easier to read than serif fonts.

* * *

## Some Font Examples

Generic Font Family

Examples of Font Names

Serif

Times New Roman  
Georgia  
Garamond  

Sans-serif

Arial  
Verdana  
Helvetica  

Monospace

Courier New  
Lucida Console  
Monaco

Cursive

Brush Script MT  
Lucida Handwriting  

Fantasy

Copperplate  
Papyrus

* * *

* * *