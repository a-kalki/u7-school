# CSS Comments

* * *

## CSS Comments

Comments are used to explain the CSS code, and may help when you edit the source code at a later date.

Comments are also used to temporarily disable sections of CSS code within a stylesheet.

Comments are ignored by browsers!

A CSS comment is placed inside the HTML `<style>` element, and starts with `/*` and ends with `*/`:

```javascript
/* This is a single-line comment */p {  color: red;}
```

You can add comments wherever you want in the code:

```javascript
p {  color: red;  /* Set text color to red */}
```

Even in the middle of a code line:

```javascript
p {  color: /*red*/blue; }
```

Comments can also span multiple lines: 

```javascript
/* This isa multi-linecomment */p {  color: red;}
```

* * *

* * *

## HTML and CSS Comments

From the HTML tutorial, you learned that you can add comments to your HTML source by using the `<!--...-->` syntax.

In the following example, we use a combination of HTML and CSS comments:

```javascript
<!DOCTYPE html><html><head><style>p {  color: red; /* Set text color to red */}</style></head><body><h2>My Heading</h2><!-- These paragraphs will be red --><p>Hello World!</p><p>This paragraph is styled with CSS.</p><p>HTML and CSS comments are not shown in the output.</p></body></html>
```

* * *

* * *

## Video: CSS Comments

  [![Tutorial on YouTube](images/yt_logo_rgb_dark.png)

 ![Tutorial on YouTube](images/css_comments.png)](https://youtu.be/uVtEJD3vBEs&list=PLP9IO4UYNF0UCaUSF3XNZ1U9f01E5h5PM)

* * *