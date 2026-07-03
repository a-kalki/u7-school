# HTML Geolocation API

* * *

The Geolocation API is used to get the user's current location.

* * *

## Locate the User's Position

The Geolocation API is used to access the user's current location.

Since this can compromise privacy, the location is not available unless the user approves it.

Try It

**Note:** The Geolocation API is only available on secure contexts such as HTTPS.

**Tip:** The Geolocation API is most accurate for devices with GPS, like smartphones or smartwatches.

* * *

## Browser Support

The numbers in the table specify the first browser version that fully supports Geolocation.

API

Geolocation

5.0

12.0

3.5

5.0

10.6

* * *

## Using HTML Geolocation API

The Geolocation API is accessed via a call to `navigator.geolocation`. This will cause the browser to ask the user for permission to access their location data. If the user accept, the browser will search for the best available functionality on the device to access this information (for example GPS).

The `getCurrentPosition()` method is used to return the user's current location.

The example below returns the latitude and longitude of the user's current location:

```javascript
<script>const x = document.getElementById("demo");function getLocation() {  if (navigator.geolocation) {    navigator.geolocation.getCurrentPosition(success, error);  } else {    x.innerHTML = "Geolocation is not supported by this browser.";  }}function success(position) {  x.innerHTML = "Latitude: " + position.coords.latitude +  "<br>Longitude: " + position.coords.longitude;}function error() {  alert("Sorry, no position available.");}</script>
```

Example explained:

*   Check if Geolocation is supported
*   If Geolocation is supported, run the `getCurrentPosition()` method. If not, display a message to the user
*   The success() function outputs the user's location in latitude and longitude
*   The error() function alerts a text if the browser retrieves an error in `getCurrentPosition()`

* * *

* * *

## Error Handling and Rejections

The second parameter of the `getCurrentPosition()` method is used to handle errors. It specifies a function to run if it fails to get the user's location.

Here is an example of a more specific error handling:

```javascript
function error(error) {  switch(error.code) {    case error.PERMISSION_DENIED:      x.innerHTML = "User denied the request for Geolocation."      break;    case error.POSITION_UNAVAILABLE:      x.innerHTML = "Location information is unavailable."      break;    case error.TIMEOUT:      x.innerHTML = "The request to get user location timed out."      break;    case error.UNKNOWN_ERROR:      x.innerHTML = "An unknown error occurred."      break;  }}
```

* * *

## Location-specific Information

Geolocation is also very useful for location-specific information, like:

*   Up-to-date local information
*   Showing Points-of-interest near the user
*   Turn-by-turn navigation (GPS)

* * *

## The getCurrentPosition() Method - Return Data

The `getCurrentPosition()` method returns an object on success. The latitude, longitude and accuracy properties are always returned. The other properties are returned if available:

Property

Returns

coords.latitude

The latitude as a decimal number (always returned)

coords.longitude

The longitude as a decimal number (always returned)

coords.accuracy

The accuracy of position (always returned)

coords.altitude

The altitude in meters above the mean sea level (returned if available)

coords.altitudeAccuracy

The altitude accuracy of position (returned if available)

coords.heading

The heading as degrees clockwise from North (returned if available)

coords.speed

The speed in meters per second (returned if available)

timestamp

The date/time of the response (returned if available)

* * *

## Geolocation Object - Other interesting Methods

The Geolocation object also has other interesting methods:

*   `watchPosition()` - Returns the current location of the user and continues to return updated location as the user moves (like the GPS in a car).
*   `clearWatch()` - Stops the `watchPosition()` method.

The example below shows the `watchPosition()` method. You need an accurate GPS device to test this (like a smartphone):

```javascript
<script>const x = document.getElementById("demo");function getLocation() {  if (navigator.geolocation) {    navigator.geolocation.watchPosition(success, error);  } else {    x.innerHTML = "Geolocation is not supported by this browser.";  }}function success(position) {  x.innerHTML = "Latitude: " + position.coords.latitude +  "<br>Longitude: " + position.coords.longitude;}function error(error) {  switch(error.code) {    case error.PERMISSION_DENIED:      x.innerHTML = "User denied the request for Geolocation."      break;    case error.POSITION_UNAVAILABLE:      x.innerHTML = "Location information is unavailable."      break;    case error.TIMEOUT:      x.innerHTML = "The request to get user location timed out."      break;    case error.UNKNOWN_ERROR:      x.innerHTML = "An unknown error occurred."      break;  }}</script>
```

* * *