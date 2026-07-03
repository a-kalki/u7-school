# SQL Server Functions

* * *

SQL Server has many built-in functions.

This reference contains string, numeric, date, conversion, and some advanced functions in SQL Server.

* * *

## SQL Server String Functions

Function

Description

[ASCII](func_sqlserver_ascii.asp.html)

Returns the ASCII value for the specific character

[CHAR](func_sqlserver_char.asp.html)

Returns the character based on the ASCII code

[CHARINDEX](func_sqlserver_charindex.asp.html)

Returns the position of a substring in a string

[CONCAT](func_sqlserver_concat.asp.html)

Adds two or more strings together

[Concat with +](func_sqlserver_concat_with_plus.asp.html)

Adds two or more strings together

[CONCAT\_WS](func_sqlserver_concat_ws.asp.html)

Adds two or more strings together with a separator

[DATALENGTH](func_sqlserver_datalength.asp.html)

Returns the number of bytes used to represent an expression

[DIFFERENCE](func_sqlserver_difference.asp.html)

Compares two SOUNDEX values, and returns an integer value

[FORMAT](func_sqlserver_format.asp.html)

Formats a value with the specified format

[LEFT](func_sqlserver_left.asp.html)

Extracts a number of characters from a string (starting from left)

[LEN](func_sqlserver_len.asp.html)

Returns the length of a string

[LOWER](func_sqlserver_lower.asp.html)

Converts a string to lower-case

[LTRIM](func_sqlserver_ltrim.asp.html)

Removes leading spaces from a string

[NCHAR](func_sqlserver_nchar.asp.html)

Returns the Unicode character based on the number code

[PATINDEX](func_sqlserver_patindex.asp.html)

Returns the position of a pattern in a string

[QUOTENAME](func_sqlserver_quotename.asp.html)

Returns a Unicode string with delimiters added to make the string a valid SQL Server delimited identifier

[REPLACE](func_sqlserver_replace.asp.html)

Replaces all occurrences of a substring within a string, with a new substring

[REPLICATE](func_sqlserver_replicate.asp.html)

Repeats a string a specified number of times

[REVERSE](func_sqlserver_reverse.asp.html)

Reverses a string and returns the result

[RIGHT](func_sqlserver_right.asp.html)

Extracts a number of characters from a string (starting from right)

[RTRIM](func_sqlserver_rtrim.asp.html)

Removes trailing spaces from a string

[SOUNDEX](func_sqlserver_soundex.asp.html)

Returns a four-character code to evaluate the similarity of two strings

[SPACE](func_sqlserver_space.asp.html)

Returns a string of the specified number of space characters

[STR](func_sqlserver_str.asp.html)

Returns a number as string

[STUFF](func_sqlserver_stuff.asp.html)

Deletes a part of a string and then inserts another part into the string, starting at a specified position

[SUBSTRING](func_sqlserver_substring.asp.html)

Extracts some characters from a string

[TRANSLATE](func_sqlserver_translate.asp.html)

Returns the string from the first argument after the characters specified in the second argument are translated into the characters specified in the third argument.

[TRIM](func_sqlserver_trim.asp.html)

Removes leading and trailing spaces (or other specified characters) from a string

[UNICODE](func_sqlserver_unicode.asp.html)

Returns the Unicode value for the first character of the input expression

[UPPER](func_sqlserver_upper.asp.html)

Converts a string to upper-case

* * *

* * *

## SQL Server Math/Numeric Functions

Function

Description

[ABS](func_sqlserver_abs.asp.html)

Returns the absolute value of a number

[ACOS](func_sqlserver_acos.asp.html)

Returns the arc cosine of a number

[ASIN](func_sqlserver_asin.asp.html)

Returns the arc sine of a number

[ATAN](func_sqlserver_atan.asp.html)

Returns the arc tangent of a number

[ATN2](func_sqlserver_atn2.asp.html)

Returns the arc tangent of two numbers

[AVG](func_sqlserver_avg.asp.html)

Returns the average value of an expression

[CEILING](func_sqlserver_ceiling.asp.html)

Returns the smallest integer value that is >= a number

[COUNT](func_sqlserver_count.asp.html)

Returns the number of records returned by a select query

[COS](func_sqlserver_cos.asp.html)

Returns the cosine of a number

[COT](func_sqlserver_cot.asp.html)

Returns the cotangent of a number

[DEGREES](func_sqlserver_degrees.asp.html)

