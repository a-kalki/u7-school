# How TO - Hide Arrows From Input Number

* * *

Learn how to remove arrows/spinners from input type number with CSS.

* * *

**Try to hover over both number inputs to see the difference:**

Hidden arrows:

Default:

**Notes on functionality:** It is still possible to increment the number when you scroll inside the number input.

* * *

## Remove Arrows/Spinners

```javascript
/* Chrome, Safari, Edge, Opera */input::-webkit-outer-spin-button,input::-webkit-inner-spin-button {  -webkit-appearance: none;  margin: 0;}/* Firefox */input[type=number] {  -moz-appearance: textfield;}
```

**Tip:** Go to our [HTML Form Tutorial](https://www.w3schools.com/html/html_forms.asp) to learn more about HTML Forms.

**Tip:** Go to our [HTML input type="number" reference](https://www.w3schools.com/tags/att_input_type_number.asp) to learn more about inputs with type="number".

* * *

* * *