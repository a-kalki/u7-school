# How TO - CSS Calendar

* * *

Learn how to create a Calendar with CSS.

* * *

## How To Create a Calendar Layout

*   ❮
*   ❯
*   August  
    2021

*   Mo
*   Tu
*   We
*   Th
*   Fr
*   Sa
*   Su

*   1
*   2
*   3
*   4
*   5
*   6
*   7
*   8
*   9
*   10
*   11
*   12
*   13
*   14
*   15
*   16
*   17
*   18
*   19
*   20
*   21
*   22
*   23
*   24
*   25
*   26
*   27
*   28
*   29
*   30
*   31

[Try it Yourself »](https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_calendar)

* * *

##### Step 1) Add HTML:

```javascript
<div class="month">  <ul>    <li class="prev">&#10094;</li>    <li class="next">&#10095;</li>    <li>August<br><span style="font-size:18px">2021</span></li>  </ul></div><ul class="weekdays">  <li>Mo</li>  <li>Tu</li>  <li>We</li>  <li>Th</li>  <li>Fr</li>  <li>Sa</li>  <li>Su</li></ul><ul class="days">  <li>1</li>  <li>2</li>  <li>3</li>  <li>4</li>  <li>5</li>  <li>6</li>  <li>7</li>  <li>8</li>  <li>9</li>  <li><span class="active">10</span></li>  <li>11</li>  ...etc</ul>
```

* * *

* * *

##### Step 2) Add CSS:

```javascript
ul {list-style-type: none;}body {font-family: Verdana, sans-serif;}/* Month header */.month {  padding: 70px 25px;  width: 100%;  background: #1abc9c;  text-align: center;}/* Month list */.month ul {  margin: 0;  padding: 0;}.month ul li {  color: white;  font-size: 20px;  text-transform: uppercase;  letter-spacing: 3px;}/* Previous button inside month header */.month .prev {  float: left;  padding-top: 10px;}/* Next button */.month .next {  float: right;  padding-top: 10px;}/* Weekdays (Mon-Sun) */.weekdays {  margin: 0;  padding: 10px 0;  background-color:#ddd;}.weekdays li {  display: inline-block;  width: 13.6%;  color: #666;  text-align: center;}/* Days (1-31) */.days {  padding: 10px 0;  background: #eee;  margin: 0;}.days li {  list-style-type: none;  display: inline-block;  width: 13.6%;  text-align: center;  margin-bottom: 5px;  font-size:12px;  color: #777;}/* Highlight the "current" day */.days li .active {  padding: 5px;  background: #1abc9c;  color: white !important}
```