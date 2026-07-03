# How TO - Responsive Tables

* * *

Learn how to create a responsive table.

* * *

## Responsive Tables

A responsive table will display a horizontal scroll bar if the screen is too small to display the full content. Resize the browser window to see the effect:

First Name

Last Name

Points

Points

Points

Points

Points

Points

Points

Points

Points

Points

Points

Points

Points

Points

Points

Points

Points

Points

Points

Jill

Smith

50

50

50

50

50

50

50

50

50

50

50

50

50

50

50

50

50

50

50

Eve

Jackson

94

94

94

94

94

94

94

94

94

94

94

94

94

94

94

94

94

94

94

Adam

Johnson

67

67

67

67

67

67

67

67

67

67

67

67

67

67

67

67

67

67

67

  

To create a responsive table, add a container element with `overflow-x:auto` around the <table>:

```javascript
<div style="overflow-x:auto;">  <table>    ...  </table></div>
```

**Note:** In OS X Lion (on Mac), scrollbars are hidden by default and only shown when being used (even though "overflow:scroll" or auto is set).

**Tip:** Go to our [CSS Tables Tutorial](https://www.w3schools.com/css/css_table.asp) to learn more about how to style tables.

* * *

* * *