# How TO - Weight Converter

* * *

Learn how to create a weight converter with HTML and JavaScript.

* * *

## Weight Converter

Type a value in any of the fields to convert between weight measurements:

Pounds 

Kilograms 

Ounces 

Grams 

Stones 

* * *

## Create a Weight Converter

Create an input element that can convert a value from one weight measurement to another.

##### Step 1) Add HTML:

```javascript
<p>  <label>Pounds</label>  <input id="inputPounds" type="number" placeholder="Pounds"  oninput="weightConverter(this.value)" onchange="weightConverter(this.value)"></p><p>Grams: <span id="outputGrams"></span></p>
```

* * *

##### Step 2) Add JavaScript:

```javascript
/* When the input field receives input, convert the value from pounds to kilograms */function weightConverter(valNum) {  document.getElementById("outputGrams").innerHTML = valNum / 0.0022046;}
```

* * *

* * *

## Convert from Pounds to other Measurements

The table below shows how to convert from Pounds to other weight measurements:

Description

Formula

Example

Convert from Pounds to Kilograms

kg=lb/2.2046

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_weight_converter_pounds_to_kilograms)

Convert from Pounds to Ounces

oz=lb\*16

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_weight_converter_pounds_to_ounces)

Convert from Pounds to Grams

g=lb/0.0022046

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_weight_converter_pounds_to_grams)

Convert from Pounds to Stones

st=lb\*0.071429

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_weight_converter_pounds_to_stones)

* * *

## Convert from Kilograms to other Measurements

The table below shows how to convert from Kilograms to other weight measurements:

Description

Formula

Example

Convert from Kilograms to Pounds

lb=kg\*2.2046

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_weight_converter_kilograms_to_pounds)

Convert from Kilograms to Ounces

oz=kg\*35.274

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_weight_converter_kilograms_to_ounces)

Convert from Kilograms to Grams

g=kg\*1000

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_weight_converter_kilograms_to_grams)

Convert from Kilograms to Stones

st=kg\*0.1574

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_weight_converter_kilograms_to_stones)

* * *

## Convert from Ounces to other Measurements

The table below shows how to convert from Ounces to other weight measurements:

Description

Formula

Example

Convert from Ounces to Pounds

lb=oz\*0.0625

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_weight_converter_ounces_to_pounds)

Convert from Ounces to Kilograms

kg=oz/35.274

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_weight_converter_ounces_to_kilograms)

Convert from Ounces to Grams

g=oz/0.035274

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_weight_converter_ounces_to_grams)

Convert from Ounces to Stones

st=oz\*0.0044643

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_weight_converter_ounces_to_stones)

* * *

## Convert from Grams to other Measurements

The table below shows how to convert from Grams to other weight measurements:

Description

Formula

Example

Convert from Grams to Pounds

lb=g\*0.0022046

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_weight_converter_grams_to_pounds)

Convert from Grams to Kilograms

kg=g/1000

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_weight_converter_grams_to_kilograms)

Convert from Grams to Ounces

oz=g\*0.035274

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_weight_converter_grams_to_ounces)

Convert from Grams to Stones

st=g\*0.00015747

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_weight_converter_grams_to_stones)

* * *

## Convert from Stones to other Measurements

The table below shows how to convert from Stones to other weight measurements:

Description

Formula

Example

Convert from Stones to Pounds

lb=st\*14

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_weight_converter_stones_to_pounds)

Convert from Stones to Kilograms

kg=st/0.15747

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_weight_converter_stones_to_kilograms)

Convert from Stones to Ounces

oz=st\*224

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_weight_converter_stones_to_ounces)

Convert from Stones to Grams

g=st/0.00015747

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_weight_converter_stones_to_grams)

* * *