# How TO - Disable Text Selection

* * *

Learn how to disable text selection in HTML with CSS.

* * *

This text can be selected.

This text cannot be selected.

* * *

## Disable Text Selection

You can use the `user-select` property to disable text selection of an element.

In web browsers, if you double-click on some text it will be selected/highlighted. This property can be used to prevent this.

```javascript
.prevent-select {  -webkit-user-select: none; /* Safari */  -ms-user-select: none; /* IE 10 and IE 11 */  user-select: none; /* Standard syntax */}
```

* * *

**Tip:** Go to our [CSS user-select Reference](https://www.w3schools.com/cssref/css3_pr_user-select.asp) to learn more the user-select property.

* * *

* * *