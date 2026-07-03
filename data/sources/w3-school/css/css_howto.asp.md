# How To Add CSS

* * *

## How to Add CSS

When a browser reads a style sheet, it will format the HTML document according to the information in the style sheet.

There are three ways of inserting a style sheet:

1.  External CSS - link to an external .css file
2.  Internal CSS - use the <style> element in the head section
3.  Inline CSS - use the style attribute on HTML elements

* * *

## External CSS

With an external style sheet, you can change the look of an entire website by changing just one file!

Each HTML page must include a reference to the external style sheet file inside the <link> element, inside the head section.

```javascript
<!DOCTYPE html><html><head><link rel="stylesheet" href="mystyle.css"></head><body><h1>This is a heading</h1><p>This is a paragraph.</p></body></html>
```

An external style sheet can be written in any text editor, and must be saved with a .css extension.

The external .css file should not contain any HTML tags.

Here is how the "mystyle.css" file looks:

```javascript
body {  background-color: lightblue;}h1 {  color: navy;  margin-left: 20px;}
```

**Note:** Do not add a space between the property value (20) and the unit (px):  
Incorrect (space): `margin-left: 20 px;`  
Correct (no space): `margin-left: 20px;`

* * *

* * *

## Video: How to add CSS to HTML

  [![Tutorial on YouTube](images/yt_logo_rgb_dark.png)

 ![Tutorial on YouTube](images/css_howto.png)](https://youtu.be/VSwaoQ3TFkQ&list=PLP9IO4UYNF0UCaUSF3XNZ1U9f01E5h5PM)

* * *

* * *