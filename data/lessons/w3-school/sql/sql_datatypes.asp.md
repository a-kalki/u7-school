# SQL Data Types for MySQL, SQL Server, and MS Access

* * *

## SQL Data Types

The data type of a column defines what value the column can hold: integer, character, money, date and time, binary, and so on.

Each column in a database table is required to have a name and a data type.

An SQL developer must decide what type of data that will be stored inside each column when creating a table. The data type is a guideline for SQL to understand what type of data is expected inside of each column, and it also identifies how SQL will interact with the stored data.

**Always check the documentation!** Data types might have different names in different databases. And even if the name is the same, the size and other details may be different!

* * *

## MySQL Data Types (Version 8.4)

In MySQL there are three main data types: String, Numeric, and Date and Time.

### String Data Types

Data type

Description

CHAR(size)

A fixed-length string (can contain letters, numbers, and special characters). _size_ specifies the column length in characters, from 0 to 255. Default _size_ is 1

VARCHAR(size)

A variable-length string (can contain letters, numbers, and special characters). _size_ specifies the maximum column length in characters, from 0 to 65535

BINARY(size)

Similar to CHAR(), but stores binary byte strings. _size_ specifies the column length in bytes. Default _size_ is 1

VARBINARY(size)

Similar to VARCHAR(), but stores binary byte strings. _size_ specifies the maximum column length in bytes.

BLOB(size)

A BLOB column with a maximum length of 65535 bytes

TINYBLOB

A BLOB column with a maximum length of 255 bytes

MEDIUMBLOB

A BLOB column with a maximum length of 16777215 bytes

LONGBLOB

A BLOB column with a maximum length of 4294967295 or 4GB bytes

TEXT(size)

Holds a string with a maximum length of 65535 bytes

TINYTEXT

A TEXT column with a maximum length of 255 characters

MEDIUMTEXT

A TEXT column with a maximum length of 16777215 characters

LONGTEXT

A TEXT column with a maximum length of 4294967295 or 4GB bytes

ENUM(val1, val2, val3, ...)

A string object that can have only one value, chosen from the list of possible values (val1, val2, val3,..). You can list up to 65535 values. If a value is inserted that is not in the list, a blank value will be inserted

SET(val1, val2, val3, ...)

A string object that can have zero or more values, chosen from the list of possible values (val1, val2, val3,..). You can list up to 64 values

### Numeric Data Types

Data type

Description

BIT(_size_)

A bit-value type. _size_ indicates the number of bits per value, from 1 to 64. The default value for _size_ is 1.

TINYINT(_size_)

A very small integer. Signed range is from -128 to 127. Unsigned range is from 0 to 255. _size_ specifies the minimum display width (max display width is 255)

BOOL

A value of zero is considered as false, nonzero values are considered as true.

BOOLEAN

Equal to BOOL

SMALLINT(_size_)

A small integer. Signed range is from -32768 to 32767. Unsigned range is from 0 to 65535. _size_ specifies the minimum display width (max display width is 255)

MEDIUMINT(_size_)

A medium-sized integer. Signed range is from -8388608 to 8388607. Unsigned range is from 0 to 16777215. _size_ specifies the minimum display width (max display width is 255)

INT(_size_)

A normal-size integer. Signed range is from -2147483648 to 2147483647. Unsigned range is from 0 to 4294967295. _size_ specifies minimum display width (max display width is 255)

INTEGER(_size_)

Synonym for INT(_size_)

BIGINT(_size_)

A large integer. Signed range is from -9223372036854775808 to 9223372036854775807. Unsigned range is from 0 to 18446744073709551615. _size_ specifies the minimum display width (max display width is 255)

DECIMAL(_size_, _d_)

An exact fixed-point number. _size_ indicates the total number of digits (max 65). _d_ indicates the number of digits after the decimal point (max 30). The default value for _size_ is 10. The default value for _d_ is 0.