Converts a value in radians to degrees

[EXP](func_sqlserver_exp.asp.html)

Returns e raised to the power of a specified number

[FLOOR](func_sqlserver_floor.asp.html)

Returns the largest integer value that is <= to a number

[LOG](func_sqlserver_log.asp.html)

Returns the natural logarithm of a number, or the logarithm of a number to a specified base

[LOG10](func_sqlserver_log10.asp.html)

Returns the natural logarithm of a number to base 10

[MAX](func_sqlserver_max.asp.html)

Returns the maximum value in a set of values

[MIN](func_sqlserver_min.asp.html)

Returns the minimum value in a set of values

[PI](func_sqlserver_pi.asp.html)

Returns the value of PI

[POWER](func_sqlserver_power.asp.html)

Returns the value of a number raised to the power of another number

[RADIANS](func_sqlserver_radians.asp.html)

Converts a degree value into radians

[RAND](func_sqlserver_rand.asp.html)

Returns a random number

[ROUND](func_sqlserver_round.asp.html)

Rounds a number to a specified number of decimal places

[SIGN](func_sqlserver_sign.asp.html)

Returns the sign of a number

[SIN](func_sqlserver_sin.asp.html)

Returns the sine of a number

[SQRT](func_sqlserver_sqrt.asp.html)

Returns the square root of a number

[SQUARE](func_sqlserver_square.asp.html)

Returns the square of a number

[SUM](func_sqlserver_sum.asp.html)

Calculates the sum of a set of values

[TAN](func_sqlserver_tan.asp.html)

Returns the tangent of a number

* * *

## SQL Server Date Functions

Function

Description

[CURRENT\_TIMESTAMP](func_sqlserver_current_timestamp.asp.html)

Returns the current date and time

[DATEADD](func_sqlserver_dateadd.asp.html)

Adds a time/date interval to a date and then returns the date

[DATEDIFF](func_sqlserver_datediff.asp.html)

Returns the difference between two dates

[DATEFROMPARTS](func_sqlserver_datefromparts.asp.html)

Returns a date from the specified parts (year, month, and day values)

[DATENAME](func_sqlserver_datename.asp.html)

Returns a specified part of a date (as string)

[DATEPART](func_sqlserver_datepart.asp.html)

Returns a specified part of a date (as integer)

[DAY](func_sqlserver_day.asp.html)

Returns the day of the month for a specified date

[GETDATE](func_sqlserver_getdate.asp.html)

Returns the current database system date and time

[GETUTCDATE](func_sqlserver_getutcdate.asp.html)

Returns the current database system UTC date and time

[ISDATE](func_sqlserver_isdate.asp.html)

Checks an expression and returns 1 if it is a valid date, otherwise 0

[MONTH](func_sqlserver_month.asp.html)

Returns the month part for a specified date (a number from 1 to 12)

[SYSDATETIME](func_sqlserver_sysdatetime.asp.html)

Returns the date and time of the SQL Server

[YEAR](func_sqlserver_year.asp.html)

Returns the year part for a specified date

* * *

## SQL Server Advanced Functions

Function

Description

[CAST](func_sqlserver_cast.asp.html)

Converts a value (of any type) into a specified datatype

[COALESCE](func_sqlserver_coalesce.asp.html)

Returns the first non-null value in a list

[CONVERT](func_sqlserver_convert.asp.html)

Converts a value (of any type) into a specified datatype

[CURRENT\_USER](func_sqlserver_current_user.asp.html)

Returns the name of the current user in the SQL Server database

[IIF](func_sqlserver_iif.asp.html)

Returns a value if a condition is TRUE, or another value if a condition is FALSE

[ISNULL](func_sqlserver_isnull.asp.html)

Return a specified value if the expression is NULL, otherwise return the expression

[ISNUMERIC](func_sqlserver_isnumeric.asp.html)

Tests whether an expression is numeric

[NULLIF](func_sqlserver_nullif.asp.html)

Returns NULL if two expressions are equal

[SESSION\_USER](func_sqlserver_session_user.asp.html)

Returns the name of the current user in the SQL Server database

[SESSIONPROPERTY](func_sqlserver_sessionproperty.asp.html)

Returns the session settings for a specified option

[SYSTEM\_USER](func_sqlserver_system_user.asp.html)

Returns the login name for the current user

[USER\_NAME](func_sqlserver_user_name.asp.html)

Returns the database user name based on the specified id