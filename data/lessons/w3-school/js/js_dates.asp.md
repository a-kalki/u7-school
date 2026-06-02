# JavaScript Dates

* * *

JavaScript **Date Objects** let us work with dates:

[Year:](tryit.asp%3Ffilename=tryjs_date_getfullyear.html) [Month:](https://www.w3schools.com/js/tryit.asp?filename=tryjs_date_getmonth) [Day:](https://www.w3schools.com/js/tryit.asp?filename=tryjs_date_getdate) [Hours:](https://www.w3schools.com/js/tryit.asp?filename=tryjs_date_gethours) [Minutes:](https://www.w3schools.com/js/tryit.asp?filename=tryjs_date_getminutes) [Seconds:](https://www.w3schools.com/js/tryit.asp?filename=tryjs_date_getseconds)

```javascript
const d = new Date();
```

Date objects are static. The "clock" is not "running".

The computer clock is ticking, date objects are not.

* * *

## JavaScript Date Output

By default, JavaScript will use the browser's time zone and display a date as a full text string:

You will learn much more about how to display dates, later in this tutorial.

* * *

## Creating Date Objects

Date objects are created with the `new Date()` constructor.

There are **9 ways** to create a new date object:

```javascript
new Date()new Date(date string)new Date(year,month)new Date(year,month,day)new Date(year,month,day,hours)new Date(year,month,day,hours,minutes)new Date(year,month,day,hours,minutes,seconds)new Date(year,month,day,hours,minutes,seconds,ms)new Date(milliseconds)
```

* * *

## JavaScript new Date()

`new Date()` creates a date object with the **current date and time**:

```javascript
const d = new Date();
```

* * *

## new Date(_date string_)

`new Date(_date string_)` creates a date object from a **date string**:

```javascript
const d = new Date("October 13, 2014 11:13:00");
```

Date string formats are described in the next chapter.

* * *

## new Date(_year, month, ..._)

`new Date(_year, month, ..._)` creates a date object with a **specified date and time**.

7 numbers specify year, month, day, hour, minute, second, and millisecond (in that order):

```javascript
const d = new Date(2018, 11, 24, 10, 33, 30, 0);
```

JavaScript counts months from **0** to **11**:

**January = 0**.

**December = 11**.

Specifying a month higher than 11, will not result in an error but add the overflow to the next year:

```javascript
const d = new Date(2018, 15, 24, 10, 33, 30);
```

Specifying a day higher than max, will not result in an error but add the overflow to the next month:

```javascript
const d = new Date(2018, 5, 35, 10, 33, 30);
```

* * *

## Using 6, 4, 3, or 2 Numbers

6 numbers specify year, month, day, hour, minute, second:

```javascript
const d = new Date(2018, 11, 24, 10, 33, 30);
```

5 numbers specify year, month, day, hour, and minute:

```javascript
const d = new Date(2018, 11, 24, 10, 33);
```

4 numbers specify year, month, day, and hour:

```javascript
const d = new Date(2018, 11, 24, 10);
```

3 numbers specify year, month, and day:

```javascript
const d = new Date(2018, 11, 24);
```

2 numbers specify year and month:

```javascript
const d = new Date(2018, 11);
```

You cannot omit month. If you supply only one parameter it will be treated as milliseconds.

```javascript
const d = new Date(2018);
```

* * *

## Previous Century

One and two digit years will be interpreted as 19xx:

```javascript
const d = new Date(99, 11, 24);
```
```javascript
const d = new Date(9, 11, 24);
```

* * *

## JavaScript Stores Dates as Milliseconds

JavaScript stores dates as number of milliseconds since January 01, 1970.

**Zero time is January 01, 1970 00:00:00 UTC**.

One day (24 hours) is 86 400 000 milliseconds.

Now the time is: milliseconds past January 01, 1970

* * *

## new Date(_milliseconds_)

`new Date(_milliseconds_)` creates a new date object as **milliseconds** plus zero time:

```javascript
const d = new Date(100000000000);
```

* * *

* * *

## Date Methods

When a date object is created, a number of **methods** allow you to operate on it.

Date methods allow you to get and set the year, month, day, hour, minute, second, and millisecond of date objects, using either local time or UTC (universal, or GMT) time.

Date methods and time zones are covered in the next chapters.

* * *

## Displaying Dates

JavaScript will (by default) output dates using the **toString()** method. This is a string representation of the date, including the time zone. The format is specified in the ECMAScript specification:

```javascript

```

When you display a date object in HTML, it is automatically converted to a string, with the `toString()` method.

```javascript
const d = new Date();d.toString();
```

The `toDateString()` method converts a date to a more readable format:

```javascript
const d = new Date();d.toDateString();
```

The `toUTCString()` method converts a date to a string using the UTC standard:

```javascript
const d = new Date();d.toUTCString();
```

The `toISOString()` method converts a date to a string using the ISO standard:

```javascript
const d = new Date();d.toISOString();
```

## Learn More:

[JavaScript Date Formats](js_date_formats.asp.html)

[JavaScript Date Get Methods](js_date_methods.asp.html)

[JavaScript Date Set Methods](js_date_methods_set.asp.html)

[JavaScript Date Reference](js_date_reference.asp.html)

* * *