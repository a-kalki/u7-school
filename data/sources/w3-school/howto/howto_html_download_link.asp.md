# How TO - Download Link

* * *

Learn how to create a download link with HTML.

* * *

## Download Link

You can use the HTML `download` attribute to specify that the target will be downloaded when a user clicks on the hyperlink.

```javascript
<a href="/images/myw3schoolsimage.jpg" download>  <img src="/images/myw3schoolsimage.jpg" alt="W3Schools"></a>
```

The `download` attribute is only used if the `href` attribute is set.

The value of the attribute will be the name of the downloaded file. There are no restrictions on allowed values, and the browser will automatically detect the correct file extension and add it to the file (.img, .pdf, .txt, .html, etc.).

You can also specify a value for the download attribute, which will be the new filename of the downloaded file. If the value is omitted, the original filename is used.

```javascript
<a href="/images/myw3schoolsimage.jpg" download="w3logo">  <img src="/images/myw3schoolsimage.jpg" alt="W3Schools"></a>
```

* * *

## Browser Support

The numbers in the table specify the first browser version that fully supports the attribute.

Attribute

download

14.0

13.0

20.0

10.1

15.0

* * *

* * *