DEC(_size_, _d_)

Synonym for DECIMAL(_size_, _d_)

FLOAT(_size_, _d_)

A small floating-point number. FLOAT(_size_, _d_) is deprecated in MySQL 8.0.17, and it will be removed in future MySQL versions

FLOAT(_p_)

A floating-point number. The _p_ value determines whether to use FLOAT or DOUBLE for the resulting data type. If _p_ is from 0 to 24, the data type becomes FLOAT. If _p_ is from 25 to 53, the data type becomes DOUBLE

DOUBLE(_size_, _d_)

A normal-size floating-point number. Permissible values are -1.7976931348623157E+308 to -2.2250738585072014E-308, 0, and 2.2250738585072014E-308 to 1.7976931348623157E+308. The total number of digits is specified in _size_. The number of digits after the decimal point is specified in the _d_ parameter

DOUBLE PRECISION(_size_, _d_)

Synonym for DOUBLE(_size_, _d_)

### Date and Time Data Types

Data type

Description

DATE

A date. Format: YYYY-MM-DD. The supported range is from '1000-01-01' to '9999-12-31'

DATETIME(_fsp_)

A date and time combination. Format: YYYY-MM-DD hh:mm:ss. The supported range is from '1000-01-01 00:00:00' to '9999-12-31 23:59:59'. Adding DEFAULT and ON UPDATE in the column definition to get automatic initialization and updating to the current date and time

TIMESTAMP(_fsp_)

A timestamp. Format: YYYY-MM-DD hh:mm:ss. TIMESTAMP values are stored as the number of seconds since the Unix epoch ('1970-01-01 00:00:00' UTC). The supported range is from '1970-01-01 00:00:01' UTC to '2038-01-09 03:14:07' UTC. Automatic initialization and updating to the current date and time can be specified using DEFAULT CURRENT\_TIMESTAMP and ON UPDATE CURRENT\_TIMESTAMP in the column definition

TIME(_fsp_)

A time. Format: hh:mm:ss. The supported range is from '-838:59:59' to '838:59:59'

YEAR

A year in a four-digit format (YYYY). Values allowed in four-digit format: 1901 to 2155, and 0000.

* * *

* * *

## SQL Server Data Types

In SQL Server there are three main data types: String, Numeric, and Date and Time.

### String Data Types

Data type

Description

Max char length

Storage

char(n)

Fixed-length non-Unicode character data (n must be between 1 and 8000)

8,000

n bytes (uses one byte for each character)

varchar(n)

Variable-length non-Unicode character data (n must be between 1 and 8000)

8,000

n bytes + 2 bytes

varchar(max)

Variable-length non-Unicode character data

 

up to 2 GB

nchar(n)

Fixed-length Unicode character data (n must be between 1 and 4000)

4,000

 2 \* n bytes (uses two bytes for each character)

nvarchar(n)

Variable-length Unicode character data (n must be between 1 and 4000)

4,000

2 \* n bytes + 2 bytes (uses two bytes for each character)

nvarchar(max)

Variable-length Unicode character data

 

up to 2 GB

binary(n)

Fixed-length binary data (n must be between 1 and 8000)

8,000

n bytes

varbinary(n)

Variable-length binary data (n must be between 1 and 8000)

8,000

actual length of data entered + 2 bytes

varbinary(max)

Variable-length binary data

2GB

 

### Numeric Data Types

Data type

Description

Storage

bit

Integer that can be 0, 1, or NULL

 

tinyint

Allows whole numbers from 0 to 255

1 byte

smallint

Allows whole numbers between -32,768 and 32,767

2 bytes

int

Allows whole numbers between -2,147,483,648 and 2,147,483,647

4 bytes

bigint

Allows whole numbers between -9,223,372,036,854,775,808 and 9,223,372,036,854,775,807

8 bytes

decimal(p,s)

Fixed precision and scale numbers.

Allows numbers from -10^38 +1 to 10^38 –1.

