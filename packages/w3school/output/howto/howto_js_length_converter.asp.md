# How TO - Length Converter

* * *

Learn how to create a Length converter with HTML and JavaScript.

* * *

## Length Converter

Type a value in any of the fields to convert between Length measurements:

Feet 

Meters 

Inches 

cm 

Yards 

Kilometers 

Miles 

* * *

## Create a Length Converter

Create an input element that can convert a value from one Length measurement to another.

##### Step 1) Add HTML:

```javascript
<p>  <label>Feet</label>  <input id="inputFeet" type="number" placeholder="Feet"  oninput="lengthConverter(this.value)" onchange="lengthConverter(this.value)"></p><p>cm: <span id="outputMeters"></span></p>
```

* * *

##### Step 2) Add JavaScript:

```javascript
/* When the input field receives input, convert the value from feet to meters */function lengthConverter(valNum) {  document.getElementById("outputMeters").innerHTML = valNum / 0.0022046;}
```

* * *

* * *

## Convert from Feet to other Measurements

The table below shows how to convert from Feet to other Length measurements:

Description

Formula

Example

Convert from Feet to Meters

m=ft/3.2808

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_length_converter_feet_to_meters)

Convert from Feet to Inches

in=ft\*12

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_length_converter_feet_to_inches)

Convert from Feet to cm

cm=ft/0.032808

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_length_converter_feet_to_cm)

Convert from Feet to Yards

yd=ft\*0.33333

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_length_converter_feet_to_yards)

Convert from Feet to Kilometers

km=ft/3280.8

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_length_converter_feet_to_kilometers)

Convert from Feet to Miles

mi=ft\*0.00018939

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_length_converter_feet_to_miles)

* * *

## Convert from Meters to other Measurements

The table below shows how to convert from Meters to other Length measurements:

Description

Formula

Example

Convert from Meters to Feet

ft=m\*3.2808

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_length_converter_meters_to_feet)

Convert from Meters to Inches

in=m\*39.370

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_length_converter_meters_to_inches)

Convert from Meters to cm

cm=m/0.01

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_length_converter_meters_to_cm)

Convert from Meters to Yards

yd=m\*1.0936

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_length_converter_meters_to_yards)

Convert from Meters to Kilometers

km=m/1000

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_length_converter_meters_to_kilometers)

Convert from Meters to Miles

mi=m\*0.00062137

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_length_converter_meters_to_miles)

* * *

## Convert from Inches to other Measurements

The table below shows how to convert from Inches to other Length measurements:

Description

Formula

Example

Convert from Inches to Feet

ft=in\*0.083333

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_length_converter_inches_to_feet)

Convert from Inches to Meters

m=in/39.370

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_length_converter_inches_to_meters)

Convert from Inches to cm

cm=in/0.39370

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_length_converter_inches_to_cm)

Convert from Inches to Yards

yd=in\*0.027778

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_length_converter_inches_to_yards)

Convert from Inches to Kilometers

km=in/39370

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_length_converter_inches_to_kilometers)

Convert from Inches to Miles

mi=in\*0.000015783

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_length_converter_inches_to_miles)

* * *

## Convert from cm to other Measurements

The table below shows how to convert from cm to other Length measurements:

Description

Formula

Example

Convert from cm to Feet

ft=cm\*0.032808

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_length_converter_cm_to_feet)

Convert from cm to Meters

m=cm/100

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_length_converter_cm_to_meters)

Convert from cm to Inches

in=cm\*0.39370

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_length_converter_cm_to_inches)

Convert from cm to Yards

yd=cm\*0.010936

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_length_converter_cm_to_yards)

Convert from cm to Kilometers

km=cm/100000

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_length_converter_cm_to_kilometers)

Convert from cm to Miles

mi=cm\*0.0000062137

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_length_converter_cm_to_miles)

* * *

## Convert from Yards to other Measurements

The table below shows how to convert from Yards to other Length measurements:

Description

Formula

Example

Convert from Yards to Feet

ft=yd\*3

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_length_converter_yards_to_feet)

Convert from Yards to Meters

m=yd/1.0936

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_length_converter_yards_to_meters)

Convert from Yards to Inches

in=yd\*36

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_length_converter_yards_to_inches)

Convert from Yards to cm

cm=yd/0.010936

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_length_converter_yards_to_cm)

Convert from Yards to Kilometers

km=yd/1093.6

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_length_converter_yards_to_kilometers)

Convert from Yards to Miles

mi=yd\*0.00056818

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_length_converter_yards_to_miles)

* * *

## Convert from Kilometers to other Measurements

The table below shows how to convert from Kilometers to other Length measurements:

Description

Formula

Example

Convert from Kilometers to Feet

ft=km\*3280.8

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_length_converter_kilometers_to_feet)

Convert from Kilometers to Meters

m=km\*1000

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_length_converter_kilometers_to_meters)

Convert from Kilometers to Inches

in=km\*39370

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_length_converter_kilometers_to_inches)

Convert from Kilometers to cm

cm=km\*100000

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_length_converter_kilometers_to_cm)

Convert from Kilometers to Yards

mi=km\*1093.6

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_length_converter_kilometers_to_yards)

Convert from Kilometers to Miles

mi=km\*0.62137

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_length_converter_kilometers_to_miles)

* * *

## Convert from Miles to other Measurements

The table below shows how to convert from Miles to other Length measurements:

Description

Formula

Example

Convert from Miles to Feet

ft=mi\*5280

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_length_converter_miles_to_feet)

Convert from Miles to Meters

m=mi/0.00062137

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_length_converter_miles_to_meters)

Convert from Miles to Inches

in=mi\*63360

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_length_converter_miles_to_inches)

Convert from Miles to cm

cm=mi/0.0000062137

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_length_converter_miles_to_cm)

Convert from Miles to Yards

yd=mi\*1760

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_length_converter_miles_to_yards)

Convert from Miles to Kilometers

km=mi/0.62137

[Try it](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_length_converter_miles_to_kilometers)

* * *