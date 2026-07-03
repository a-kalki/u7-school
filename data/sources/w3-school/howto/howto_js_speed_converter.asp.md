# How TO - Speed Converter

* * *

Learn how to create a speed converter with HTML and JavaScript.

* * *

## Speed Converter

Type a value in any of the fields to convert between speed measurements:

MPH 

KPH 

Knots 

Mach 

* * *

## Create a Speed Converter

Create an input element that can convert a value from one speed measurement to another.

##### Step 1) Add HTML:

```javascript
<p>  <label>MPH</label>  <input id="inputMPH" type="number" placeholder="MPH"  oninput="speedConverter(this.value)"  onchange="speedConverter(this.value)"></p><p>KPH: <span id="outputKPH"></span></p>
```

* * *

##### Step 2) Add JavaScript:

```javascript
/* When the input field receives input, convert the value from mph to kph */function speedConverter(valNum) {  valNum = parseFloat(valNum);  document.getElementById("outputKPH").innerHTML = valNum * 1.609344;}
```

* * *

* * *

## Convert from MPH to other Measurements

The table below shows how to convert from MPH to other speed measurements:

Description

Formula

Example

Convert from MPH to KPH

KPH=MPH\*1.609344

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_speed_converter_mph_to_kph)

Convert from MPH to Knots

knots=MPH/1.150779

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_speed_converter_mph_to_knots)

Convert from MPH to Mach

Mach=MPH/761.207

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_speed_converter_mph_to_mach)

* * *

## Convert from KPH to other Measurements

The table below shows how to convert from KPH to other speed measurements:

Description

Formula

Example

Convert from KPH to MPH

MPH=KPH/1.609344

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_speed_converter_kph_to_mph)

Convert from KPH to Knots

knots=KPH/1.852

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_speed_converter_kph_to_knots)

Convert from KPH to Mach

Mach=KPH/1225.044

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_speed_converter_kph_to_mach)

* * *

## Convert from Knots to other Measurements

The table below shows how to convert from Knots to other speed measurements:

Description

Formula

Example

Convert from Knots to MPH

MPH=knots\*1.150779

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_speed_converter_knots_to_mph)

Convert from Knots to KPH

KPH=knots\*1.852

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_speed_converter_knots_to_kph)

Convert from Knots to Mach

Mach=knots/661.4708

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_speed_converter_knots_to_mach)

* * *

## Convert from Mach to other Measurements

The table below shows how to convert from Mach to other speed measurements:

Description

Formula

Example

Convert from Mach to MPH

MPH=Mach\*761.207

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_speed_converter_mach_to_mph)

Convert from Mach to KPH

KPH=Mach\*1225.044

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_speed_converter_mach_to_kph)

Convert from Mach to Knots

knots=Mach\*661.4708

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_speed_converter_mach_to_knots)

* * *