The p parameter indicates the maximum total number of digits that can be stored (both to the left and to the right of the decimal point). p must be a value from 1 to 38. Default is 18.

The s parameter indicates the maximum number of digits stored to the right of the decimal point. s must be a value from 0 to p. Default value is 0

5-17 bytes

numeric(p,s)

Fixed precision and scale numbers.

Allows numbers from -10^38 +1 to 10^38 –1.

The p parameter indicates the maximum total number of digits that can be stored (both to the left and to the right of the decimal point). p must be a value from 1 to 38. Default is 18.

The s parameter indicates the maximum number of digits stored to the right of the decimal point. s must be a value from 0 to p. Default value is 0

5-17 bytes

smallmoney

Monetary data from -214,748.3648 to 214,748.3647

4 bytes

money

Monetary data from -922,337,203,685,477.5808 to 922,337,203,685,477.5807

8 bytes

float(n)

Floating precision number data from -1.79E + 308 to 1.79E + 308.

The n parameter indicates whether the field should hold 4 or 8 bytes. float(24) holds a 4-byte field and float(53) holds an 8-byte field. Default value of n is 53.

4 or 8 bytes

real

Floating precision number data from -3.40E + 38 to 3.40E + 38

4 bytes

### Date and Time Data Types

Data type

Description

Storage

date

Store a date only. From January 1, 0001 to December 31, 9999

3 bytes

time

Store a time only to an accuracy of 100 nanoseconds

3-5 bytes

datetime

From January 1, 1753 to December 31, 9999 with an accuracy of 3.33 milliseconds

8 bytes

datetime2

From January 1, 0001 to December 31, 9999 with an accuracy of 100 nanoseconds

6-8 bytes

smalldatetime

From January 1, 1900 to June 6, 2079 with an accuracy of 1 minute

4 bytes

datetimeoffset

The same as datetime2 with the addition of a time zone offset

8-10 bytes

timestamp

Stores a unique number that gets updated every time a row gets created or modified. The timestamp value is based upon an internal clock and does not correspond to real time. Each table may have only one timestamp variable

 

### Other Data Types

Data type

Description

sql\_variant

Stores up to 8,000 bytes of data of various data types, except text, ntext, and timestamp

uniqueidentifier

Stores a globally unique identifier (GUID)

xml

Stores XML formatted data. Maximum 2GB

cursor

Stores a reference to a cursor used for database operations

table

Stores a result-set for later processing

* * *

## MS Access Data Types

Data type

Description

Storage

Text

Use for text or combinations of text and numbers. 255 characters maximum

 

Memo

Memo is used for larger amounts of text. Stores up to 65,536 characters. **Note:** You cannot sort a memo field. However, they are searchable

 

Byte

Allows whole numbers from 0 to 255

1 byte

Integer

Allows whole numbers between -32,768 and 32,767

2 bytes

Long

Allows whole numbers between -2,147,483,648 and 2,147,483,647

4 bytes

Single

Single precision floating-point. Will handle most decimals

4 bytes

Double

Double precision floating-point. Will handle most decimals

8 bytes

Currency

Use for currency. Holds up to 15 digits of whole dollars, plus 4 decimal places. **Tip:** You can choose which country's currency to use

8 bytes

AutoNumber

AutoNumber fields automatically give each record its own number, usually starting at 1

4 bytes

Date/Time

Use for dates and times

8 bytes

Yes/No

A logical field can be displayed as Yes/No, True/False, or On/Off. In code, use the constants True and False (equivalent to -1 and 0). **Note:** Null values are not allowed in Yes/No fields

1 bit

Ole Object

Can store pictures, audio, video, or other BLOBs (Binary Large Objects)

up to 1GB

Hyperlink

Contain links to other files, including web pages

 

Lookup Wizard

Let you type a list of options, which can then be chosen from a drop-down list

4 bytes

* * *

* * *