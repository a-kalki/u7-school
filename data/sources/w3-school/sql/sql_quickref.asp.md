# SQL Quick Reference from W3Schools

* * *

SQL Statement

Syntax

AND / OR

SELECT column\_name(s)  
FROM table\_name  
WHERE condition  
AND|OR condition

ALTER TABLE

ALTER TABLE table\_name  
ADD column\_name datatype

or

ALTER TABLE table\_name  
DROP COLUMN column\_name

AS (alias)

SELECT column\_name AS column\_alias  
FROM table\_name

or

SELECT column\_name  
FROM table\_name  AS table\_alias

BETWEEN

SELECT column\_name(s)  
FROM table\_name  
WHERE column\_name  
BETWEEN value1 AND value2

CREATE DATABASE

CREATE DATABASE database\_name

CREATE TABLE

CREATE TABLE table\_name  
(  
column\_name1 data\_type,  
column\_name2 data\_type,  
column\_name3 data\_type,  
...  
)

CREATE INDEX

CREATE INDEX index\_name  
ON table\_name (column\_name)

or

CREATE UNIQUE INDEX index\_name  
ON table\_name (column\_name)

CREATE VIEW

CREATE VIEW view\_name AS  
SELECT column\_name(s)  
FROM table\_name  
WHERE condition

DELETE

DELETE FROM table\_name  
WHERE some\_column=some\_value

or

DELETE FROM table\_name  
(**Note:** Deletes the entire table!!)

DELETE \* FROM table\_name  
(**Note:** Deletes the entire table!!)

DROP DATABASE

DROP DATABASE database\_name

DROP INDEX

DROP INDEX table\_name.index\_name (SQL Server)  
DROP INDEX index\_name ON table\_name (MS Access)  
DROP INDEX index\_name (DB2/Oracle)  
ALTER TABLE table\_name  
DROP INDEX index\_name (MySQL)

DROP TABLE

DROP TABLE table\_name

EXISTS

IF EXISTS (SELECT \* FROM table\_name WHERE id = ?)  
BEGIN  
\--do what needs to be done if exists  
END  
ELSE  
BEGIN  
\--do what needs to be done if not  
END

GROUP BY

SELECT column\_name, aggregate\_function(column\_name)  
FROM table\_name  
WHERE column\_name operator value  
GROUP BY column\_name

HAVING

SELECT column\_name, aggregate\_function(column\_name)  
FROM table\_name  
WHERE column\_name operator value  
GROUP BY column\_name  
HAVING aggregate\_function(column\_name) operator value

IN

SELECT column\_name(s)  
FROM table\_name  
WHERE column\_name  
IN (value1,value2,..)

INSERT INTO

INSERT INTO table\_name  
VALUES (value1, value2, value3,....)

_or_

INSERT INTO table\_name  
(column1, column2, column3,...)  
VALUES (value1, value2, value3,....)

INNER JOIN

SELECT column\_name(s)  
FROM table\_name1  
INNER JOIN table\_name2  
ON table\_name1.column\_name=table\_name2.column\_name

LEFT JOIN

SELECT column\_name(s)  
FROM table\_name1  
LEFT JOIN table\_name2  
ON table\_name1.column\_name=table\_name2.column\_name

RIGHT JOIN

SELECT column\_name(s)  
FROM table\_name1  
RIGHT JOIN table\_name2  
ON table\_name1.column\_name=table\_name2.column\_name

FULL JOIN

SELECT column\_name(s)  
FROM table\_name1  
FULL JOIN table\_name2  
ON table\_name1.column\_name=table\_name2.column\_name

LIKE

SELECT column\_name(s)  
FROM table\_name  
WHERE column\_name LIKE pattern

ORDER BY

SELECT column\_name(s)  
FROM table\_name  
ORDER BY column\_name \[ASC|DESC\]

SELECT

SELECT column\_name(s)  
FROM table\_name

SELECT \*

SELECT \*  
FROM table\_name

SELECT DISTINCT

SELECT DISTINCT column\_name(s)  
FROM table\_name

SELECT INTO

SELECT \*  
INTO new\_table\_name \[IN externaldatabase\]  
FROM old\_table\_name

_or_

SELECT column\_name(s)  
INTO new\_table\_name \[IN externaldatabase\]  
FROM old\_table\_name

SELECT TOP

SELECT TOP number|percent column\_name(s)  
FROM table\_name

TRUNCATE TABLE

TRUNCATE TABLE table\_name

UNION

SELECT column\_name(s) FROM table\_name1  
UNION  
SELECT column\_name(s) FROM table\_name2

UNION ALL

SELECT column\_name(s) FROM table\_name1  
UNION ALL  
SELECT column\_name(s) FROM table\_name2

UPDATE

UPDATE table\_name  
SET column1=value, column2=value,...  
WHERE some\_column=some\_value

WHERE

SELECT column\_name(s)  
FROM table\_name  
WHERE column\_name operator value

**Source : https://www.w3schools.com/sql/sql\_quickref.asp**

* * *

* * *