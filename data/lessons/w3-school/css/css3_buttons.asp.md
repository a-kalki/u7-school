# CSS Styling Buttons

* * *

## CSS Styling Buttons

With CSS, different HTML buttons can be styled in many ways.

The most common CSS properties for styling buttons are:

*   `[background-color](https://www.w3schools.com/cssref/pr_background-color.php)` - defines the background color of a button
*   `[color](https://www.w3schools.com/cssref/pr_text_color.php)` - defines the text color of a button
*   `[border](https://www.w3schools.com/cssref/pr_border.php)` - defines the border of a button
*   `[padding](https://www.w3schools.com/cssref/pr_padding.php)` - defines the space between the text and the border of a button
*   `[border-radius](https://www.w3schools.com/cssref/css3_pr_border-radius.php)` - adds rounded corners to a button
*   `[box-shadow](https://www.w3schools.com/cssref/css3_pr_box-shadow.php)` - adds shadows to a button
*   `[text-align](https://www.w3schools.com/cssref/pr_text_text-align.php)` - centers the text of a button
*   `[font-size](https://www.w3schools.com/cssref/pr_font_font-size.php)` - defines the font size of the text on a button
*   `[text-decoration](https://www.w3schools.com/cssref/pr_text_text-decoration.php)` - removes the underline for <a> elements used as buttons
*   `[cursor](https://www.w3schools.com/cssref/pr_class_cursor.php)` - changes the mouse cursor when hovering over the button

Buttons are typically created with the HTML `<button>` element, the `<input type="button">` element, or an `<a>` element styled as a button.

* * *

## CSS Basic Button Styling

Default Button CSS Button
```javascript
.button {  background-color: red;  border: none;  color: white;  padding: 15px 32px;  text-align: center;  text-decoration: none;  display: inline-block;  font-size: 16px;  cursor: pointer;}
```

* * *

## CSS Button Colors

The CSS `[background-color](https://www.w3schools.com/cssref/pr_background-color.php)` property is used to define the background color of a button.

The CSS `[color](https://www.w3schools.com/cssref/pr_text_color.php)` property is used to define the text color of a button.

Green Blue Red Gray Black
```javascript
.button1 {background-color: #04AA6D;} /* Green */.button2 {background-color: #008CBA;} /* Blue */.button3 {background-color: #f44336;} /* Red */.button4 {background-color: #e7e7e7; color: black;} /* Gray */.button5 {background-color: #555555;} /* Black */
```

* * *

* * *

## CSS Button Sizes

The CSS `[font-size](https://www.w3schools.com/cssref/pr_font_font-size.php)` property is used to define the font size for the text on a button:

10px 12px 16px 20px 24px
```javascript
.button1 {font-size: 10px;}.button2 {font-size: 12px;}.button3 {font-size: 16px;}.button4 {font-size: 20px;}.button5 {font-size: 24px;}
```

The CSS `[padding](https://www.w3schools.com/cssref/pr_padding.php)` property is used to define the space between the text and the border of a button:

10px 24px 12px 28px 14px 40px 32px 16px 16px
```javascript
.button1 {padding: 10px 24px;}.button2 {padding: 12px 28px;}.button3 {padding: 14px 40px;}.button4 {padding: 32px 16px;}.button5 {padding: 16px;}
```

* * *

## CSS Rounded Buttons

The CSS `[border-radius](https://www.w3schools.com/cssref/css3_pr_border-radius.php)` property is used to add rounded corners to a button:

2px 4px 8px 12px 50%
```javascript
.button1 {border-radius: 2px;}.button2 {border-radius: 4px;}.button3 {border-radius: 8px;}.button4 {border-radius: 12px;}.button5 {border-radius: 50%;}
```

* * *

## CSS Button Borders

The CSS `[border](https://www.w3schools.com/cssref/pr_border.php)` property is used to define the border of a button:

Green Blue Red Gray Black
```javascript
.button1 {border: 2px solid #04AA6D;}.button2 {border: 2px dotted #008CBA;}.button3 {border: 2px dashed #f44336;}.button4 {border: 1px solid #e7e7e7;}.button5 {border: 1px solid #555555;}
```

* * *