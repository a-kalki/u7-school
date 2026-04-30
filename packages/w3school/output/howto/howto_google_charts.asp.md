# How TO - Google Charts

* * *

Learn how to add Google Charts to your web page.

* * *

```javascript

```

* * *

## Google Pie Chart

Start with a simple basic web page.

Add a <div> element with the id "piechart":

```javascript
<!DOCTYPE html><html><body><h1>My Web Page</h1><div id="piechart"></div></body><html>
```

* * *

* * *

Add a reference to the Chart API at google.com:

```javascript
<script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>
```

And add a JavaScript function:

```javascript
<script type="text/javascript">// Load google chartsgoogle.charts.load('current', {'packages':['corechart']});google.charts.setOnLoadCallback(drawChart);// Draw the chart and set the chart valuesfunction drawChart() {  var data = google.visualization.arrayToDataTable([  ['Task', 'Hours per Day'],  ['Work', 8],  ['Friends', 2],  ['Eat', 2],  ['TV', 2],  ['Gym', 2],  ['Sleep', 8]]);  // Optional; add a title and set the width and height of the chart  var options = {'title':'My Average Day', 'width':550, 'height':400};  // Display the chart inside the <div> element with id="piechart"  var chart = new google.visualization.PieChart(document.getElementById('piechart'));  chart.draw(data, options);}</script>
```