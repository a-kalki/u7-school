# How TO - Temperature Converter

* * *

Learn how to create a temperature converter with HTML and JavaScript.

* * *

## Temperature Converter

Type a value in any of the fields to convert between temperature measurements:

Fahrenheit 

Celsius 

Kelvin 

* * *

## Create a Temperature Converter

Create an input element that can convert a value from one temperature measurement to another.

##### Step 1) Add HTML:

```javascript
<p>  <label>Fahrenheit</label>  <input id="inputFahrenheit" type="number" placeholder="Fahrenheit"  oninput="temperatureConverter(this.value)"  onchange="temperatureConverter(this.value)"></p><p>Celsius: <span id="outputCelsius"></span></p>
```

* * *

##### Step 2) Add JavaScript:

```javascript
/* When the input field receives input, convert the value from fahrenheit to celsius */function temperatureConverter(valNum) {  valNum = parseFloat(valNum);  document.getElementById("outputCelsius").innerHTML = (valNum-32) / 1.8;}
```

* * *

* * *

## Convert from Fahrenheit to other Measurements

The table below shows how to convert from Fahrenheit to other temperature measurements:

Description

Formula

Example

Convert from Fahrenheit to Celsius

℃=(℉-32)/1.8

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_temp_converter_fahrenheit_to_celsius)

Convert from Fahrenheit to Kelvin

K=((℉-32)/1.8)+273.15

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_temp_converter_fahrenheit_to_kelvin)

* * *

## Convert from Celsius to other Measurements

The table below shows how to convert from Celsius to other temperature measurements:

Description

Formula

Example

Convert from Celsius to Fahrenheit

℉=(℃\*1.8)+32

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_temp_converter_celsius_to_fahrenheit)

Convert from Celsius to Kelvin

K=℃+273.15

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_temp_converter_celsius_to_kelvin)

* * *

## Convert from Kelvin to other Measurements

The table below shows how to convert from Kelvin to other temperature measurements:

Description

Formula

Example

Convert from Kelvin to Fahrenheit

℉=((K-273.15)\*1.8)+32

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_temp_converter_kelvin_to_fahrenheit)

Convert from Kelvin to Celsius

℃=K-273.15

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_temp_converter_kelvin_to_celsius)

* * *