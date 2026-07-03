# CSS Media Queries

* * *

## CSS Media Queries

CSS media queries allow you to apply styles based on the characteristics of a device or the environment displaying the web page.

CSS media queries are essential for creating responsive web pages.

The CSS `[@media](https://www.w3schools.com/cssref/atrule_media.php)` rule is used to add media queries to your style sheet.

* * *

## Media Query Syntax

A media query consists of an optional media-type and one or more media-features, which resolve to either true or false.

@media \[not\] _media-type_ and (_media-feature: value_) and (_media-feature: value_) {  __/\* CSS rules to apply \*/__}

The media-type is optional. However, if you use **not**, you must also specify a media-type.

The result of a media query is true if the specified media-type matches the type of device, and all media-features are true. When a media query is true, the corresponding style rules are applied, following the normal cascading rules.

Meaning of the **not** and **and** keywords:

**not:** This optional keyword inverts the meaning of the entire media query.

**and:** This keyword combines a media-type and one or more media-features.

* * *

## CSS Media Types

The optional media type specifies the type of media the styles are for. If media type is omitted, it will be set to "all".

Value

Description

all

Used for all media type devices

print

Used for print preview mode

screen

Used for computer screens, tablets, and smart-phones

* * *

* * *

## CSS Media Features

The media feature specifies a specific characteristic of the device.

Here are some commonly used media features:

Value

Description

max-height

Maximum height of the viewport

min-height

Minimum height of the viewport

height

Height of the viewport (including scrollbar)

max-width

Maximum width of the viewport

min-width

Minimum width of the viewport

width

Width of the viewport (including scrollbar)

orientation

Orientation of the viewport (landscape or portrait)

resolution

Screen resolution

prefers-color-scheme

User's preferred color scheme (light or dark)

* * *

## Media Queries Examples

Here, we use a media query to change the background-color of the body to lightgreen, if the width of the viewport is 480px, or wider:

```javascript
@media screen and (min-width: 480px) {  body {    background-color: lightgreen;  }}
```

Here, we use a media query to change the background-color of the body to lightgreen, if the width of the viewport is between 480px and 768px:

```javascript
@media screen and (min-width: 480px) and (max-width: 768px) {  body {    background-color: lightgreen;  }}
```

## More Media Query Examples

For more examples on media queries, go to the next page: [CSS MQ Examples](css3_mediaqueries_ex.asp.html).

* * *

* * *