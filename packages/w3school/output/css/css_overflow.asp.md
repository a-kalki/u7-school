# CSS The overflow Property

* * *

## The CSS overflow Property

The CSS `[overflow](https://www.w3schools.com/cssref/pr_pos_overflow.php)` property controls what happens to content that is too big to fit into an area.

It specifies whether to clip the content or to add scrollbars when the content of an element is too big.

The `[overflow](https://www.w3schools.com/cssref/pr_pos_overflow.php)` property has the following values:

*   `visible` - Default. The overflow is not clipped. The content renders outside the element's box
*   `hidden` - The overflow is clipped, and the rest of the content is hidden
*   `scroll` - Scrollbars are added. User must scroll to see all content
*   `auto` - Similar to `scroll`, but adds scrollbars only when necessary

Here, scrollbars are added on overflow:

Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat. Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim qui blandit praesent luptatum zzril delenit augue duis dolore te feugait nulla facilisi. Nam liber tempor cum soluta nobis eleifend option congue nihil imperdiet doming id quod mazim placerat facer possim assum. Typi non habent claritatem insitam; est usus legentis in iis qui facit eorum claritatem.

  
[Try it Yourself »](https://www.w3schools.com/css/tryit.asp?filename=trycss_overflow_intro)

* * *

## CSS overflow: visible

By default, the overflow is `visible`, meaning that it is not clipped and it renders outside the element's box:

You can use the overflow property when you want to have better control of the layout. The overflow property specifies what happens if content overflows an element's box.

```javascript
div {  width: 200px;  height: 65px;  background-color: coral;  overflow: visible;}
```

* * *

* * *

## CSS overflow: hidden

With the `hidden` value, the overflow is clipped, and the rest of the content is hidden:

You can use the overflow property when you want to have better control of the layout. The overflow property specifies what happens if content overflows an element's box.

```javascript
div {  overflow: hidden;}
```

* * *

## CSS overflow: scroll

With the `scroll` value, horizontal and vertical scrollbars are always added. User must scroll to see all content:

You can use the overflow property when you want to have better control of the layout. The overflow property specifies what happens if content overflows an element's box.

```javascript
div {  overflow: scroll;}
```

* * *

## CSS overflow: auto

The `auto` value is similar to `scroll`, but it adds scrollbars only when necessary:

You can use the overflow property when you want to have better control of the layout. The overflow property specifies what happens if content overflows an element's box.

```javascript
div {  overflow: auto;}
```

* * *

* * *

## All CSS Overflow Properties

Property

Description

[overflow](https://www.w3schools.com/cssref/pr_pos_overflow.php)

Specifies what happens if content overflows an element's box

[overflow-anchor](https://www.w3schools.com/cssref/css_pr_overflow-anchor.php)

Makes it possible to turn off scroll anchoring

[overflow-x](https://www.w3schools.com/cssref/css3_pr_overflow-x.php)

Specifies what to do with the left/right edges of the content if it overflows the element's content area

[overflow-y](https://www.w3schools.com/cssref/css3_pr_overflow-y.php)

Specifies what to do with the top/bottom edges of the content if it overflows the element's content area

[overflow-wrap](https://www.w3schools.com/cssref/css3_pr_overflow-wrap.php)

Specifies whether or not the browser can break lines with long words, if they overflow its container